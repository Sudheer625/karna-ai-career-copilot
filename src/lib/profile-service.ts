import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  degree: string | null;
  branch: string | null;
  graduation_year: number | null;
  experience_level: string | null;
  target_role: string | null;
  preferred_location: string | null;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_name: string;
  proficiency: string | null;
}

const profileFromUser = (user: User): Pick<Profile, "id" | "full_name" | "email"> => ({
  id: user.id,
  full_name:
    typeof user.user_metadata["full_name"] === "string" ? user.user_metadata["full_name"] : null,
  email: user.email ?? null,
});

export async function ensureProfile(user: User): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .upsert(profileFromUser(user), { onConflict: "id" });
  if (error) throw error;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, degree, branch, graduation_year, experience_level, target_role, preferred_location",
    )
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveProfile(userId: string, profile: Omit<Profile, "id">): Promise<void> {
  const { error } = await supabase.from("profiles").update(profile).eq("id", userId);
  if (error) throw error;
}

export async function getUserSkills(userId: string): Promise<UserSkill[]> {
  const { data, error } = await supabase
    .from("user_skills")
    .select("id, user_id, skill_name, proficiency")
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function addUserSkill(userId: string, skillName: string): Promise<void> {
  const { error } = await supabase
    .from("user_skills")
    .insert({ user_id: userId, skill_name: skillName, proficiency: "Developing" });
  if (error) throw error;
}

export async function deleteUserSkill(skillId: string): Promise<void> {
  const { error } = await supabase.from("user_skills").delete().eq("id", skillId);
  if (error) throw error;
}
