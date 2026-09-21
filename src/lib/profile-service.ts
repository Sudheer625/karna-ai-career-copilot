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
  created_at: string | null;
  updated_at: string | null;
}

export type ProfileInput = Omit<Profile, "id" | "created_at" | "updated_at">;

export const experienceLevelOptions = ["Student", "Fresher", "Entry Level", "Experienced"] as const;

type ExperienceLevel = (typeof experienceLevelOptions)[number];

const legacyExperienceLevelMap: Record<string, ExperienceLevel> = {
  "1": "Student",
  "2": "Fresher",
  "3": "Entry Level",
  "4": "Experienced",
};

export function normalizeExperienceLevel(value: string | null): ExperienceLevel | null {
  if (!value) return null;
  const legacyValue = legacyExperienceLevelMap[value];
  if (legacyValue) return legacyValue;
  return experienceLevelOptions.find((option) => option === value) ?? null;
}

const nullableText = (value: string | null): string | null => value?.trim() || null;

function normalizeProfileInput(profile: ProfileInput): ProfileInput {
  const graduationYear = profile.graduation_year;
  if (
    graduationYear !== null &&
    (!Number.isInteger(graduationYear) || graduationYear < -32768 || graduationYear > 32767)
  ) {
    throw new Error("Graduation year must be a valid year.");
  }

  return {
    full_name: nullableText(profile.full_name),
    email: profile.email,
    phone: nullableText(profile.phone),
    degree: nullableText(profile.degree),
    branch: nullableText(profile.branch),
    graduation_year: graduationYear,
    experience_level: normalizeExperienceLevel(profile.experience_level),
    target_role: nullableText(profile.target_role),
    preferred_location: nullableText(profile.preferred_location),
  };
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_name: string;
  proficiency: string | null;
}

export const skillProficiencyOptions = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;

export class DuplicateSkillError extends Error {
  constructor() {
    super("This skill is already in your profile.");
  }
}

function logSkillError(
  operation: "read" | "insert" | "delete",
  error: {
    message: string;
    code: string;
    details: string | null;
    hint: string | null;
  },
): void {
  if (import.meta.env.DEV) {
    console.error(`Supabase user_skills ${operation} failed`, {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }
}

const profileFromUser = (user: User): Pick<Profile, "id" | "full_name" | "email"> => ({
  id: user.id,
  full_name:
    typeof user.user_metadata["full_name"] === "string" ? user.user_metadata["full_name"] : null,
  email: user.email ?? null,
});

export async function ensureProfile(user: User): Promise<void> {
  const profile = await getProfile(user.id);
  if (profile) return;

  const { error } = await supabase.from("profiles").insert(profileFromUser(user));
  // A second request may create the profile between the read and insert.
  if (error?.code === "23505") return;
  if (error) throw error;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, degree, branch, graduation_year, experience_level, target_role, preferred_location, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveProfile(user: User, profile: ProfileInput): Promise<void> {
  const normalizedProfile = normalizeProfileInput(profile);
  const { error } = await supabase
    .from("profiles")
    .update({ ...normalizedProfile, email: user.email ?? null })
    .eq("id", user.id);
  if (error && import.meta.env.DEV) {
    console.error("Supabase profile update failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }
  if (error) throw error;
}

export async function getUserSkills(user: User): Promise<UserSkill[]> {
  const { data, error } = await supabase
    .from("user_skills")
    .select("id, user_id, skill_name, proficiency")
    .eq("user_id", user.id)
    .order("created_at");
  if (error) logSkillError("read", error);
  if (error) throw error;
  return data;
}

export async function addUserSkill(user: User, skillName: string): Promise<UserSkill> {
  const normalizedSkillName = skillName.trim();
  if (!normalizedSkillName) throw new Error("Enter a skill name.");

  const { data, error } = await supabase
    .from("user_skills")
    .insert({ user_id: user.id, skill_name: normalizedSkillName, proficiency: "Intermediate" })
    .select("id, user_id, skill_name, proficiency")
    .single();
  if (error) logSkillError("insert", error);
  if (error?.code === "23505") throw new DuplicateSkillError();
  if (error) throw error;
  return data;
}

export async function deleteUserSkill(user: User, skillId: string): Promise<void> {
  const { data, error } = await supabase
    .from("user_skills")
    .delete()
    .eq("id", skillId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) logSkillError("delete", error);
  if (error) throw error;
  if (!data) throw new Error("This skill is no longer available.");
}
