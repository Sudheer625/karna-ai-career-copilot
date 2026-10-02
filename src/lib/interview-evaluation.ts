import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GEMINI_MODEL = "gemini-2.5-flash";
const evaluationInput = z.object({
  sessionId: z.string().uuid(),
  regenerate: z.boolean().optional().default(false),
});

const perQuestionEvaluationSchema = z.object({
  score: z.number().int().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  feedback: z.string().trim().min(1),
  ideal_answer_guidance: z.string().trim().min(1),
}).strict();

const overallEvaluationSchema = z.object({
  overall_score: z.number().int().min(0).max(100),
  summary: z.string().trim().min(1),
  strengths: z.array(z.string()),
  improvement_areas: z.array(z.string()),
  recommendations: z.array(z.string()),
}).strict();

const geminiEvaluationSchema = z.object({
  question_evaluations: z.array(perQuestionEvaluationSchema).length(8),
  overall_score: z.number().int().min(0).max(100),
  summary: z.string().trim().min(1),
  strengths: z.array(z.string()),
  improvement_areas: z.array(z.string()),
  recommendations: z.array(z.string()),
}).strict();

const evaluationQuestionInputSchema = z.object({
  question: z.string().trim().min(1),
  category: z.enum(["Technical", "Behavioral", "Project", "Role-specific"]),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  user_answer: z.string().trim().min(1),
});

type PerQuestionEvaluation = z.infer<typeof perQuestionEvaluationSchema>;
type OverallEvaluation = z.infer<typeof overallEvaluationSchema>;

export interface InterviewEvaluationResult {
  sessionId: string;
  model: string;
  evaluation: OverallEvaluation;
  questionEvaluations: Array<{
    questionOrder: number;
    evaluation: PerQuestionEvaluation;
  }>;
}

function failEvaluation(): never {
  throw new Error("Interview evaluation could not be completed.");
}

interface EvaluationContext {
  request: Request;
}

interface EvaluationSessionRecord {
  id: string;
  user_id: string;
  status: string;
  target_role: string | null;
  interview_type: string;
  evaluation: unknown;
  evaluation_model: string | null;
}

interface EvaluationQuestionRecord {
  id: string;
  session_id: string;
  question_order: number;
  question: string;
  category: string | null;
  difficulty: string | null;
  user_answer: string | null;
  evaluation: unknown;
}

function createAuthenticatedSupabaseClient(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    failEvaluation();
  }
  const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"];
  const supabasePublishableKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!supabaseUrl || !supabasePublishableKey) {
    failEvaluation();
  }
  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
}

function getGeminiApiKey(): string {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) failEvaluation();
  return apiKey;
}

const geminiPerQuestionSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
    feedback: { type: Type.STRING },
    ideal_answer_guidance: { type: Type.STRING },
  },
  required: ["score", "strengths", "weaknesses", "feedback", "ideal_answer_guidance"],
};

const geminiResponseSchema = {
  type: Type.OBJECT,
  properties: {
    question_evaluations: {
      type: Type.ARRAY,
      items: geminiPerQuestionSchema,
    },
    overall_score: { type: Type.INTEGER },
    summary: { type: Type.STRING },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvement_areas: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    "question_evaluations",
    "overall_score",
    "summary",
    "strengths",
    "improvement_areas",
    "recommendations",
  ],
};

function evaluationPrompt(
  targetRole: string,
  interviewType: string,
  questions: Array<z.infer<typeof evaluationQuestionInputSchema>>,
): string {
  return `Evaluate the candidate's answers and return only structured JSON matching the provided schema.

Evaluate only the candidate's provided answer. Do not invent candidate experience. Do not penalize an answer for skills not required by that question. Evaluate technical correctness, relevance, completeness, and clarity appropriate to each question's category and difficulty. Keep all feedback actionable. Do not reveal hidden reasoning or chain-of-thought. Return exactly 8 per-question evaluations in the same order as the supplied questions.

Interview data:
${JSON.stringify({ target_role: targetRole, interview_type: interviewType, questions })}`;
}

async function runInterviewEvaluation(
  sessionId: string,
  regenerate: boolean,
  context: EvaluationContext,
): Promise<InterviewEvaluationResult> {
  const supabase = createAuthenticatedSupabaseClient(context.request);
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) failEvaluation();
  const userId = authData.user.id;

  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .select("id, user_id, status, target_role, interview_type, evaluation, evaluation_model")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle<EvaluationSessionRecord>();
  if (sessionError || !session || session.status !== "completed") failEvaluation();

  const { data: questions, error: questionsError } = await supabase
    .from("interview_questions")
    .select("id, session_id, question_order, question, category, difficulty, user_answer, evaluation")
    .eq("session_id", session.id)
    .order("question_order", { ascending: true })
    .returns<EvaluationQuestionRecord[]>();
  if (questionsError) failEvaluation();
  if (!questions || questions.length !== 8 || !questions.every((question, index) => question.question_order === index + 1)) {
    failEvaluation();
  }

  const structuredQuestions = questions.map((question) => {
    if (!question.user_answer?.trim()) failEvaluation();
    const parsed = evaluationQuestionInputSchema.safeParse({
      question: question.question,
      category: question.category,
      difficulty: question.difficulty,
      user_answer: question.user_answer,
    });
    if (!parsed.success) failEvaluation();
    return parsed.data;
  });

  const targetRole = session.target_role?.trim();
  if (!targetRole || !session.interview_type.trim()) {
    failEvaluation();
  }

  const storedOverall = overallEvaluationSchema.safeParse(session.evaluation);
  const storedQuestionEvaluations = questions.map((question) =>
    perQuestionEvaluationSchema.safeParse(question.evaluation),
  );
  const allStoredQuestionEvaluationsValid = storedQuestionEvaluations.every((result) => result.success);
  const hasStoredEvaluation = session.evaluation !== null || questions.some((question) => question.evaluation !== null);

  if (
    !regenerate && storedOverall.success && allStoredQuestionEvaluationsValid &&
    session.evaluation_model?.trim()
  ) {
    return {
      sessionId: session.id,
      model: session.evaluation_model,
      evaluation: storedOverall.data,
      questionEvaluations: questions.map((question, index) => ({
        questionOrder: question.question_order,
        evaluation: (storedQuestionEvaluations[index] as { success: true; data: PerQuestionEvaluation }).data,
      })),
    };
  }

  if (!regenerate && hasStoredEvaluation) {
    failEvaluation();
  }

  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  let responseText: string;
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: evaluationPrompt(targetRole, session.interview_type, structuredQuestions),
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: geminiResponseSchema,
      },
    });
    responseText = response.text?.trim() ?? "";
  } catch {
    failEvaluation();
  }

  if (!responseText) failEvaluation();
  let generatedEvaluation: z.infer<typeof geminiEvaluationSchema>;
  try {
    generatedEvaluation = geminiEvaluationSchema.parse(JSON.parse(responseText));
  } catch {
    failEvaluation();
  }
  const overallEvaluation = overallEvaluationSchema.parse({
    overall_score: generatedEvaluation.overall_score,
    summary: generatedEvaluation.summary,
    strengths: generatedEvaluation.strengths,
    improvement_areas: generatedEvaluation.improvement_areas,
    recommendations: generatedEvaluation.recommendations,
  });

  const evaluatedQuestionRows = questions.map((question, index) => ({
    id: question.id,
    session_id: question.session_id,
    question_order: question.question_order,
    question: question.question,
    category: question.category,
    difficulty: question.difficulty,
    user_answer: question.user_answer,
    evaluation: generatedEvaluation.question_evaluations[index],
  }));
  const { data: savedQuestions, error: questionSaveError } = await supabase
    .from("interview_questions")
    .upsert(evaluatedQuestionRows, { onConflict: "session_id,question_order" })
    .select("id");
  if (questionSaveError || savedQuestions?.length !== 8) failEvaluation();

  const { data: savedSession, error: sessionSaveError } = await supabase
    .from("interview_sessions")
    .update({ evaluation: overallEvaluation, evaluation_model: GEMINI_MODEL })
    .eq("id", session.id)
    .eq("user_id", userId)
    .eq("status", "completed")
    .select("id")
    .maybeSingle();
  if (sessionSaveError || !savedSession) failEvaluation();

  return {
    sessionId: session.id,
    model: GEMINI_MODEL,
    evaluation: overallEvaluation,
    questionEvaluations: generatedEvaluation.question_evaluations.map((evaluation, index) => ({
      questionOrder: index + 1,
      evaluation,
    })),
  };
}

async function evaluateInterviewOnServer(
  sessionId: string,
  regenerate: boolean,
  context: EvaluationContext,
): Promise<InterviewEvaluationResult> {
  try {
    return await runInterviewEvaluation(sessionId, regenerate, context);
  } catch {
    throw new Error("We could not evaluate this interview. Please try again.");
  }
}

export const evaluateInterview = createServerFn({ method: "POST" })
  .validator(evaluationInput)
  .handler(async ({ data, context }) =>
    evaluateInterviewOnServer(data.sessionId, data.regenerate, context as EvaluationContext),
  );