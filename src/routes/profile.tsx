import { createFileRoute } from "@tanstack/react-router";
import { SupabaseProfilePage } from "@/components/karna-pages";
import { RequireAuth } from "@/auth/auth-provider";
export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — KARNA AI" },
      { name: "description", content: "Manage your profile and skills." },
      { property: "og:title", content: "Profile — KARNA AI" },
      { property: "og:description", content: "Keep your career identity ready for analysis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <SupabaseProfilePage />
    </RequireAuth>
  ),
});
