import { supabase } from "@/lib/supabase";
import type { ResumeAnalysisRecord } from "@/lib/gemini-resume-analysis";
import { calculateJobMatch, type CalculatedJobMatch, type MatchableJob } from "@/lib/job-matching";

export interface Job extends MatchableJob {
  description: string;
  experience_level: string;
  salary_min: number | null;
  salary_max: number | null;
  application_url: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface JobMatch extends CalculatedJobMatch {
  id: string;
  user_id: string;
  resume_id: string;
  created_at: string;
  updated_at: string;
  job: Job;
}

function matchingError(category: string, message: string): Error {
  return new Error(`[${category}] ${message}`);
}

function logJobError(operation: string, error: { message?: string; code?: string; details?: string | null; hint?: string | null }): void {
  if (import.meta.env.DEV) {
    console.error(`Supabase jobs ${operation} failed`, {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }
}

async function getAuthenticatedUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Please sign in to find matching jobs.");
  return data.user;
}

export async function getAvailableJobs(): Promise<Job[]> {
  await getAuthenticatedUser();
  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, company, location, employment_type, description, required_skills, preferred_skills, experience_level, salary_min, salary_max, application_url, source, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (error) {
    logJobError("list", error);
    throw matchingError("JOBS_QUERY_FAILED", "We could not load available jobs.");
  }
  if (import.meta.env.DEV) console.info("Job matching diagnostics", { jobCount: data?.length ?? 0 });
  return data as Job[];
}

export async function getProcessedResumes() {
  const user = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from("resumes")
    .select("id, file_name, status, created_at")
    .eq("user_id", user.id)
    .eq("status", "processed")
    .order("created_at", { ascending: false });
  if (error) {
    logJobError("resume-list", error);
    throw new Error("We could not load your processed resumes.");
  }
  return data;
}

export async function getLatestResumeAnalysis(resumeId: string): Promise<ResumeAnalysisRecord | null> {
  const user = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from("resume_analyses")
    .select("id, resume_id, user_id, model, analysis, status, error_message, created_at, updated_at")
    .eq("resume_id", resumeId)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    logJobError("analysis-read", error);
    throw matchingError("ANALYSIS_QUERY_FAILED", "We could not load the resume analysis.");
  }
  return data as ResumeAnalysisRecord | null;
}

export async function generateJobMatches(resumeId: string): Promise<JobMatch[]> {
  const user = await getAuthenticatedUser();
  const analysis = await getLatestResumeAnalysis(resumeId);
  if (!analysis) throw matchingError("ANALYSIS_NOT_FOUND", "Analyze your resume first to generate job matches.");

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .select("id, user_id, status")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .eq("status", "processed")
    .maybeSingle();
  if (resumeError || !resume) throw matchingError("RESUME_NOT_FOUND", "Upload and process your resume first.");

  const jobs = await getAvailableJobs();
  if (!jobs.length) throw matchingError("JOBS_NOT_FOUND", "No jobs are available yet. Apply the sample jobs migration first.");
  if (!analysis.analysis.skills.length) {
    throw matchingError("NO_CANDIDATE_SKILLS", "No candidate skills were found in the completed resume analysis.");
  }
  const calculatedMatches = jobs.map((job) =>
    calculateJobMatch(analysis.analysis.skills, job),
  );
  const rows = calculatedMatches.map((match) => ({
    user_id: user.id,
    resume_id: resume.id,
    job_id: match.job_id,
    match_score: match.match_score,
    matched_skills: match.matched_skills,
    missing_skills: match.missing_skills,
  }));
  if (import.meta.env.DEV) {
    console.info("Job matching diagnostics", {
      authenticated: true,
      resumeFound: true,
      analysisFound: true,
      candidateSkillCount: analysis.analysis.skills.length,
      jobCount: jobs.length,
      calculatedMatchCount: calculatedMatches.length,
      upsertAttemptedCount: rows.length,
    });
  }
  const { data: persistedRows, error } = await supabase
    .from("job_matches")
    .upsert(rows, { onConflict: "user_id,resume_id,job_id" })
    .select("id, job_id");
  if (error) {
    logJobError("match-upsert", error);
    throw matchingError("JOB_MATCH_UPSERT_FAILED", "We could not save your job matches.");
  }
  if (!persistedRows?.length) {
    throw matchingError("JOB_MATCH_UPSERT_FAILED", "No job matches were persisted.");
  }
  const matches = await getUserJobMatches(resume.id);
  if (import.meta.env.DEV) console.info("Job matching diagnostics", { persistedCount: persistedRows.length, queryReturnedCount: matches.length });
  if (!matches.length) throw matchingError("JOB_MATCH_QUERY_FAILED", "Saved matches could not be loaded.");
  return matches;
}

export async function getUserJobMatches(resumeId: string): Promise<JobMatch[]> {
  const user = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from("job_matches")
    .select("id, user_id, resume_id, job_id, match_score, matched_skills, missing_skills, created_at, updated_at")
    .eq("resume_id", resumeId)
    .eq("user_id", user.id)
    .order("match_score", { ascending: false });
  if (error) {
    logJobError("match-list", error);
    throw matchingError("JOB_MATCH_QUERY_FAILED", "We could not load your job matches.");
  }
  const matchRows = data ?? [];
  if (!matchRows.length) return [];
  const jobIds = matchRows.map((match) => match.job_id);
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("id, title, company, location, employment_type, description, required_skills, preferred_skills, experience_level, salary_min, salary_max, application_url, source, created_at, updated_at")
    .in("id", jobIds);
  if (jobsError) {
    logJobError("match-job-list", jobsError);
    throw matchingError("JOB_MATCH_QUERY_FAILED", "We could not load the matched jobs.");
  }
  const jobsById = new Map((jobs as Job[]).map((job) => [job.id, job]));
  return matchRows.flatMap((match) => {
    const job = jobsById.get(match.job_id);
    return job ? [{ ...match, job } as JobMatch] : [];
  });
}
