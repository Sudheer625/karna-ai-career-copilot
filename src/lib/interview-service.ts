import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ResumeAnalysis } from "@/lib/gemini-resume-analysis";

const GEMINI_MODEL = "gemini-2.5-flash";
const interviewInput = z.object({
  sessionId: z.string().uuid(),
  regenerate: z.boolean().optional().default(false),
});

const questionSchema = z.object({
  question: z.string().trim().min(1),
  category: z.enum(["Technical", "Behavioral", "Project", "Role-specific"]),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
});

function hasUniqueQuestionText(questions: Array<{ question: string }>): boolean {
  const normalizedQuestions = questions.map(({ question }) =>
    question.trim().normalize("NFKC").replace(/\s+/g, " ").toLowerCase(),
  );
  return new Set(normalizedQuestions).size === normalizedQuestions.length;
}

const generatedQuestionsSchema = z.array(questionSchema).length(8).superRefine((questions, context) => {
  if (!hasUniqueQuestionText(questions)) {
    context.addIssue({ code: "custom", message: "Interview questions must be unique." });
  }
});

const storedQuestionsSchema = z.array(
  questionSchema.extend({
    id: z.string().uuid(),
    session_id: z.string().uuid(),
    question_order: z.number().int(),
    created_at: z.string(),
    updated_at: z.string(),
  }),
).length(8);

export interface InterviewQuestionRecord {
  id: string;
  session_id: string;
  question_order: number;
  question: string;
  category: z.infer<typeof questionSchema>["category"];
  difficulty: z.infer<typeof questionSchema>["difficulty"];
  created_at: string;
  updated_at: string;
}

interface InterviewContext {
  request: Request;
}

interface InterviewSessionRecord {
  id: string;
  user_id: string;
  resume_id: string | null;
  job_id: string | null;
  target_role: string | null;
  interview_type: string;
  status: "created" | "in_progress" | "completed" | "failed";
}

interface ProcessedResumeRecord {
  id: string;
  status: string;
}

interface CompletedAnalysisRecord {
  analysis: ResumeAnalysis;
}

interface InterviewJobRecord {
  id: string;
  title: string;
  company: string;
  required_skills: string[];
  preferred_skills: string[];
}

function createAuthenticatedSupabaseClient(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Please sign in before generating interview questions.");
  }
  const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"];
  const supabasePublishableKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase configuration is missing.");
  }
  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
}

function getGeminiApiKey(): string {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("Gemini is not configured on the server.");
  return apiKey;
}

function classifyInterviewError(error: unknown): string {
  if (!(error instanceof Error)) return "UNKNOWN_SERVER_ERROR";
  const message = error.message.toLowerCase();
  if (message.includes("gemini is not configured") || message.includes("api key")) return "ENV_MISSING";
  if (message.includes("empty interview questions") || message.includes("invalid interview questions")) {
    return "GEMINI_RESPONSE_INVALID";
  }
  if (message.includes("save interview questions") || message.includes("update interview session")) {
    return "SUPABASE_SAVE_FAILED";
  }
  if (/quota|rate limit|429|permission|forbidden|\b(400|401|403|429|500|502|503|504)\b/.test(message)) {
    return "GEMINI_REQUEST_FAILED";
  }
  return "UNKNOWN_SERVER_ERROR";
}

const geminiQuestionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING },
      category: { type: Type.STRING, enum: ["Technical", "Behavioral", "Project", "Role-specific"] },
      difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
    },
    required: ["question", "category", "difficulty"],
  },
};

function interviewPrompt(
  analysis: ResumeAnalysis,
  job: InterviewJobRecord | null,
  targetRole: string,
  interviewType: string,
): string {
  return `Generate exactly 8 practical interview questions as JSON matching the provided schema.

Questions must be relevant to the candidate and selected role. Use demonstrated resume information only; do not invent candidate experience. Include questions targeting relevant missing skills when appropriate. Avoid duplicate questions. Use categories Technical, Behavioral, Project, or Role-specific, and difficulties Easy, Medium, or Hard. Return structured JSON only.

Candidate structured resume analysis:
${JSON.stringify({
  summary: analysis.summary,
  skills: analysis.skills,
  education: analysis.education,
  experience: analysis.experience,
  projects: analysis.projects,
  certifications: analysis.certifications,
  recommended_roles: analysis.recommended_roles,
  missing_skills: analysis.missing_skills,
})}

Target role: ${targetRole}
Interview type: ${interviewType}
Job requirements:
${JSON.stringify(job ? {
  title: job.title,
  company: job.company,
  required_skills: job.required_skills,
  preferred_skills: job.preferred_skills,
} : null)}`;
}

async function setSessionStatus(
  supabase: ReturnType<typeof createAuthenticatedSupabaseClient>,
  sessionId: string,
  userId: string,
  status: "in_progress" | "failed",
): Promise<void> {
  const { error } = await supabase
    .from("interview_sessions")
    .update({ status })
    .eq("id", sessionId)
    .eq("user_id", userId);
  if (error) throw new Error("We could not update the interview session.");
}

async function markGenerationFailed(
  supabase: ReturnType<typeof createAuthenticatedSupabaseClient>,
  sessionId: string,
  userId: string,
): Promise<void> {
  await supabase
    .from("interview_sessions")
    .update({ status: "failed" })
    .eq("id", sessionId)
    .eq("user_id", userId);
}

async function generateInterviewQuestionsOnServer(
  sessionId: string,
  regenerate: boolean,
  context: InterviewContext,
): Promise<InterviewQuestionRecord[]> {
  const supabase = createAuthenticatedSupabaseClient(context.request);
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("Please sign in before generating interview questions.");
  const userId = authData.user.id;

  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .select("id, user_id, resume_id, job_id, target_role, interview_type, status")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle<InterviewSessionRecord>();
  if (sessionError || !session) throw new Error("The interview session is not available.");

  const interviewType = session.interview_type.trim().toLowerCase();
  const supportedInterviewTypes = ["technical", "behavioral", "project", "mixed", "hr"];
  if (!supportedInterviewTypes.includes(interviewType)) {
    throw new Error("The interview type is not supported.");
  }
  if (!session.resume_id) throw new Error("A processed resume is required for interview questions.");

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .select("id, status")
    .eq("id", session.resume_id)
    .eq("user_id", userId)
    .maybeSingle<ProcessedResumeRecord>();
  if (resumeError || !resume || resume.status !== "processed") {
    throw new Error("A processed resume is required for interview questions.");
  }

  const { data: analysisRecord, error: analysisError } = await supabase
    .from("resume_analyses")
    .select("analysis")
    .eq("resume_id", resume.id)
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<CompletedAnalysisRecord>();
  if (analysisError || !analysisRecord) {
    throw new Error("A completed resume analysis is required for interview questions.");
  }

  let job: InterviewJobRecord | null = null;
  if (session.job_id) {
    const { data: jobRecord, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, company, required_skills, preferred_skills")
      .eq("id", session.job_id)
      .maybeSingle<InterviewJobRecord>();
    if (jobError || !jobRecord) throw new Error("The selected target job is not available.");
    job = jobRecord;
  }

  const targetRole = session.target_role?.trim() || job?.title.trim() || analysisRecord.analysis.recommended_roles[0]?.trim();
  if (!targetRole) throw new Error("A target role is required for interview questions.");

  const { data: existingQuestions, error: questionsError } = await supabase
    .from("interview_questions")
    .select("id, session_id, question_order, question, category, difficulty, created_at, updated_at")
    .eq("session_id", session.id)
    .order("question_order", { ascending: true });
  if (questionsError) throw new Error("We could not load the interview questions.");

  if (!regenerate && existingQuestions?.length === 8) {
    const parsedQuestions = storedQuestionsSchema.safeParse(existingQuestions);
    const ordered = parsedQuestions.success && parsedQuestions.data.every(
      (question, index) => question.question_order === index + 1,
    );
    const unique = parsedQuestions.success && hasUniqueQuestionText(parsedQuestions.data);
    if (parsedQuestions.success && ordered && unique) {
      if (session.status === "created" || session.status === "failed") {
        await setSessionStatus(supabase, session.id, userId, "in_progress");
      }
      return parsedQuestions.data;
    }
  }

  try {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: interviewPrompt(analysisRecord.analysis, job, targetRole, interviewType),
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: geminiQuestionSchema,
      },
    });
    const rawText = response.text?.trim();
    if (!rawText) throw new Error("Gemini returned empty interview questions.");
    const questions = generatedQuestionsSchema.parse(JSON.parse(rawText));

    const rows = questions.map((question, index) => ({
      session_id: session.id,
      question_order: index + 1,
      ...question,
      user_answer: null,
      evaluation: null,
    }));
    const { error: staleQuestionsError } = await supabase
      .from("interview_questions")
      .delete()
      .eq("session_id", session.id)
      .or("question_order.lt.1,question_order.gt.8");
    if (staleQuestionsError) throw new Error("We could not save interview questions.");

    const { data: savedQuestions, error: saveError } = await supabase
      .from("interview_questions")
      .upsert(rows, { onConflict: "session_id,question_order" })
      .select("id, session_id, question_order, question, category, difficulty, created_at, updated_at");
    if (saveError || !savedQuestions || savedQuestions.length !== 8) {
      throw new Error("We could not save interview questions.");
    }

    await setSessionStatus(supabase, session.id, userId, "in_progress");
    const orderedSavedQuestions = [...savedQuestions].sort(
      (first, second) => first.question_order - second.question_order,
    );
    const stored = storedQuestionsSchema.safeParse(orderedSavedQuestions);
    if (!stored.success || !stored.data.every((question, index) => question.question_order === index + 1)) {
      throw new Error("We could not save interview questions.");
    }
    return stored.data;
  } catch (error) {
    const category = classifyInterviewError(error);
    await markGenerationFailed(supabase, session.id, userId);
    if (import.meta.env.DEV) console.error("Interview question generation failed", { category });
    throw new Error("We could not generate interview questions. Please try again.");
  }
}

export const generateInterviewQuestions = createServerFn({ method: "POST" })
  .validator(interviewInput)
  .handler(async ({ data, context }) =>
    generateInterviewQuestionsOnServer(data.sessionId, data.regenerate, context as InterviewContext),
  );