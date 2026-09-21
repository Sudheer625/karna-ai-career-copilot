import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/karna-pages";
import { RequireAuth } from "@/auth/auth-provider";
export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — KARNA AI" },
      {
        name: "description",
        content: "Track your profile alignment, skills, gaps, roadmap, and interview progress.",
      },
      { property: "og:title", content: "Dashboard — KARNA AI" },
      { property: "og:description", content: "Your career readiness snapshot." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});
