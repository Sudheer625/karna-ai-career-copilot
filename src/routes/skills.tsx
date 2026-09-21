import { createFileRoute } from "@tanstack/react-router";
import { SupabaseSkillsPage } from "@/components/karna-pages";
import { RequireAuth } from "@/auth/auth-provider";
export const Route = createFileRoute("/skills")({
  head: () => ({
    meta: [
      { title: "Skill Gap Analyzer — KARNA AI" },
      { name: "description", content: "Prioritize the skills that matter for your target role." },
      { property: "og:title", content: "Skill Gap Analyzer — KARNA AI" },
      { property: "og:description", content: "Understand strong, developing, and missing skills." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <SupabaseSkillsPage />
    </RequireAuth>
  ),
});
