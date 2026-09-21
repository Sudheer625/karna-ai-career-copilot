import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { processResume } from "@/lib/resume-processing";
import {
  analyzeResume,
  getResumeAnalysis,
  type ResumeAnalysisRecord,
} from "@/lib/gemini-resume-analysis";

export type { ResumeAnalysis, ResumeAnalysisRecord } from "@/lib/gemini-resume-analysis";

const RESUME_BUCKET = "resumes";
export const MAX_RESUME_FILE_SIZE = 10 * 1024 * 1024;

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  status: string;
  extracted_text: string | null;
  processing_error: string | null;
  created_at: string;
  updated_at: string;
}

function logResumeError(
  operation: string,
  error: {
    message?: string | undefined;
    code?: string | undefined;
    details?: string | null | undefined;
    hint?: string | null | undefined;
  },
): void {
  if (import.meta.env.DEV) {
    console.error(`Supabase resumes ${operation} failed`, {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }
}

async function getAuthenticatedUser(): Promise<User> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    logResumeError("auth", error);
    throw new Error("Your session could not be verified. Please sign in again.");
  }
  if (!data.user) throw new Error("Please sign in before managing resumes.");
  return data.user;
}

function safeFileName(fileName: string): string {
  const normalized = fileName
    .normalize("NFKC")
    .replace(/\.pdf$/i, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-");
  const withoutPath = normalized.replace(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
  return (withoutPath || "resume") + ".pdf";
}

export function validateResumeFile(file: File): void {
  if (file.type !== "application/pdf") {
    throw new Error("Please choose a PDF file.");
  }
  if (file.size <= 0) throw new Error("The selected PDF is empty.");
  if (file.size > MAX_RESUME_FILE_SIZE) {
    throw new Error("Resume files must be 10 MB or smaller.");
  }
}

export async function uploadResume(file: File): Promise<Resume> {
  validateResumeFile(file);
  const user = await getAuthenticatedUser();
  const storagePath = `${user.id}/${safeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(RESUME_BUCKET)
    .upload(storagePath, file, { contentType: "application/pdf", upsert: false });
  if (uploadError) {
    logResumeError("upload", uploadError);
    throw new Error("We could not upload your resume. Please try again.");
  }

  const { data, error: insertError } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      file_name: file.name,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
      status: "uploaded",
    })
    .select("id, user_id, file_name, storage_path, file_size, mime_type, status, extracted_text, processing_error, created_at, updated_at")
    .single();

  if (insertError) {
    logResumeError("insert", insertError);
    const { error: cleanupError } = await supabase.storage.from(RESUME_BUCKET).remove([storagePath]);
    if (cleanupError) logResumeError("cleanup", cleanupError);
    throw new Error("Your resume uploaded but could not be saved. Please try again.");
  }
  return data as Resume;
}

export async function listUserResumes(): Promise<Resume[]> {
  const user = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from("resumes")
    .select("id, user_id, file_name, storage_path, file_size, mime_type, status, extracted_text, processing_error, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    logResumeError("list", error);
    throw new Error("We could not load your resumes. Please try again.");
  }
  return data as Resume[];
}

export async function deleteResume(resumeId: string): Promise<void> {
  const user = await getAuthenticatedUser();
  const { data: resume, error: readError } = await supabase
    .from("resumes")
    .select("id, storage_path")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError) {
    logResumeError("delete-read", readError);
    throw new Error("We could not find that resume. Please refresh and try again.");
  }
  if (!resume) throw new Error("That resume is no longer available.");

  const { error: storageError } = await supabase.storage.from(RESUME_BUCKET).remove([resume.storage_path]);
  if (storageError) {
    logResumeError("delete-storage", storageError);
    throw new Error("We could not delete the stored resume. Please try again.");
  }

  const { error: deleteError } = await supabase
    .from("resumes")
    .delete()
    .eq("id", resume.id)
    .eq("user_id", user.id);
  if (deleteError) {
    logResumeError("delete-record", deleteError);
    throw new Error("The file was deleted, but its record could not be removed. Please refresh.");
  }
}

export async function getResumeDownloadUrl(resumeId: string): Promise<string> {
  const user = await getAuthenticatedUser();
  const { data: resume, error: readError } = await supabase
    .from("resumes")
    .select("storage_path")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError || !resume) {
    if (readError) logResumeError("download-read", readError);
    throw new Error("That resume is no longer available.");
  }
  const { data, error } = await supabase.storage.from(RESUME_BUCKET).createSignedUrl(resume.storage_path, 60);
  if (error) {
    logResumeError("download", error);
    throw new Error("We could not open your resume. Please try again.");
  }
  return data.signedUrl;
}

export async function processUserResume(resumeId: string): Promise<void> {
  const { data: sessionData, error } = await supabase.auth.getSession();
  if (error || !sessionData.session) throw new Error("Please sign in before processing a resume.");
  await processResume({
    data: { resumeId },
    headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
  });
}

export async function analyzeUserResume(resumeId: string, regenerate = false): Promise<ResumeAnalysisRecord> {
  const { data: sessionData, error } = await supabase.auth.getSession();
  if (error || !sessionData.session) throw new Error("Please sign in before analyzing a resume.");
  return analyzeResume({
    data: { resumeId, regenerate },
    headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
  });
}

export async function getUserResumeAnalysis(resumeId: string): Promise<ResumeAnalysisRecord | null> {
  const { data: sessionData, error } = await supabase.auth.getSession();
  if (error || !sessionData.session) throw new Error("Please sign in before loading analysis.");
  return getResumeAnalysis({
    data: { resumeId },
    headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
  });
}

export async function listUserResumeAnalyses(): Promise<ResumeAnalysisRecord[]> {
  const user = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from("resume_analyses")
    .select("id, resume_id, user_id, model, analysis, status, error_message, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    logResumeError("analysis-list", error);
    throw new Error("We could not load your resume analyses. Please try again.");
  }
  return data as ResumeAnalysisRecord[];
}