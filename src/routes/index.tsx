import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/karna-pages";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "KARNA AI Career Copilot — Build the career you’re ready for" },
    { name: "description", content: "Analyze your resume, discover skill gaps, match target roles, and prepare for interviews with KARNA AI." },
    { property: "og:title", content: "KARNA AI Career Copilot" },
    { property: "og:description", content: "AI-powered career intelligence for students and fresh graduates." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: LandingPage,
});