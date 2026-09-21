import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { extractText } from "unpdf";
import { z } from "zod";

const RESUME_BUCKET = "resumes";
const resumeInput = z.object({ resumeId: z.string().uuid() });

export interface ProcessedResumeResult {
  resumeId: string;
  status: "processed";
  extractedCharacterCount: number;
}

interface ResumeRecord {
  id: string;
  user_id: string;
  storage_path: string;
  mime_type: string;
}

interface ResumeProcessingContext {
  request: Request;
}

function safeProcessingError(error: unknown): string {
  if (error instanceof Error && error.message === "The PDF does not contain readable text.") {
    return error.message;
  }
  return "We could not extract readable text from this PDF.";
}

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

function createAuthenticatedSupabaseClient(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Please sign in before processing a resume.");
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

async function setProcessingFailure(
  supabase: ReturnType<typeof createAuthenticatedSupabaseClient>,
  resumeId: string,
  userId: string,
  processingError: string,
): Promise<void> {
  const { error } = await supabase
    .from("resumes")
    .update({ status: "failed", processing_error: processingError })
    .eq("id", resumeId)
    .eq("user_id", userId);
  if (error && import.meta.env.DEV) {
    console.error("Supabase resume processing failure update failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }
}

async function processResumeOnServer(
  resumeId: string,
  context: ResumeProcessingContext,
): Promise<ProcessedResumeResult> {
  const supabase = createAuthenticatedSupabaseClient(context.request);
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("Please sign in before processing a resume.");
  const userId = authData.user.id;

  const { data: resume, error: readError } = await supabase
    .from("resumes")
    .select("id, user_id, storage_path, mime_type")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .maybeSingle<ResumeRecord>();
  if (readError || !resume) throw new Error("That resume is no longer available.");
  if (resume.mime_type !== "application/pdf") throw new Error("Only PDF resumes can be processed.");

  const { error: processingError } = await supabase
    .from("resumes")
    .update({ status: "processing", processing_error: null })
    .eq("id", resume.id)
    .eq("user_id", userId);
  if (processingError) throw new Error("We could not start resume processing.");

  try {
    const { data: file, error: downloadError } = await supabase.storage
      .from(RESUME_BUCKET)
      .download(resume.storage_path);
    if (downloadError || !file) throw new Error("We could not read the stored resume.");

    const { text } = await extractText(new Uint8Array(await file.arrayBuffer()), { mergePages: true });
    const extractedText = normalizeExtractedText(text);
    if (extractedText.length < 20) throw new Error("The PDF does not contain readable text.");

    const { error: successError } = await supabase
      .from("resumes")
      .update({ status: "processed", extracted_text: extractedText, processing_error: null })
      .eq("id", resume.id)
      .eq("user_id", userId);
    if (successError) throw new Error("We could not save the extracted resume text.");

    return { resumeId: resume.id, status: "processed", extractedCharacterCount: extractedText.length };
  } catch (error) {
    const message = safeProcessingError(error);
    await setProcessingFailure(supabase, resume.id, userId, message);
    throw new Error(message);
  }
}

export const processResume = createServerFn({ method: "POST" })
  .validator(resumeInput)
  .handler(async ({ data, context }) =>
    processResumeOnServer(data.resumeId, context as ResumeProcessingContext),
  );