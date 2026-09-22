import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ResumeAnalysis } from "@/lib/gemini-resume-analysis";
import { calculateSkillGap, type SkillGapResult } from "@/lib/skill-gap";
import type { MatchableJob } from "@/lib/job-matching";

const GEMINI_MODEL = "gemini-2.5-flash";
const roadmapInput = z.object({
  resumeId: z.string().uuid(),
  jobId: z.string().uuid(),
  regenerate: z.boolean().optional().default(false),
});

const roadmapSchema = z.object({
  goal: z.string(),
  target_role: z.string(),
  current_level: z.string(),
  estimated_duration: z.string(),
  phases: z.array(
    z.object({
      title: z.string(),
      duration: z.string(),
      skills: z.array(z.string()),
      topics: z.array(z.string()),
      practice_tasks: z.array(z.string()),
      project: z.string(),
    }),
  ),
  final_project: z.string(),
  milestones: z.array(z.string()),
});

export type CareerRoadmap = z.infer<typeof roadmapSchema>;

export interface CareerRoadmapRecord {
  id: string;
  user_id: string;
  resume_id: string;
  job_id: string;
  model: string;
  roadmap: CareerRoadmap;
  status: "processing" | "completed" | "failed";
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface RoadmapContext {
  request: Request;
}

interface ResumeRecord {
  id: string;
  user_id: string;
  status: string;
}

interface JobRecord extends MatchableJob {
  id: string;
  title: string;
  company: string;
  location: string;
  employment_type: string;
}

function createAuthenticatedSupabaseClient(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Please sign in before generating a career roadmap.");
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

function safeRoadmapError(error: unknown): string {
  if (!(error instanceof Error)) return "UNKNOWN_ROADMAP_ERROR";
  const message = error.message.toLowerCase();
  if (message.includes("gemini is not configured")) return "ENV_MISSING";
  if (message.includes("please sign in")) return "AUTH_MISSING";
  if (message.includes("resume is not available")) return "RESUME_NOT_FOUND";
  if (message.includes("processed resume")) return "RESUME_NOT_PROCESSED";
  if (message.includes("resume analysis")) return "ANALYSIS_NOT_FOUND";
  if (message.includes("job is not available")) return "JOB_NOT_FOUND";
  if (message.includes("empty roadmap") || message.includes("invalid roadmap")) return "GEMINI_RESPONSE_INVALID";
  if (message.includes("save career roadmap") || message.includes("start career roadmap")) return "ROADMAP_SAVE_FAILED";
  if (/quota|rate limit|429|permission|forbidden|\b(400|401|403|429|500|502|503|504)\b/.test(message)) {
    return "GEMINI_REQUEST_FAILED";
  }
  return "UNKNOWN_ROADMAP_ERROR";
}

const geminiRoadmapSchema = {
  type: Type.OBJECT,
  properties: {
    goal: { type: Type.STRING },
    target_role: { type: Type.STRING },
    current_level: { type: Type.STRING },
    estimated_duration: { type: Type.STRING },
    phases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          duration: { type: Type.STRING },
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          topics: { type: Type.ARRAY, items: { type: Type.STRING } },
          practice_tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
          project: { type: Type.STRING },
        },
        required: ["title", "duration", "skills", "topics", "practice_tasks", "project"],
      },
    },
    final_project: { type: Type.STRING },
    milestones: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["goal", "target_role", "current_level", "estimated_duration", "phases", "final_project", "milestones"],
};

function roadmapPrompt(
  analysis: ResumeAnalysis,
  job: JobRecord,
  skillGap: SkillGapResult,
): string {
  return `Create a concise career roadmap as valid JSON matching the provided schema.

Use only the structured candidate and job data below. Do not invent candidate facts, experience, education, projects, or certifications. The roadmap should focus on closing missing required skills first, then missing preferred skills. Keep recommendations practical and grounded in the target role. Do not include a resume rewrite, job match score, interview questions, or unrelated career claims.

Candidate structured analysis:
${JSON.stringify({
  summary: analysis.summary,
  skills: analysis.skills,
  education: analysis.education,
  experience: analysis.experience,
  projects: analysis.projects,
  certifications: analysis.certifications,
})}

Target job:
${JSON.stringify({
  title: job.title,
  company: job.company,
  location: job.location,
  employment_type: job.employment_type,
  required_skills: job.required_skills,
  preferred_skills: job.preferred_skills,
})}

Deterministic skill gap:
${JSON.stringify({
  coverage_percentage: skillGap.coveragePercentage,
  matched_required_skills: skillGap.matchedRequiredSkills,
  missing_required_skills: skillGap.missingRequiredSkills,
  matched_preferred_skills: skillGap.matchedPreferredSkills,
  missing_preferred_skills: skillGap.missingPreferredSkills,
  priority_skills: skillGap.prioritySkills,
})}`;
}

async function setRoadmapFailure(
  supabase: ReturnType<typeof createAuthenticatedSupabaseClient>,
  roadmapId: string,
  userId: string,
  errorMessage: string,
): Promise<void> {
  const { error } = await supabase
    .from("career_roadmaps")
    .update({ status: "failed", error_message: errorMessage })
    .eq("id", roadmapId)
    .eq("user_id", userId);
  if (error && import.meta.env.DEV) {
    console.error("Supabase career roadmap failure update failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }
}

async function generateCareerRoadmapOnServer(
  resumeId: string,
  jobId: string,
  regenerate: boolean,
  context: RoadmapContext,
): Promise<CareerRoadmapRecord> {
  const supabase = createAuthenticatedSupabaseClient(context.request);
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("Please sign in before generating a career roadmap.");
  const userId = authData.user.id;

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .select("id, user_id, status")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .maybeSingle<ResumeRecord>();
  if (resumeError || !resume) throw new Error("The selected resume is not available.");
  if (resume.status !== "processed") throw new Error("The selected resume must be processed first.");

  const { data: analysis, error: analysisError } = await supabase
    .from("resume_analyses")
    .select("id, resume_id, user_id, model, analysis, status, error_message, created_at, updated_at")
    .eq("resume_id", resume.id)
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ analysis: ResumeAnalysis; status: "completed" }>();
  if (analysisError || !analysis) throw new Error("A completed resume analysis is required first.");

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, title, company, location, employment_type, required_skills, preferred_skills")
    .eq("id", jobId)
    .maybeSingle<JobRecord>();
  if (jobError || !job) throw new Error("The selected job is not available.");

  const skillGap = calculateSkillGap(analysis.analysis.skills, job);
  const { data: existing, error: existingError } = await supabase
    .from("career_roadmaps")
    .select("id, user_id, resume_id, job_id, model, roadmap, status, error_message, created_at, updated_at")
    .eq("user_id", userId)
    .eq("resume_id", resume.id)
    .eq("job_id", job.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<CareerRoadmapRecord>();
  if (existingError) throw new Error("We could not load the existing career roadmap.");
  if (existing?.status === "completed" && !regenerate) return existing;

  const model = GEMINI_MODEL;
  let activeRoadmap: CareerRoadmapRecord;
  if (existing) {
    const { data, error } = await supabase
      .from("career_roadmaps")
      .update({ status: "processing", error_message: null, model })
      .eq("id", existing.id)
      .eq("user_id", userId)
      .select("id, user_id, resume_id, job_id, model, roadmap, status, error_message, created_at, updated_at")
      .single<CareerRoadmapRecord>();
    if (error || !data) throw new Error("We could not start the career roadmap.");
    activeRoadmap = data;
  } else {
    const { data, error } = await supabase
      .from("career_roadmaps")
      .insert({ user_id: userId, resume_id: resume.id, job_id: job.id, model, roadmap: {}, status: "processing" })
      .select("id, user_id, resume_id, job_id, model, roadmap, status, error_message, created_at, updated_at")
      .single<CareerRoadmapRecord>();
    if (error || !data) throw new Error("We could not start the career roadmap.");
    activeRoadmap = data;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const response = await ai.models.generateContent({
      model,
      contents: roadmapPrompt(analysis.analysis, job, skillGap),
      config: { temperature: 0.2, responseMimeType: "application/json", responseSchema: geminiRoadmapSchema },
    });
    const rawText = response.text?.trim();
    if (!rawText) throw new Error("Gemini returned an empty roadmap.");
    const roadmap = roadmapSchema.parse(JSON.parse(rawText));
    const { data, error } = await supabase
      .from("career_roadmaps")
      .update({ roadmap, model, status: "completed", error_message: null })
      .eq("id", activeRoadmap.id)
      .eq("user_id", userId)
      .select("id, user_id, resume_id, job_id, model, roadmap, status, error_message, created_at, updated_at")
      .single<CareerRoadmapRecord>();
    if (error || !data) throw new Error("We could not save the career roadmap.");
    return data;
  } catch (error) {
    const category = safeRoadmapError(error);
    await setRoadmapFailure(supabase, activeRoadmap.id, userId, category);
    throw new Error("We could not generate the career roadmap. Please try again.");
  }
}

export const generateCareerRoadmap = createServerFn({ method: "POST" })
  .validator(roadmapInput)
  .handler(async ({ data, context }) =>
    generateCareerRoadmapOnServer(data.resumeId, data.jobId, data.regenerate, context as RoadmapContext),
  );
