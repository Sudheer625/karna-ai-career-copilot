import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  type LucideIcon,
  ArrowRight,
  Bell,
  Briefcase,
  BarChart3,
  Check,
  CircleAlert,
  CircleCheck,
  Clock3,
  Code2,
  Download,
  FileCheck2,
  FileText,
  Flag,
  Gauge,
  GraduationCap,
  Lightbulb,
  MapPin,
  MessageSquareText,
  Play,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AppShell,
  ActivityList,
  DashboardPreview,
  EmptyState,
  LandingHeader,
  MetricCard,
  ProgressRow,
  QuickAction,
  SectionHeader,
  StatusBadge,
  UploadPanel,
  demoProfile,
  roadmap,
  skills,
} from "@/components/karna-ui";
import { mockServices, interviewQuestion } from "@/lib/mock-data";
import { toast } from "sonner";
import { useAuth } from "@/auth/auth-provider";
import { useUserIdentity } from "@/hooks/use-user-identity";
import {
  addUserSkill,
  deleteUserSkill,
  DuplicateSkillError,
  ensureProfile,
  experienceLevelOptions,
  getProfile,
  getUserSkills,
  normalizeExperienceLevel,
  saveProfile,
  type Profile,
  type ProfileInput,
  type UserSkill,
} from "@/lib/profile-service";
import { supabase } from "@/lib/supabase";
import {
  generateJobMatches,
  getAvailableJobs,
  getLatestResumeAnalysis,
  getProcessedResumes,
  getUserJobMatches,
  type Job,
  type JobMatch,
} from "@/lib/job-matching-service";
import { generateCareerRoadmap, type CareerRoadmap } from "@/lib/career-roadmap";
import { calculateSkillGap, type SkillGapResult } from "@/lib/skill-gap";
import { normalizeSkill } from "@/lib/job-matching";
import {
  analyzeUserResume,
  deleteResume,
  getResumeDownloadUrl,
  listUserResumes,
  listUserResumeAnalyses,
  processUserResume,
  uploadResume,
  type ResumeAnalysisRecord,
  type Resume,
} from "@/lib/resume-service";

const landingFeatures: [string, string, LucideIcon][] = [
  [
    "Resume Intelligence",
    "Upload a PDF and get insights on skill coverage, keyword alignment, and project relevance.",
    FileText,
  ],
  [
    "Job Matching",
    "Paste a job description and see a clear profile alignment indicator with matched and missing skills.",
    Target,
  ],
  [
    "Skill Gap Analysis",
    "See strong, developing, and missing skills at a glance, prioritized toward your target role.",
    BarChart3,
  ],
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-paper text-foreground">
      <LandingHeader />
      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-40 -top-24 h-[420px] w-[520px] -skew-x-12 bg-signal/20 blur-3xl" />
          <div className="pointer-events-none absolute right-[-120px] top-40 h-[360px] w-[420px] -skew-x-12 bg-brand/20 blur-3xl" />
          <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 py-16 lg:grid-cols-12 lg:py-24">
            <div className="animate-rise lg:col-span-5">
              <Badge
                variant="outline"
                className="rounded-full border-signal/20 bg-signal/10 text-foreground"
              >
                <span className="mr-2 size-1.5 rounded-full bg-signal" />
                Career intelligence for students
              </Badge>
              <h1 className="mt-5 max-w-[16ch] font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                Build the career you’re <span className="text-brand">ready</span> for.
              </h1>
              <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-muted-foreground">
                KARNA AI analyzes your resume, surfaces skill gaps, matches you with target roles,
                and prepares you for the next interview.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  className="rounded-lg bg-brand text-primary-foreground hover:bg-brand-deep"
                >
                  <Link to="/register">
                    Get Started <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-lg border-line bg-card/50">
                  <a href="#features">
                    <Play className="size-4" /> Explore features
                  </a>
                </Button>
              </div>
              <p className="mt-6 text-xs text-muted-foreground">
                Demo data for Alex Kumar · B.Tech CSE, 2026
              </p>
            </div>
            <div className="animate-rise-delay lg:col-span-7">
              <DashboardPreview />
            </div>
          </div>
        </section>
        <section id="features" className="border-t border-line/70">
          <div className="mx-auto max-w-[1200px] px-5 py-16">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
              What you get
            </p>
            <h2 className="mt-2 max-w-xl font-display text-3xl font-semibold tracking-tight">
              Career intelligence, end to end.
            </h2>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {landingFeatures.map(([title, detail, Icon]) => (
                <div
                  key={title}
                  className="app-surface rounded-2xl bg-card/70 p-6 transition-transform hover:-translate-y-0.5"
                >
                  <div className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="how-it-works" className="border-t border-line/70">
          <div className="mx-auto max-w-[1200px] px-5 py-16">
            <div className="max-w-[30ch]">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
                How it works
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
                From uncertainty to the next clear step.
              </h2>
            </div>
            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              {[
                [
                  "01",
                  "Upload your resume",
                  "We extract your skills, projects, and experience into a structured profile.",
                ],
                [
                  "02",
                  "Compare with target roles",
                  "Paste a job description to see exactly where your profile aligns and where it doesn’t.",
                ],
                [
                  "03",
                  "Build your roadmap",
                  "Turn gaps into a phased plan, then rehearse for interviews with focused feedback.",
                ],
              ].map(([number, title, detail]) => (
                <div key={number} className="rounded-xl bg-card p-5 ring-1 ring-ink/5">
                  <span className="font-display text-sm font-semibold text-brand">{number}</span>
                  <p className="mt-3 font-display font-semibold">{title}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="students" className="border-t border-line/70">
          <div className="mx-auto max-w-[1200px] px-5 py-16">
            <div className="relative overflow-hidden rounded-2xl bg-ink px-6 py-12 text-paper sm:px-12">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 -skew-x-12 bg-brand/30 blur-3xl" />
              <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-[34ch]">
                  <h2 className="font-display text-3xl font-semibold tracking-tight">
                    Start your career analysis
                  </h2>
                  <p className="mt-2 text-sm text-paper/60">
                    Free for students. No job guarantees — just clearer next steps.
                  </p>
                </div>
                <Button asChild className="rounded-lg bg-signal text-ink hover:bg-signal/90">
                  <Link to="/register">
                    Start Your Career Analysis <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-line/70">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-md bg-ink font-display text-xs font-bold text-paper">
              K
            </span>
            <span className="font-display text-sm font-semibold">KARNA AI</span>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <a href="#features">Product</a>
            <a href="#features">Features</a>
            <a href="#students">About</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function AuthPage({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  return (
    <div className="min-h-screen bg-paper text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden flex-col justify-between bg-ink p-10 text-paper lg:flex">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-paper font-display text-sm font-bold text-ink">
                K
              </span>
              <span className="font-display text-base font-semibold">KARNA AI</span>
            </Link>
            <div className="mt-24 max-w-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-signal">
                Your AI-powered career companion
              </p>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-tight">
                Make your next step more intentional.
              </h1>
              <p className="mt-5 text-sm leading-relaxed text-paper/60">
                Understand your profile, close the right skill gaps, and prepare for the roles you
                actually want.
              </p>
            </div>
          </div>
          <p className="text-xs text-paper/35">
            AI-generated insights are for guidance and preparation.
          </p>
        </div>
        <div className="flex items-center justify-center px-5 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Link to="/" className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-ink font-display text-sm font-bold text-paper">
                  K
                </span>
                <span className="font-display text-base font-semibold">KARNA AI</span>
              </Link>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
              {register ? "Create your workspace" : "Welcome back"}
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              {register ? "Start with your career profile." : "Sign in to your copilot."}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {register
                ? "A demo profile will be ready in under a minute."
                : "Continue where you left off with your career plan."}
            </p>
            <form className="mt-8 space-y-4" onSubmit={(event) => event.preventDefault()}>
              {register && (
                <div>
                  <label htmlFor="full-name" className="mb-1.5 block text-sm font-medium">
                    Full name
                  </label>
                  <Input id="full-name" placeholder="Alex Kumar" required />
                </div>
              )}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                  Email
                </label>
                <Input id="email" type="email" placeholder="you@example.com" required />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              {register && (
                <div>
                  <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium">
                    Confirm password
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              )}
              {!register && (
                <div className="flex justify-end">
                  <Button variant="link" type="button" className="h-auto p-0 text-xs">
                    Forgot password?
                  </Button>
                </div>
              )}
              <Button
                asChild
                className="h-11 w-full rounded-lg bg-brand text-primary-foreground hover:bg-brand-deep"
              >
                <Link to="/dashboard">
                  {register ? "Create Account" : "Login"} <ArrowRight className="size-4" />
                </Link>
              </Button>
            </form>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              {register ? "Already have an account?" : "New to KARNA AI?"}{" "}
              <Button asChild variant="link" className="h-auto p-0 text-brand">
                <Link to={register ? "/login" : "/register"}>
                  {register ? "Sign in" : "Create an account"}
                </Link>
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  return <AuthPage mode="login" />;
}
export function RegisterPage() {
  return <AuthPage mode="register" />;
}

export function DashboardPage() {
  const identity = useUserIdentity();
  return (
    <AppShell
      title="Dashboard"
      eyebrow={
        identity.isLoading || !identity.displayName
          ? "Career intelligence"
          : `Good morning, ${identity.displayName}`
      }
    >
      <div className="animate-rise">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-muted-foreground">Here’s your career readiness snapshot.</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge className="rounded-full bg-success/10 text-success">On track</Badge>
              <span className="text-xs text-muted-foreground">Last updated just now</span>
            </div>
          </div>
          <Button
            asChild
            className="rounded-lg bg-brand text-primary-foreground hover:bg-brand-deep"
          >
            <Link to="/resume">
              <Upload className="size-4" /> Analyze resume
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Profile alignment"
            value="78%"
            detail="+6 points this week"
            icon={Gauge}
            tone="brand"
          />
          <MetricCard
            label="Skills tracked"
            value="14"
            detail="8 currently strong"
            icon={BarChart3}
            tone="signal"
          />
          <MetricCard
            label="Skill gaps"
            value="5"
            detail="2 high priority"
            icon={Target}
            tone="warning"
          />
          <MetricCard
            label="Interview progress"
            value="42%"
            detail="4 sessions completed"
            icon={MessageSquareText}
            tone="success"
          />
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="app-surface rounded-xl bg-card/70 p-5">
            <SectionHeader
              title="Skill overview"
              detail="Your current profile against Machine Learning Engineer roles"
              action={
                <Button asChild variant="link" className="h-auto px-0 text-xs">
                  <Link to="/skills">
                    View skill gaps <ArrowRight className="size-3" />
                  </Link>
                </Button>
              }
            />
            <div className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2">
              {skills.slice(0, 6).map((skill) => (
                <ProgressRow
                  key={skill.name}
                  name={skill.name}
                  value={skill.level}
                  accent={skill.status !== "Strong"}
                />
              ))}
            </div>
          </section>
          <section className="app-surface rounded-xl bg-card/70 p-5">
            <SectionHeader title="Recent activity" detail="A short history of your career work" />
            <div className="mt-6">
              <ActivityList />
            </div>
          </section>
        </div>
        <section className="mt-6">
          <SectionHeader title="Quick actions" detail="Move one part of your profile forward" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <QuickAction
              to="/resume"
              icon={FileText}
              title="Analyze Resume"
              detail="Refresh your profile insights"
            />
            <QuickAction
              to="/jobs"
              icon={Target}
              title="Analyze a Job"
              detail="Compare your fit for a role"
            />
            <QuickAction
              to="/skills"
              icon={BarChart3}
              title="Find Skill Gaps"
              detail="Prioritize what to learn next"
            />
            <QuickAction
              to="/interview"
              icon={MessageSquareText}
              title="Start Interview Prep"
              detail="Practice a target-role question"
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function formatFileSize(fileSize: number): string {
  if (fileSize < 1024 * 1024) return `${Math.max(1, Math.round(fileSize / 1024))} KB`;
  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}

function formatResumeStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function ResumePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [analysisByResume, setAnalysisByResume] = useState<Record<string, ResumeAnalysisRecord>>({});
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadResumes = useCallback(async () => {
    if (!user) {
      setResumes([]);
      setListLoading(false);
      return;
    }
    setListLoading(true);
    try {
      const [nextResumes, nextAnalyses] = await Promise.all([
        listUserResumes(),
        listUserResumeAnalyses(),
      ]);
      setResumes(nextResumes);
      setAnalysisByResume(
        nextAnalyses.reduce<Record<string, ResumeAnalysisRecord>>((latest, analysis) => {
          if (!latest[analysis.resume_id]) latest[analysis.resume_id] = analysis;
          return latest;
        }, {}),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "We could not load your resumes.");
    } finally {
      setListLoading(false);
    }
  }, [user]);
  useEffect(() => {
    void loadResumes();
  }, [loadResumes]);

  const handleUpload = async (file: File) => {
    setError(null);
    setUploadLoading(true);
    try {
      await uploadResume(file);
      await loadResumes();
      toast.success("Resume uploaded.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "We could not upload your resume.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (resumeId: string) => {
    setError(null);
    setDeletingId(resumeId);
    try {
      await deleteResume(resumeId);
      setResumes((current) => current.filter((resume) => resume.id !== resumeId));
      toast.success("Resume deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "We could not delete your resume.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleProcess = async (resumeId: string) => {
    setError(null);
    setProcessingId(resumeId);
    setResumes((current) =>
      current.map((resume) =>
        resume.id === resumeId ? { ...resume, status: "processing", processing_error: null } : resume,
      ),
    );
    try {
      await processUserResume(resumeId);
      await loadResumes();
      toast.success("Resume processed successfully.");
    } catch (processError) {
      await loadResumes();
      setError(processError instanceof Error ? processError.message : "We could not process your resume.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownload = async (resumeId: string) => {
    setError(null);
    try {
      const url = await getResumeDownloadUrl(resumeId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "We could not open your resume.");
    }
  };

  const handleAnalyze = async (resumeId: string, regenerate = false) => {
    setError(null);
    setAnalyzingId(resumeId);
    setAnalysisByResume((current) => ({
      ...current,
      [resumeId]: {
        ...current[resumeId],
        status: "processing",
        resume_id: resumeId,
      } as ResumeAnalysisRecord,
    }));
    try {
      const analysis = await analyzeUserResume(resumeId, regenerate);
      setAnalysisByResume((current) => ({ ...current, [resumeId]: analysis }));
      toast.success("AI resume analysis completed.");
    } catch (analysisError) {
      const analyses = await listUserResumeAnalyses().catch(() => []);
      const latest = analyses.find((analysis) => analysis.resume_id === resumeId);
      if (latest) setAnalysisByResume((current) => ({ ...current, [resumeId]: latest }));
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "We could not generate resume analysis.",
      );
    } finally {
      setAnalyzingId(null);
    }
  };

  const latestResume = resumes[0];
  const latestAnalysis = latestResume ? analysisByResume[latestResume.id] : undefined;
  return (
    <AppShell title="Resume Analyzer" eyebrow="Profile intelligence">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <UploadPanel loading={uploadLoading} error={error} onFileSelected={handleUpload} />
          <section className="app-surface rounded-xl bg-card/70 p-5">
            <SectionHeader title="Uploaded resumes" detail="Private files stored in your account" />
            {authLoading || listLoading ? (
              <p className="mt-5 text-sm text-muted-foreground" aria-busy="true">
                Loading resumes…
              </p>
            ) : !user ? (
              <p className="mt-5 text-sm text-muted-foreground">Sign in to manage your resumes.</p>
            ) : resumes.length === 0 ? (
              <p className="mt-5 text-sm text-muted-foreground">No resumes uploaded yet.</p>
            ) : (
              <div className="mt-5 space-y-3">
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="flex items-center gap-3 rounded-lg border border-line bg-paper/40 p-3"
                  >
                    <FileText className="size-5 shrink-0 text-brand" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{resume.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(resume.file_size)} · {formatResumeStatus(resume.status)}
                      </p>
                      {resume.status === "processed" && (
                        <p className="mt-1 text-xs text-success">
                          Resume processed successfully
                          {resume.extracted_text
                            ? ` · ${resume.extracted_text.length.toLocaleString()} characters`
                            : ""}
                        </p>
                      )}
                      {resume.status === "failed" && resume.processing_error && (
                        <p className="mt-1 text-xs text-destructive">{resume.processing_error}</p>
                      )}
                      {analysisByResume[resume.id]?.status === "failed" && (
                        <p className="mt-1 text-xs text-destructive">
                          {analysisByResume[resume.id]?.error_message &&
                          !/^(ENV_MISSING|AUTH_MISSING|RESUME_NOT_FOUND|RESUME_NOT_PROCESSED|EXTRACTED_TEXT_MISSING|GEMINI_INITIALIZATION_FAILED|GEMINI_REQUEST_FAILED|GEMINI_SCHEMA_ERROR|GEMINI_RESPONSE_INVALID|SUPABASE_SAVE_FAILED|UNKNOWN_SERVER_ERROR)$/.test(
                            analysisByResume[resume.id]?.error_message ?? "",
                          )
                            ? analysisByResume[resume.id]?.error_message
                            : "AI analysis failed."}
                        </p>
                      )}
                    </div>
                    {(resume.status === "uploaded" ||
                      resume.status === "failed" ||
                      resume.status === "processing") && (
                      <Button
                        variant="outline"
                        className="h-8 shrink-0 rounded-lg px-2 text-xs"
                        onClick={() => void handleProcess(resume.id)}
                        disabled={resume.status === "processing" || processingId === resume.id}
                      >
                        {resume.status === "processing" || processingId === resume.id
                          ? "Processing"
                          : "Process Resume"}
                      </Button>
                    )}
                    {resume.status === "processed" && (
                      <Button
                        variant="outline"
                        className="h-8 shrink-0 rounded-lg px-2 text-xs"
                        onClick={() =>
                          void handleAnalyze(
                            resume.id,
                            analysisByResume[resume.id]?.status === "completed",
                          )
                        }
                        disabled={
                          analyzingId === resume.id ||
                          analysisByResume[resume.id]?.status === "processing"
                        }
                      >
                        {analyzingId === resume.id || analysisByResume[resume.id]?.status === "processing"
                          ? "Analyzing"
                          : analysisByResume[resume.id]?.status === "completed"
                            ? "Regenerate AI Analysis"
                            : "Analyze with AI"}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="View resume"
                      aria-label={`View ${resume.file_name}`}
                      onClick={() => void handleDownload(resume.id)}
                      disabled={deletingId === resume.id || processingId === resume.id}
                    >
                      <Download className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete resume"
                      aria-label={`Delete ${resume.file_name}`}
                      onClick={() => void handleDelete(resume.id)}
                      disabled={deletingId === resume.id || processingId === resume.id}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        <div className="space-y-6">
          <section className="app-surface rounded-xl bg-card/70 p-5">
            <SectionHeader
              title="What we found"
              detail="Gemini-powered resume intelligence"
            />
            {latestAnalysis?.status === "completed" ? (
              <ResumeAnalysisDetails analysis={latestAnalysis.analysis} />
            ) : latestAnalysis?.status === "failed" ? (
              <EmptyState
                icon={FileText}
                title="AI analysis failed"
                detail={
                  latestAnalysis.error_message &&
                  !/^(ENV_MISSING|AUTH_MISSING|RESUME_NOT_FOUND|RESUME_NOT_PROCESSED|EXTRACTED_TEXT_MISSING|GEMINI_INITIALIZATION_FAILED|GEMINI_REQUEST_FAILED|GEMINI_SCHEMA_ERROR|GEMINI_RESPONSE_INVALID|SUPABASE_SAVE_FAILED|UNKNOWN_SERVER_ERROR)$/.test(
                    latestAnalysis.error_message,
                  )
                    ? latestAnalysis.error_message
                    : "We could not generate resume analysis. Please try again."
                }
                action={
                  latestResume && (
                    <Button
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => void handleAnalyze(latestResume.id)}
                      disabled={analyzingId === latestResume.id}
                    >
                      {analyzingId === latestResume.id ? "Analyzing" : "Retry"}
                    </Button>
                  )
                }
              />
            ) : (
              <EmptyState
                icon={FileText}
                title={latestResume ? "AI analysis not generated yet." : "Your resume insights will appear here"}
                detail={
                  latestResume
                    ? "Process your resume, then choose Analyze with AI to generate structured insights."
                    : "Upload a PDF to prepare it for future resume analysis."
                }
              />
            )}
          </section>
          <section className="app-surface rounded-xl bg-card/70 p-5">
            <SectionHeader title="Resume overview" detail="Structured profile details" />
            {latestResume ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  ["File name", latestResume.file_name],
                  ["File type", latestResume.mime_type],
                  ["File size", formatFileSize(latestResume.file_size)],
                  ["Uploaded", new Date(latestResume.created_at).toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-line bg-paper/40 p-4">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 text-sm font-medium">{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={FileText} title="No resume uploaded" detail="Upload a PDF to see its stored details here." />
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function InsightList({
  title,
  icon: Icon,
  tone,
  items,
}: {
  title: string;
  icon: typeof CircleCheck;
  tone: "success" | "warning";
  items: string[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className={tone === "success" ? "size-4 text-success" : "size-4 text-warning"} />
        <p className="font-medium">{title}</p>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-muted-foreground">
            <span className={tone === "success" ? "text-success" : "text-warning"}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResumeAnalysisDetails({ analysis }: { analysis: ResumeAnalysisRecord["analysis"] }) {
  return (
    <div className="mt-5 space-y-5">
      <div className="rounded-lg border border-line bg-paper/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Resume Summary
        </p>
        <p className="mt-2 text-sm leading-relaxed">{analysis.summary || "No summary was identified."}</p>
      </div>
      <AnalysisGroup title="Skills">
        {analysis.skills.map((skill) => (
          <AnalysisItem key={`${skill.name}-${skill.category}`}>
            <span className="font-medium">{skill.name}</span>
            <span className="text-muted-foreground">
              {skill.category} · {skill.proficiency}
            </span>
          </AnalysisItem>
        ))}
      </AnalysisGroup>
      <AnalysisGroup title="Education">
        {analysis.education.map((item) => (
          <AnalysisItem key={`${item.degree}-${item.institution}-${item.year}`}>
            {item.degree} · {item.institution} · {item.year}
          </AnalysisItem>
        ))}
      </AnalysisGroup>
      <AnalysisGroup title="Experience">
        {analysis.experience.map((item) => (
          <AnalysisItem key={`${item.role}-${item.company}-${item.duration}`}>
            <span className="font-medium">{item.role} · {item.company}</span>
            <span className="text-muted-foreground">{item.duration}</span>
            {item.highlights.length > 0 && <span className="text-muted-foreground">{item.highlights.join(" · ")}</span>}
          </AnalysisItem>
        ))}
      </AnalysisGroup>
      <AnalysisGroup title="Projects">
        {analysis.projects.map((item) => (
          <AnalysisItem key={item.name}>
            <span className="font-medium">{item.name}</span>
            <span className="text-muted-foreground">{item.description}</span>
            {item.technologies.length > 0 && (
              <span className="text-muted-foreground">{item.technologies.join(" · ")}</span>
            )}
          </AnalysisItem>
        ))}
      </AnalysisGroup>
      <AnalysisGroup title="Certifications">
        {analysis.certifications.map((item) => (
          <AnalysisItem key={`${item.name}-${item.issuer}`}>
            {item.name} · {item.issuer}
          </AnalysisItem>
        ))}
      </AnalysisGroup>
      <AnalysisGroup title="Recommended Roles">
        {analysis.recommended_roles.map((role) => (
          <AnalysisItem key={role}>{role}</AnalysisItem>
        ))}
      </AnalysisGroup>
      <AnalysisGroup title="Missing Skills">
        {analysis.missing_skills.map((skill) => (
          <AnalysisItem key={skill}>{skill}</AnalysisItem>
        ))}
      </AnalysisGroup>
    </div>
  );
}

function AnalysisGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      {children ? (
        <div className="mt-2 space-y-2 rounded-lg border border-line bg-paper/40 p-3 text-sm">
          {children}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No information identified.</p>
      )}
    </div>
  );
}

function AnalysisItem({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-0.5">{children}</div>;
}

export function JobsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [resumes, setResumes] = useState<Array<{ id: string; file_name: string; status: string }>>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [processedResumes, availableJobs] = await Promise.all([
        getProcessedResumes(),
        getAvailableJobs(),
      ]);
      setResumes(processedResumes);
      setJobs(availableJobs);
      const nextResumeId = selectedResumeId && processedResumes.some((resume) => resume.id === selectedResumeId)
        ? selectedResumeId
        : processedResumes[0]?.id ?? "";
      setSelectedResumeId(nextResumeId);
      setSelectedJobId((current) => current && availableJobs.some((job) => job.id === current)
        ? current
        : availableJobs[0]?.id ?? "");
      if (nextResumeId) {
        const [analysis, storedMatches] = await Promise.all([
          getLatestResumeAnalysis(nextResumeId),
          getUserJobMatches(nextResumeId),
        ]);
        setHasAnalysis(Boolean(analysis));
        setMatches(storedMatches);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "We could not load job matching data.");
    } finally {
      setLoading(false);
    }
  }, [selectedResumeId, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectResume = async (resumeId: string) => {
    setSelectedResumeId(resumeId);
    setError(null);
    try {
      const [analysis, storedMatches] = await Promise.all([
        getLatestResumeAnalysis(resumeId),
        getUserJobMatches(resumeId),
      ]);
      setHasAnalysis(Boolean(analysis));
      setMatches(storedMatches);
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : "We could not load this resume.");
    }
  };

  const findMatches = async () => {
    if (!selectedResumeId) return;
    setMatching(true);
    setError(null);
    try {
      const generatedMatches = await generateJobMatches(selectedResumeId);
      setMatches(generatedMatches);
      setHasAnalysis(true);
      if (generatedMatches.length > 0) toast.success("Job matches generated.");
      else setError("[NO_MATCHES] No job matches were found.");
    } catch (matchError) {
      setError(matchError instanceof Error ? matchError.message : "We could not generate job matches.");
    } finally {
      setMatching(false);
    }
  };

  return (
    <AppShell title="Job Matching" eyebrow="Role alignment">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="app-surface rounded-xl bg-card/70 p-5">
          <SectionHeader
            title="Find matching jobs"
            detail="Compare your stored resume analysis with available roles"
          />
          {loading || authLoading ? (
            <p className="mt-6 text-sm text-muted-foreground" aria-busy="true">Loading matching data…</p>
          ) : !user ? (
            <p className="mt-6 text-sm text-muted-foreground">Sign in to find matching jobs.</p>
          ) : resumes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Upload and process your resume first."
              detail="A processed resume is required before deterministic job matching can run."
              action={<Button asChild variant="outline" className="rounded-lg"><Link to="/resume">Go to Resume Analyzer</Link></Button>}
            />
          ) : (
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="resume-select" className="mb-1.5 block text-sm font-medium">Resume</label>
                <select
                  id="resume-select"
                  value={selectedResumeId}
                  onChange={(event) => void selectResume(event.target.value)}
                  className="h-10 w-full rounded-lg border border-line bg-card px-3 text-sm"
                >
                  {resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.file_name}</option>)}
                </select>
              </div>
              <Button
                className="rounded-lg bg-brand text-primary-foreground hover:bg-brand-deep"
                onClick={() => void findMatches()}
                disabled={!hasAnalysis || matching}
              >
                <Target className="size-4" /> {matching ? "Finding Matches" : "Find Matching Jobs"}
              </Button>
              {!hasAnalysis && (
                <div className="rounded-lg border border-warning/20 bg-warning/10 p-3 text-sm text-warning">
                  Analyze your resume first to generate job matches.
                  <Button asChild variant="link" className="h-auto px-1 text-warning"><Link to="/resume">Analyze Resume</Link></Button>
                </div>
              )}
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            </div>
          )}
        </section>
        <section className="space-y-6">
          {matches.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="Your job matches will appear here"
              detail="Choose a processed resume with completed analysis, then find matching jobs."
            />
          ) : matches.map((match) => <JobMatchCard key={match.id} match={match} />)}
        </section>
      </div>
    </AppShell>
  );
}

function JobMatchCard({ match }: { match: JobMatch }) {
  return (
    <div className="app-surface rounded-xl bg-card/70 p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Deterministic match</p>
          <h2 className="mt-2 font-display text-xl font-semibold">{match.job.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{match.job.company} · {match.job.location}</p>
          <p className="mt-1 text-xs text-muted-foreground">{match.job.employment_type} · {match.job.experience_level}</p>
        </div>
        <div className="rounded-xl bg-brand/10 px-4 py-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-brand">Match</p>
          <p className="mt-1 font-display text-3xl font-semibold text-brand">{match.match_score}%</p>
        </div>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <SkillGroup title="Matched skills" skills={match.matched_skills} tone="success" />
        <SkillGroup title="Missing required skills" skills={match.missing_skills} tone="warning" />
      </div>
      {match.job.application_url && (
        <Button asChild variant="outline" className="mt-5 rounded-lg">
          <a href={match.job.application_url} target="_blank" rel="noreferrer">View Job</a>
        </Button>
      )}
    </div>
  );
}
function SkillGroup({
  title,
  skills: items,
  tone,
}: {
  title: string;
  skills: string[];
  tone: "success" | "warning";
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((skill) => (
          <Badge
            key={skill}
            variant="outline"
            className={
              tone === "success"
                ? "rounded-full border-success/20 bg-success/10 text-success"
                : "rounded-full border-warning/20 bg-warning/10 text-warning"
            }
          >
            {tone === "success" ? (
              <Check className="mr-1 size-3" />
            ) : (
              <CircleAlert className="mr-1 size-3" />
            )}
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function SkillsPage() {
  return (
    <AppShell title="Skill Gap Analyzer" eyebrow="Target role: Machine Learning Engineer">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="app-surface rounded-xl bg-card/70 p-5">
          <SectionHeader
            title="Your skill map"
            detail="Current evidence compared with your target role"
          />
          <div className="mt-6 space-y-5">
            {skills.map((skill) => (
              <div
                key={skill.name}
                className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto] sm:items-center"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={
                      skill.status === "Strong"
                        ? "size-2 rounded-full bg-success"
                        : skill.status === "Developing"
                          ? "size-2 rounded-full bg-brand"
                          : "size-2 rounded-full bg-warning"
                    }
                  />
                  <span className="text-sm font-medium">{skill.name}</span>
                </div>
                <ProgressRow name="" value={skill.level} accent={skill.status !== "Strong"} />
                <div className="flex items-center gap-2 sm:justify-end">
                  <StatusBadge status={skill.status} />
                  {skill.priority !== "—" && (
                    <span className="text-[10px] text-muted-foreground">{skill.priority}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
        <div className="space-y-6">
          <section className="app-surface rounded-xl bg-card/70 p-5">
            <SectionHeader
              title="Priority focus"
              detail="Where effort will move your alignment fastest"
            />
            <div className="mt-5 space-y-4">
              {skills
                .filter((skill) => skill.status !== "Strong")
                .slice(0, 3)
                .map((skill, index) => (
                  <div
                    key={skill.name}
                    className="flex items-center gap-3 rounded-lg border border-line bg-paper/40 p-3"
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-warning/10 text-xs font-semibold text-warning">
                      0{index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{skill.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {skill.priority} priority · {skill.level}% demonstrated
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                ))}
            </div>
          </section>
          <section className="rounded-xl bg-ink p-5 text-paper">
            <div className="flex items-center gap-2 text-signal">
              <Sparkles className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                AI-generated insight
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-paper/70">
              Your profile has a strong Python and data foundation. The fastest next step is to add
              deployment evidence through Docker and one cloud project.
            </p>
            <Button
              asChild
              variant="outline"
              className="mt-5 rounded-lg border-paper/20 bg-paper/5 text-paper hover:bg-paper/10"
            >
              <Link to="/roadmap">
                View your roadmap <ArrowRight className="size-4" />
              </Link>
            </Button>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

export function RoadmapPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [roadmapData, setRoadmapData] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeErrorMessage = (message: string): string => {
    if (message.includes("Please sign in")) return "Please sign in to generate a career roadmap.";
    if (message.includes("resume")) return "Add and analyze a processed resume before generating a roadmap.";
    if (message.includes("job")) return "Choose a target job to generate a roadmap.";
    return "We could not generate this roadmap. Please try again.";
  };

  const loadStoredRoadmap = useCallback(async (resumeId: string, jobId: string) => {
    if (!user || !resumeId || !jobId) {
      setRoadmapData(null);
      return;
    }

    const { data, error: roadmapError } = await supabase
      .from("career_roadmaps")
      .select("roadmap, status")
      .eq("user_id", user.id)
      .eq("resume_id", resumeId)
      .eq("job_id", jobId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ roadmap: CareerRoadmap; status: "completed" }>();

    if (roadmapError) {
      setRoadmapData(null);
      return;
    }

    setRoadmapData(data?.roadmap ?? null);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setResumes([]);
      setJobs([]);
      setSelectedResumeId("");
      setSelectedJobId("");
      setRoadmapData(null);
      setLoading(false);
      return;
    }

    const loadPageData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [processedResumes, availableJobs] = await Promise.all([
          getProcessedResumes(),
          getAvailableJobs(),
        ]);

        const { data: completedAnalyses } = await supabase
          .from("resume_analyses")
          .select("resume_id")
          .eq("user_id", user.id)
          .eq("status", "completed");

        const usableResumeIds = new Set((completedAnalyses ?? []).map((analysis) => analysis.resume_id));
        const usableResumes = processedResumes.filter((resume) => usableResumeIds.has(resume.id));

        setResumes(usableResumes);
        setJobs(availableJobs);

        const nextResumeId = usableResumes.some((resume) => resume.id === selectedResumeId)
          ? selectedResumeId
          : usableResumes[0]?.id ?? "";
        const nextJobId = availableJobs.some((job) => job.id === selectedJobId)
          ? selectedJobId
          : availableJobs[0]?.id ?? "";

        setSelectedResumeId(nextResumeId);
        setSelectedJobId(nextJobId);

        if (nextResumeId && nextJobId) {
          await loadStoredRoadmap(nextResumeId, nextJobId);
        } else {
          setRoadmapData(null);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "We could not load your roadmap data.");
      } finally {
        setLoading(false);
      }
    };

    void loadPageData();
  }, [user]);

  useEffect(() => {
    if (!user || !selectedResumeId || !selectedJobId) {
      setRoadmapData(null);
      return;
    }
    void loadStoredRoadmap(selectedResumeId, selectedJobId);
  }, [user, selectedResumeId, selectedJobId, loadStoredRoadmap]);

  const handleGenerate = async () => {
    if (!selectedResumeId || !selectedJobId) return;
    setGenerating(true);
    setError(null);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error("Please sign in before generating a career roadmap.");
      }

      const result = await generateCareerRoadmap({
        data: { resumeId: selectedResumeId, jobId: selectedJobId, regenerate: false },
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      });

      setRoadmapData(result.roadmap ?? null);
    } catch (generationError) {
      setRoadmapData(null);
      const message = generationError instanceof Error ? generationError.message : "We could not generate this roadmap. Please try again.";
      setError(safeErrorMessage(message));
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate = Boolean(selectedResumeId && selectedJobId) && !generating;

  return (
    <AppShell title="Career Roadmap" eyebrow="A phased plan for your target role">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="app-surface rounded-xl bg-card/70 p-5">
          <SectionHeader
            title="Build your roadmap"
            detail="Choose your analyzed resume and target role to keep the plan tied to your data."
          />

          {authLoading || loading ? (
            <p className="mt-6 text-sm text-muted-foreground" aria-busy="true">Loading roadmap data…</p>
          ) : !user ? (
            <p className="mt-6 text-sm text-muted-foreground">Please sign in to view your roadmap.</p>
          ) : resumes.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={FileText}
                title="No processed resume ready"
                detail="Analyze a processed resume before creating a roadmap."
                action={<Button asChild variant="outline" className="rounded-lg"><Link to="/resume">Analyze Resume</Link></Button>}
              />
            </div>
          ) : jobs.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={Briefcase}
                title="No target jobs available"
                detail="There are no jobs available yet for this roadmap."
              />
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="roadmap-resume" className="mb-1.5 block text-sm font-medium">Resume</label>
                <select
                  id="roadmap-resume"
                  value={selectedResumeId}
                  onChange={(event) => setSelectedResumeId(event.target.value)}
                  className="h-10 w-full rounded-lg border border-line bg-card px-3 text-sm"
                >
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>{resume.file_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="roadmap-job" className="mb-1.5 block text-sm font-medium">Target job</label>
                <select
                  id="roadmap-job"
                  value={selectedJobId}
                  onChange={(event) => setSelectedJobId(event.target.value)}
                  className="h-10 w-full rounded-lg border border-line bg-card px-3 text-sm"
                >
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>{job.title} · {job.company}</option>
                  ))}
                </select>
              </div>

              <Button
                className="w-full rounded-lg bg-brand text-primary-foreground hover:bg-brand-deep"
                onClick={() => void handleGenerate()}
                disabled={!canGenerate}
              >
                {generating ? "Generating roadmap…" : "Generate Career Roadmap"}
              </Button>

              {error && (
                <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
            </div>
          )}
        </section>

        <section className="space-y-6">
          {!user || loading ? null : !selectedResumeId || !selectedJobId ? (
            <div className="app-surface rounded-xl bg-card/70 p-5">
              <p className="text-sm text-muted-foreground">Select a resume and target job to view a roadmap.</p>
            </div>
          ) : !roadmapData ? (
            <div className="app-surface rounded-xl bg-card/70 p-5">
              <p className="text-sm text-muted-foreground">No roadmap has been generated for this resume and role yet.</p>
            </div>
          ) : (
            <div className="app-surface rounded-xl bg-card/70 p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-brand">Career goal</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold">{roadmapData.goal}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Built for {roadmapData.target_role}.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-display font-semibold">{roadmapData.estimated_duration}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Estimated</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-line bg-paper/35 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-brand">Target role</p>
                  <p className="mt-2 font-medium">{roadmapData.target_role}</p>
                </div>
                <div className="rounded-xl border border-line bg-paper/35 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-brand">Current level</p>
                  <p className="mt-2 font-medium">{roadmapData.current_level}</p>
                </div>
                <div className="rounded-xl border border-line bg-paper/35 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-brand">Duration</p>
                  <p className="mt-2 font-medium">{roadmapData.estimated_duration}</p>
                </div>
              </div>

              <div className="mt-8 space-y-5">
                {roadmapData.phases.map((phase, index) => (
                  <div key={`${phase.title}-${index}`} className="rounded-xl border border-line bg-paper/35 p-4 sm:p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">Phase {index + 1}</p>
                        <h3 className="mt-2 font-display text-lg font-semibold">{phase.title}</h3>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3 className="size-3.5" />
                        {phase.duration}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Skills</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                          {phase.skills.map((skill) => <li key={skill}>{skill}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Topics</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                          {phase.topics.map((topic) => <li key={topic}>{topic}</li>)}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Practice tasks</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                          {phase.practice_tasks.map((task) => <li key={task}>{task}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Project</p>
                        <p className="mt-2 text-sm text-muted-foreground">{phase.project}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-line bg-paper/35 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Final project</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{roadmapData.final_project}</p>
              </div>

              <div className="mt-8 rounded-xl border border-line bg-paper/35 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Milestones</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  {roadmapData.milestones.map((milestone) => <li key={milestone}>{milestone}</li>)}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

export function InterviewPage() {
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  return (
    <AppShell title="Interview Preparation" eyebrow="Practice with role-specific questions">
      {!started ? (
        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <section className="app-surface rounded-xl bg-card/70 p-6">
            <div className="grid size-12 place-items-center rounded-xl bg-brand/10 text-brand">
              <MessageSquareText className="size-5" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold">
              Prepare for the conversation.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Choose a role, interview style, and difficulty. KARNA will create a focused mock
              session for this demo.
            </p>
            <div className="mt-7 space-y-5">
              <FieldSelect
                label="Target role"
                value="Machine Learning Engineer"
                options={["Machine Learning Engineer", "Data Analyst", "Software Engineer"]}
              />
              <FieldSelect
                label="Interview type"
                value="Mixed"
                options={["Technical", "HR", "Project", "Mixed"]}
              />
              <FieldSelect
                label="Difficulty"
                value="Intermediate"
                options={["Beginner", "Intermediate", "Advanced"]}
              />
            </div>
            <Button
              className="mt-7 w-full rounded-lg bg-brand text-primary-foreground hover:bg-brand-deep"
              onClick={() => setStarted(true)}
            >
              <Play className="size-4" /> Start Interview
            </Button>
          </section>
          <section className="rounded-xl bg-ink p-6 text-paper sm:p-8">
            <div className="flex items-center gap-2 text-signal">
              <ShieldCheck className="size-5" />
              <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                Session preview
              </span>
            </div>
            <h2 className="mt-8 max-w-md font-display text-3xl font-semibold">
              A calmer way to rehearse your next answer.
            </h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                ["10", "questions"],
                ["3", "feedback signals"],
                ["1", "target role"],
              ].map(([number, label]) => (
                <div key={label} className="rounded-xl bg-paper/5 p-4 ring-1 ring-paper/10">
                  <p className="font-display text-2xl font-semibold">{number}</p>
                  <p className="mt-1 text-xs text-paper/55">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 max-w-md text-sm leading-relaxed text-paper/60">
              You’ll receive feedback on relevance, clarity, and technical depth — not a hiring
              verdict.
            </p>
          </section>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-brand">
                Technical · Intermediate
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold">Question 1 of 10</h2>
            </div>
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => {
                setStarted(false);
                setSubmitted(false);
              }}
            >
              End session
            </Button>
          </div>
          <section className="app-surface rounded-xl bg-card/70 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <Badge className="rounded-full bg-brand/10 text-brand">
                Machine Learning Engineer
              </Badge>
              <span className="text-xs text-muted-foreground">Progress 10%</span>
            </div>
            <h3 className="mt-8 font-display text-2xl font-semibold leading-tight">
              {interviewQuestion}
            </h3>
            {!submitted ? (
              <>
                <label htmlFor="answer" className="mt-8 block text-sm font-medium">
                  Your answer
                </label>
                <Textarea
                  id="answer"
                  placeholder="Write your answer here…"
                  className="mt-2 min-h-44"
                />
                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  <Button variant="outline" className="rounded-lg">
                    Skip
                  </Button>
                  <Button
                    className="rounded-lg bg-brand text-primary-foreground hover:bg-brand-deep"
                    onClick={() => setSubmitted(true)}
                  >
                    <Send className="size-4" /> Submit Answer
                  </Button>
                </div>
              </>
            ) : (
              <div className="mt-8">
                <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                  <div className="flex items-center gap-2 text-success">
                    <CircleCheck className="size-4" />
                    <span className="text-sm font-medium">Answer evaluated</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your answer is correct but could include a concrete example.
                  </p>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <MetricCard
                    label="Relevance"
                    value="82%"
                    detail="Strong connection"
                    icon={Target}
                    tone="success"
                  />
                  <MetricCard
                    label="Clarity"
                    value="76%"
                    detail="Easy to follow"
                    icon={MessageSquareText}
                    tone="brand"
                  />
                  <MetricCard
                    label="Technical depth"
                    value="71%"
                    detail="Add one example"
                    icon={Code2}
                    tone="warning"
                  />
                </div>
                <div className="mt-6 flex justify-end">
                  <Button
                    className="rounded-lg bg-brand text-primary-foreground hover:bg-brand-deep"
                    onClick={() => setSubmitted(false)}
                  >
                    Next Question <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
function FieldSelect({
  label,
  value,
  options,
}: {
  label: string;
  value: string;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <select
        defaultValue={value}
        className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

export function ProfilePage() {
  const [saved, setSaved] = useState(false);
  const [skillList, setSkillList] = useState([
    "Python",
    "SQL",
    "Pandas",
    "NumPy",
    "Scikit-learn",
    "Git",
    "Machine Learning",
  ]);
  const [newSkill, setNewSkill] = useState("");
  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skillList.includes(trimmed)) {
      setSkillList([...skillList, trimmed]);
      setNewSkill("");
    }
  };
  return (
    <AppShell title="Profile" eyebrow="Your career identity">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <section className="app-surface rounded-xl bg-card/70 p-6">
          <SectionHeader
            title="Personal information"
            detail="Keep your demo profile ready for analysis"
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <FieldInput label="Name" value={demoProfile.name} />
            <FieldInput label="Email" value={demoProfile.email} />
            <FieldInput label="Phone" value={demoProfile.phone} />
            <FieldInput label="Location" value={demoProfile.location} />
          </div>
          <div className="mt-8 border-t border-line pt-6">
            <SectionHeader title="Education & preferences" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <FieldInput label="Degree" value={demoProfile.degree} />
              <FieldInput label="Branch" value={demoProfile.branch} />
              <FieldInput label="Graduation year" value={demoProfile.graduation} />
              <FieldInput label="Target role" value={demoProfile.targetRole} />
              <FieldInput label="Experience level" value={demoProfile.experience} />
              <FieldInput label="Preferred location" value={demoProfile.location} />
            </div>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <Button
              className="rounded-lg bg-brand text-primary-foreground hover:bg-brand-deep"
              onClick={async () => {
                await mockServices.saveProfile();
                setSaved(true);
              }}
            >
              <Save className="size-4" /> Save Profile
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-xs text-success">
                <Check className="size-3.5" /> Changes saved for this demo
              </span>
            )}
          </div>
        </section>
        <section className="app-surface rounded-xl bg-card/70 p-6">
          <SectionHeader title="Skills" detail="Add or remove demo skills" />
          <div className="mt-5 flex flex-wrap gap-2">
            {skillList.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="gap-1 rounded-full border-line bg-paper/50 py-1.5"
              >
                {skill}
                <button
                  type="button"
                  aria-label={`Remove ${skill}`}
                  onClick={() => setSkillList(skillList.filter((item) => item !== skill))}
                >
                  <X className="size-3 text-muted-foreground" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <Input
              value={newSkill}
              onChange={(event) => setNewSkill(event.target.value)}
              placeholder="Add a skill"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addSkill();
                }
              }}
            />
            <Button variant="outline" size="icon" aria-label="Add skill" onClick={addSkill}>
              <Plus />
            </Button>
          </div>
          <div className="mt-8 rounded-xl bg-brand/5 p-4">
            <div className="flex items-center gap-2 text-brand">
              <Trophy className="size-4" />
              <span className="text-sm font-medium">Profile completeness</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand/10">
              <div className="h-full w-[78%] rounded-full bg-brand" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              78% complete · Add a project outcome to improve your signal.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
function FieldInput({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <Input defaultValue={value} />
    </div>
  );
}

export function SettingsPage() {
  const identity = useUserIdentity();
  const [theme, setTheme] = useState("light");
  const [saved, setSaved] = useState(false);
  return (
    <AppShell title="Settings" eyebrow="Workspace preferences">
      <div className="mx-auto max-w-3xl space-y-6">
        <SettingSection
          icon={UserRound}
          title="Account"
          detail="Manage the details attached to your workspace"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Display name</label>
              <Input value={identity.displayName} readOnly disabled={identity.isLoading} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <Input type="email" value={identity.email} readOnly disabled={identity.isLoading} />
            </div>
          </div>
        </SettingSection>
        <SettingSection
          icon={Sparkles}
          title="Appearance"
          detail="Choose how KARNA AI should feel while you work"
        >
          <div className="flex items-center justify-between rounded-lg border border-line bg-paper/40 p-4">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Dark mode is available for future polish; light is the demo default.
              </p>
            </div>
            <div className="flex gap-2">
              {["light", "dark"].map((option) => (
                <Button
                  key={option}
                  variant={theme === option ? "default" : "outline"}
                  size="sm"
                  className="capitalize"
                  onClick={() => setTheme(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        </SettingSection>
        <SettingSection
          icon={Bell}
          title="Notifications"
          detail="Control helpful reminders and progress updates"
        >
          <ToggleRow label="Roadmap reminders" detail="Weekly nudges about your next milestone" />
          <ToggleRow
            label="Interview practice"
            detail="A reminder when your target role needs more practice"
          />
        </SettingSection>
        <SettingSection
          icon={ShieldCheck}
          title="Privacy"
          detail="Understand how your data is handled"
        >
          <div className="flex items-start gap-3 rounded-lg border border-info/20 bg-info/5 p-4">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-info" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              This Phase 2 prototype uses mock data only. No resume files, account credentials, or
              private AI keys are stored.
            </p>
          </div>
        </SettingSection>
        <div className="flex items-center gap-3">
          <Button
            className="rounded-lg bg-brand text-primary-foreground hover:bg-brand-deep"
            onClick={() => setSaved(true)}
          >
            Save settings
          </Button>
          {saved && <span className="text-xs text-success">Settings saved for this demo.</span>}
        </div>
      </div>
    </AppShell>
  );
}
function SettingSection({
  icon: Icon,
  title,
  detail,
  children,
}: {
  icon: typeof UserRound;
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <section className="app-surface rounded-xl bg-card/70 p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-9 place-items-center rounded-lg bg-brand/10 text-brand">
          <Icon className="size-4" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
function ToggleRow({ label, detail }: { label: string; detail: string }) {
  const [on, setOn] = useState(true);
  return (
    <div className="flex items-center justify-between border-b border-line py-3 last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
      <button
        type="button"
        aria-pressed={on}
        aria-label={`Toggle ${label}`}
        onClick={() => setOn(!on)}
        className={
          on
            ? "relative h-6 w-11 rounded-full bg-brand transition-colors"
            : "relative h-6 w-11 rounded-full bg-muted transition-colors"
        }
      >
        <span
          className={
            on
              ? "absolute right-1 top-1 size-4 rounded-full bg-primary-foreground shadow-sm transition-transform"
              : "absolute left-1 top-1 size-4 rounded-full bg-card shadow-sm transition-transform"
          }
        />
      </button>
    </div>
  );
}

function SupabaseAuthPage({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");
    if (register && password !== confirmPassword) {
      setNotice("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      if (register) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        if (data.session && data.user) await ensureProfile(data.user);
        setNotice(
          data.session
            ? "Account created. You can now continue to your dashboard."
            : "Check your email to verify your account, then sign in to continue.",
        );
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) await ensureProfile(data.user);
        window.location.assign("/dashboard");
      }
    } catch (error) {
      setNotice(
        error instanceof Error
          ? "We couldn’t complete that request. Check your details and try again."
          : "We couldn’t complete that request. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-paper text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden flex-col justify-between bg-ink p-10 text-paper lg:flex">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-paper font-display text-sm font-bold text-ink">
                K
              </span>
              <span className="font-display text-base font-semibold">KARNA AI</span>
            </Link>
            <div className="mt-24 max-w-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-signal">
                Your AI-powered career companion
              </p>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-tight">
                Make your next step more intentional.
              </h1>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center px-5 py-12">
          <div className="w-full max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
              {register ? "Create your workspace" : "Welcome back"}
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              {register ? "Start with your career profile." : "Sign in to your copilot."}
            </h2>
            <form className="mt-8 space-y-4" onSubmit={submit}>
              {register && (
                <div>
                  <label htmlFor="full-name" className="mb-1.5 block text-sm font-medium">
                    Full name
                  </label>
                  <Input
                    id="full-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                  />
                </div>
              )}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                />
              </div>
              {register && (
                <div>
                  <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium">
                    Confirm password
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              )}
              {notice && (
                <p className="text-sm text-muted-foreground" role="status">
                  {notice}
                </p>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-lg bg-brand text-primary-foreground hover:bg-brand-deep"
              >
                {loading ? "Please wait…" : register ? "Create Account" : "Login"}{" "}
                <ArrowRight className="size-4" />
              </Button>
            </form>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              {register ? "Already have an account?" : "New to KARNA AI?"}{" "}
              <Button asChild variant="link" className="h-auto p-0 text-brand">
                <Link to={register ? "/login" : "/register"}>
                  {register ? "Sign in" : "Create an account"}
                </Link>
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export function SupabaseLoginPage() {
  return <SupabaseAuthPage mode="login" />;
}
export function SupabaseRegisterPage() {
  return <SupabaseAuthPage mode="register" />;
}

const emptyProfile: ProfileInput = {
  full_name: "",
  email: "",
  phone: "",
  degree: "",
  branch: "",
  graduation_year: null,
  experience_level: "",
  target_role: "",
  preferred_location: "",
};
export function SupabaseProfilePage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileInput>(emptyProfile);
  const [skillList, setSkillList] = useState<UserSkill[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingSkill, setAddingSkill] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      await ensureProfile(user);
      const [storedProfile, storedSkills] = await Promise.all([
        getProfile(user.id),
        getUserSkills(user),
      ]);
      if (storedProfile) {
        const {
          id: _id,
          created_at: _createdAt,
          updated_at: _updatedAt,
          ...storedValues
        } = storedProfile;
        setProfile({
          ...storedValues,
          email: user.email ?? "",
          experience_level: normalizeExperienceLevel(storedValues.experience_level) ?? "",
        });
      } else {
        setProfile({
          ...emptyProfile,
          full_name:
            typeof user.user_metadata["full_name"] === "string"
              ? user.user_metadata["full_name"]
              : "",
          email: user.email ?? "",
        });
      }
      setSkillList(storedSkills);
    } catch {
      toast.error("We couldn’t load your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    void load();
  }, [load]);
  const update = (key: Exclude<keyof ProfileInput, "email">, value: string) =>
    setProfile((current) => ({
      ...current,
      [key]: key === "graduation_year" ? (value ? Number(value) : null) : value,
    }));
  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveProfile(user, profile);
      toast.success("Profile saved.");
    } catch {
      toast.error("We couldn’t save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  const logout = async () => {
    try {
      await signOut();
      window.location.assign("/login");
    } catch {
      toast.error("We couldn’t sign you out. Please try again.");
    }
  };
  const add = async () => {
    const skillName = newSkill.trim();
    if (!user) return;
    if (!skillName) {
      toast.error("Enter a skill name.");
      return;
    }
    if (
      skillList.some(
        (skill) => skill.skill_name.toLocaleLowerCase() === skillName.toLocaleLowerCase(),
      )
    ) {
      toast.error("This skill is already in your profile.");
      return;
    }
    setAddingSkill(true);
    try {
      const addedSkill = await addUserSkill(user, skillName);
      setNewSkill("");
      setSkillList((current) => [...current, addedSkill]);
      toast.success("Skill added.");
    } catch (error) {
      toast.error(
        error instanceof DuplicateSkillError
          ? "This skill is already in your profile."
          : "We couldn’t add that skill. Please try again.",
      );
    } finally {
      setAddingSkill(false);
    }
  };
  const remove = async (id: string) => {
    if (!user) return;
    setDeletingSkillId(id);
    try {
      await deleteUserSkill(user, id);
      setSkillList((current) => current.filter((skill) => skill.id !== id));
      toast.success("Skill removed.");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message === "This skill is no longer available."
          ? error.message
          : "We couldn’t remove that skill. Please try again.",
      );
    } finally {
      setDeletingSkillId(null);
    }
  };
  if (loading)
    return (
      <AppShell title="Profile" eyebrow="Your career identity">
        <p className="text-sm text-muted-foreground">Loading your profile…</p>
      </AppShell>
    );
  const personalFields: [string, Exclude<keyof ProfileInput, "email">, string][] = [
    ["Name", "full_name", "text"],
    ["Phone", "phone", "tel"],
    ["Location", "preferred_location", "text"],
  ];
  const educationFields: [string, Exclude<keyof ProfileInput, "email">, string][] = [
    ["Degree", "degree", "text"],
    ["Branch", "branch", "text"],
    ["Graduation year", "graduation_year", "number"],
    ["Target role", "target_role", "text"],
    ["Experience level", "experience_level", "select"],
  ];
  return (
    <AppShell title="Profile" eyebrow="Your career identity">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <section className="app-surface rounded-xl bg-card/70 p-6">
          <SectionHeader
            title="Personal information"
            detail="Keep your profile ready for analysis"
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {personalFields.map(([label, key, type]) => (
              <div key={key}>
                <label className="mb-1.5 block text-sm font-medium">{label}</label>
                <Input
                  type={type}
                  value={profile[key] ?? ""}
                  onChange={(event) => update(key, event.target.value)}
                />
              </div>
            ))}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <Input type="email" value={profile.email ?? ""} disabled readOnly />
            </div>
          </div>
          <div className="mt-8 border-t border-line pt-6">
            <SectionHeader title="Education & preferences" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {educationFields.map(([label, key, type]) => (
                <div key={key}>
                  <label className="mb-1.5 block text-sm font-medium">{label}</label>
                  {key === "experience_level" ? (
                    <select
                      value={profile.experience_level ?? ""}
                      onChange={(event) => update(key, event.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Select experience level</option>
                      {experienceLevelOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={type}
                      value={profile[key] ?? ""}
                      onChange={(event) => update(key, event.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <Button
              disabled={saving}
              className="rounded-lg bg-brand text-primary-foreground hover:bg-brand-deep"
              onClick={() => void save()}
            >
              <Save className="size-4" />
              {saving ? "Saving…" : "Save Profile"}
            </Button>
            <Button variant="outline" className="rounded-lg" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </section>
        <section className="app-surface rounded-xl bg-card/70 p-6">
          <SectionHeader title="Skills" detail="Add or remove your skills" />
          <div className="mt-5 flex flex-wrap gap-2">
            {skillList.map((skill) => (
              <Badge
                key={skill.id}
                variant="outline"
                className="gap-1 rounded-full border-line bg-paper/50 py-1.5"
              >
                {skill.skill_name}
                <button
                  type="button"
                  aria-label={`Remove ${skill.skill_name}`}
                  disabled={deletingSkillId === skill.id}
                  onClick={() => void remove(skill.id)}
                >
                  <X className="size-3 text-muted-foreground" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <Input
              value={newSkill}
              onChange={(event) => setNewSkill(event.target.value)}
              placeholder="Add a skill"
              disabled={addingSkill}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void add();
                }
              }}
            />
            <Button
              variant="outline"
              size="icon"
              aria-label="Add skill"
              disabled={addingSkill}
              onClick={() => void add()}
            >
              <Plus />
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
export function SupabaseSkillsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [resumes, setResumes] = useState<Array<{ id: string; file_name: string; status: string }>>([]);
  const [jobs, setJobs] = useState<Array<{ id: string; title: string; company: string; location: string; employment_type: string; required_skills: string[]; preferred_skills: string[] }>>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [analysisSkills, setAnalysisSkills] = useState<Array<{ name: string; category: string; proficiency: string }>>([]);
  const [result, setResult] = useState<SkillGapResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [processedResumes, availableJobs] = await Promise.all([
        getProcessedResumes(),
        getAvailableJobs(),
      ]);
      setResumes(processedResumes);
      setJobs(availableJobs);
      const resumeId = selectedResumeId && processedResumes.some((resume) => resume.id === selectedResumeId)
        ? selectedResumeId
        : processedResumes[0]?.id ?? "";
      const jobId = selectedJobId && availableJobs.some((job) => job.id === selectedJobId)
        ? selectedJobId
        : availableJobs[0]?.id ?? "";
      setSelectedResumeId(resumeId);
      setSelectedJobId(jobId);
      if (resumeId) {
        const analysis = await getLatestResumeAnalysis(resumeId);
        const skills = analysis?.analysis.skills ?? [];
        setAnalysisSkills(skills);
        const job = availableJobs.find((item) => item.id === jobId);
        setResult(job && analysis ? calculateSkillGap(skills, job) : null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "We could not load skill gap data.");
    } finally {
      setLoading(false);
    }
  }, [selectedJobId, selectedResumeId, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateSelection = async (resumeId: string, jobId: string) => {
    setSelectedResumeId(resumeId);
    setSelectedJobId(jobId);
    setError(null);
    try {
      const analysis = await getLatestResumeAnalysis(resumeId);
      const skills = analysis?.analysis.skills ?? [];
      setAnalysisSkills(skills);
      const job = jobs.find((item) => item.id === jobId);
      setResult(job && analysis ? calculateSkillGap(skills, job) : null);
    } catch (selectionError) {
      setError(selectionError instanceof Error ? selectionError.message : "We could not load this selection.");
    }
  };

  return (
    <AppShell title="Skill Gap Analysis" eyebrow="Resume skills compared with a target role">
      {loading || authLoading ? (
        <p className="text-sm text-muted-foreground" aria-busy="true">Loading skill gap data…</p>
      ) : !user ? (
        <p className="text-sm text-muted-foreground">Sign in to view skill gap insights.</p>
      ) : resumes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Upload and process your resume first."
          detail="A processed resume is required before skill gap analysis can run."
          action={<Button asChild variant="outline" className="rounded-lg"><Link to="/resume">Go to Resume Analyzer</Link></Button>}
        />
      ) : jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No target jobs available" detail="Add jobs before viewing skill gap insights." />
      ) : (
        <div className="space-y-6">
          <section className="app-surface rounded-xl bg-card/70 p-5">
            <SectionHeader title="Choose your comparison" detail="No AI calls are made when changing selections" />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium">
                Resume
                <select
                  value={selectedResumeId}
                  onChange={(event) => void updateSelection(event.target.value, selectedJobId)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-line bg-card px-3 text-sm"
                >
                  {resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.file_name}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">
                Target job
                <select
                  value={selectedJobId}
                  onChange={(event) => void updateSelection(selectedResumeId, event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-line bg-card px-3 text-sm"
                >
                  {jobs.map((job) => <option key={job.id} value={job.id}>{job.title} · {job.company} · {job.location}</option>)}
                </select>
              </label>
            </div>
            {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
          </section>
          {!result ? (
            <EmptyState
              icon={FileText}
              title="Analyze your resume first to generate skill gap insights."
              detail="The selected resume does not have a completed resume analysis yet."
              action={<Button asChild variant="outline" className="rounded-lg"><Link to="/resume">Analyze Resume</Link></Button>}
            />
          ) : (
            <SkillGapDetails result={result} candidateSkills={analysisSkills} />
          )}
        </div>
      )}
    </AppShell>
  );
}

function SkillGapDetails({
  result,
  candidateSkills,
}: {
  result: SkillGapResult;
  candidateSkills: Array<{ name: string; proficiency: string }>;
}) {
  const proficiencyByName = new Map(candidateSkills.map((skill) => [normalizeSkill(skill.name), skill.proficiency]));
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="app-surface rounded-xl bg-card/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-brand">Target role</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">{result.targetJob.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{result.targetJob.company} · {result.targetJob.location}</p>
          </div>
          <div className="rounded-xl bg-brand/10 px-4 py-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-brand">Skill Coverage</p>
            <p className="mt-1 font-display text-3xl font-semibold text-brand">{result.coveragePercentage}%</p>
          </div>
        </div>
        <p className="mt-5 rounded-lg border border-line bg-paper/40 p-4 text-sm text-muted-foreground">
          You currently match {result.matchedRequiredSkills.length} of {result.targetJob.required_skills.length} required skills for this role.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <SkillGroup title="Strong / Matched Skills" skills={result.matchedRequiredSkills.map((skill) => `${skill}${proficiencyByName.has(normalizeSkill(skill)) ? ` · ${proficiencyByName.get(normalizeSkill(skill))}` : ""}`)} tone="success" />
          <SkillGroup title="Critical Skills to Develop" skills={result.missingRequiredSkills} tone="warning" />
        </div>
      </section>
      <div className="space-y-6">
        <section className="app-surface rounded-xl bg-card/70 p-5">
          <SectionHeader title="Additional Skills That Could Strengthen Your Profile" />
          <SkillGroup title="Preferred skill gaps" skills={result.missingPreferredSkills} tone="warning" />
        </section>
        <section className="app-surface rounded-xl bg-card/70 p-5">
          <SectionHeader title="Priority" detail="Required gaps first, then preferred gaps" />
          <div className="mt-4 space-y-2">
            {result.prioritySkills.length ? result.prioritySkills.map((skill, index) => (
              <div key={`${skill.priority}-${skill.name}`} className="flex items-center gap-3 rounded-lg border border-line bg-paper/40 p-3">
                <span className="grid size-7 place-items-center rounded-full bg-warning/10 text-xs font-semibold text-warning">{index + 1}</span>
                <span className="text-sm font-medium">{skill.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">Priority {skill.priority}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">No skill gaps identified.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
