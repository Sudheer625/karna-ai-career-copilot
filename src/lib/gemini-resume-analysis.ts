import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GEMINI_MODEL = "gemini-2.5-flash";
const analysisInput = z.object({
  resumeId: z.string().uuid(),
  regenerate: z.boolean().optional().default(false),
});

const resumeAnalysisSchema = z.object({
  summary: z.string(),
  skills: z.array(
    z.object({
      name: z.string(),
      category: z.enum(["technical", "soft"]),
      proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]),
    }),
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      institution: z.string(),
      year: z.string(),
    }),
  ),
  experience: z.array(
    z.object({
      role: z.string(),
      company: z.string(),
      duration: z.string(),
      highlights: z.array(z.string()),
    }),
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      technologies: z.array(z.string()),
    }),
  ),
  certifications: z.array(
    z.object({
      name: z.string(),
      issuer: z.string(),
    }),
  ),
  recommended_roles: z.array(z.string()),
  missing_skills: z.array(z.string()),
});

export type ResumeAnalysis = z.infer<typeof resumeAnalysisSchema>;

export interface ResumeAnalysisRecord {
  id: string;
  resume_id: string;
  user_id: string;
  model: string;
  analysis: ResumeAnalysis;
  status: "processing" | "completed" | "failed";
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface AnalysisContext {
  request: Request;
}

interface ResumeRecord {
  id: string;
  user_id: string;
  status: string;
  extracted_text: string | null;
}

function createAuthenticatedSupabaseClient(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Please sign in before analyzing a resume.");
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

function classifyAnalysisError(error: unknown): string {
  if (!(error instanceof Error)) return "UNKNOWN_SERVER_ERROR";

  const message = error.message.toLowerCase();

  if (message.includes("gemini is not configured") || message.includes("api key")) {
    return "ENV_MISSING";
  }
  if (message.includes("please sign in before analyzing a resume")) {
    return "AUTH_MISSING";
  }
  if (message.includes("that resume is no longer available")) {
    return "RESUME_NOT_FOUND";
  }
  if (message.includes("processed resume text")) {
    return "RESUME_NOT_PROCESSED";
  }
  if (message.includes("empty analysis") || message.includes("invalid json") || message.includes("schema")) {
    return "GEMINI_RESPONSE_INVALID";
  }
  if (
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("429") ||
    message.includes("permission") ||
    message.includes("forbidden") ||
    /\b(400|401|403|429|500|502|503|504)\b/.test(message)
  ) {
    return "GEMINI_REQUEST_FAILED";
  }
  if (message.includes("we could not start resume analysis") || message.includes("we could not save the resume analysis")) {
    return "SUPABASE_SAVE_FAILED";
  }

  return "UNKNOWN_SERVER_ERROR";
}

function safeAnalysisError(error: unknown): string {
  if (error instanceof Error && error.message === "Gemini is not configured on the server.") {
    return error.message;
  }
  if (error instanceof Error && error.message === "Resume analysis requires processed resume text.") {
    return error.message;
  }
  return "We could not generate resume analysis. Please try again.";
}

const geminiResponseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING, enum: ["technical", "soft"] },
          proficiency: {
            type: Type.STRING,
            enum: ["beginner", "intermediate", "advanced", "expert"],
          },
        },
        required: ["name", "category", "proficiency"],
      },
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          degree: { type: Type.STRING },
          institution: { type: Type.STRING },
          year: { type: Type.STRING },
        },
        required: ["degree", "institution", "year"],
      },
    },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING },
          company: { type: Type.STRING },
          duration: { type: Type.STRING },
          highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["role", "company", "duration", "highlights"],
      },
    },
    projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["name", "description", "technologies"],
      },
    },
    certifications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          issuer: { type: Type.STRING },
        },
        required: ["name", "issuer"],
      },
    },
    recommended_roles: { type: Type.ARRAY, items: { type: Type.STRING } },
    missing_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    "summary",
    "skills",
    "education",
    "experience",
    "projects",
    "certifications",
    "recommended_roles",
    "missing_skills",
  ],
};

const analysisPrompt = (extractedText: string) => `
Analyze the following resume and return only valid JSON matching the provided response schema.

Rules:
- Do not invent facts that are not present in the resume.
- Use empty strings or empty arrays when information is missing.
- Preserve resume information faithfully.
- Recommended roles and missing skills may be inferred only from demonstrated evidence in the resume.
- Keep the output concise and structured.
- Do not write a resume rewrite, job match, interview questions, or career roadmap.

Resume text:
${extractedText}
`;

async function updateAnalysisFailure(
  supabase: ReturnType<typeof createAuthenticatedSupabaseClient>,
  analysisId: string,
  userId: string,
  errorMessage: string,
): Promise<void> {
  const { error } = await supabase
    .from("resume_analyses")
    .update({ status: "failed", error_message: errorMessage })
    .eq("id", analysisId)
    .eq("user_id", userId);
  if (error && import.meta.env.DEV) {
    console.error("Supabase resume analysis failure update failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }
}

async function analyzeResumeOnServer(
  resumeId: string,
  regenerate: boolean,
  context: AnalysisContext,
): Promise<ResumeAnalysisRecord> {
  const supabase = createAuthenticatedSupabaseClient(context.request);
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("Please sign in before analyzing a resume.");
  const userId = authData.user.id;

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .select("id, user_id, status, extracted_text")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .maybeSingle<ResumeRecord>();
  if (resumeError || !resume) throw new Error("That resume is no longer available.");
  if (resume.status !== "processed" || !resume.extracted_text?.trim()) {
    throw new Error("Resume analysis requires processed resume text.");
  }

  const { data: existingAnalysis, error: existingError } = await supabase
    .from("resume_analyses")
    .select("id, resume_id, user_id, model, analysis, status, error_message, created_at, updated_at")
    .eq("resume_id", resume.id)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ResumeAnalysisRecord>();
  if (existingError) throw new Error("We could not load the existing resume analysis.");
  if (existingAnalysis?.status === "completed" && !regenerate) return existingAnalysis;

  const analysisId = existingAnalysis?.id;
  let activeAnalysis: ResumeAnalysisRecord;
  if (analysisId) {
    const { data, error } = await supabase
      .from("resume_analyses")
      .update({ status: "processing", error_message: null, model: GEMINI_MODEL })
      .eq("id", analysisId)
      .eq("user_id", userId)
      .select("id, resume_id, user_id, model, analysis, status, error_message, created_at, updated_at")
      .single<ResumeAnalysisRecord>();
    if (error || !data) throw new Error("We could not start resume analysis.");
    activeAnalysis = data;
  } else {
    const { data, error } = await supabase
      .from("resume_analyses")
      .insert({
        resume_id: resume.id,
        user_id: userId,
        model: GEMINI_MODEL,
        analysis: {},
        status: "processing",
        error_message: null,
      })
      .select("id, resume_id, user_id, model, analysis, status, error_message, created_at, updated_at")
      .single<ResumeAnalysisRecord>();
    if (error || !data) throw new Error("We could not start resume analysis.");
    activeAnalysis = data;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: analysisPrompt(resume.extracted_text),
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: geminiResponseSchema,
      },
    });
    const rawText = response.text?.trim();
    if (!rawText) throw new Error("Gemini returned an empty analysis.");
    const analysis = resumeAnalysisSchema.parse(JSON.parse(rawText));

    const { data, error } = await supabase
      .from("resume_analyses")
      .update({ analysis, model: GEMINI_MODEL, status: "completed", error_message: null })
      .eq("id", activeAnalysis.id)
      .eq("user_id", userId)
      .select("id, resume_id, user_id, model, analysis, status, error_message, created_at, updated_at")
      .single<ResumeAnalysisRecord>();
    if (error || !data) throw new Error("We could not save the resume analysis.");
    return data;
  } catch (error) {
    const category = classifyAnalysisError(error);
    const message = safeAnalysisError(error);
    if (import.meta.env.DEV) {
      console.error("Resume analysis failed", { category });
    }
    await updateAnalysisFailure(supabase, activeAnalysis.id, userId, category);
    throw new Error(message);
  }
}

export const analyzeResume = createServerFn({ method: "POST" })
  .validator(analysisInput)
  .handler(async ({ data, context }) =>
    analyzeResumeOnServer(data.resumeId, data.regenerate, context as AnalysisContext),
  );

export const getResumeAnalysis = createServerFn({ method: "POST" })
  .validator(z.object({ resumeId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const supabase = createAuthenticatedSupabaseClient((context as AnalysisContext).request);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) throw new Error("Please sign in before loading analysis.");
    const { data: analysis, error } = await supabase
      .from("resume_analyses")
      .select("id, resume_id, user_id, model, analysis, status, error_message, created_at, updated_at")
      .eq("resume_id", data.resumeId)
      .eq("user_id", authData.user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<ResumeAnalysisRecord>();
    if (error) throw new Error("We could not load the resume analysis.");
    return analysis;
  });
