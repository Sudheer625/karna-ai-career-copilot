import { normalizeSkill, type CandidateSkill, type MatchableJob } from "./job-matching.ts";

export interface SkillGapResult {
  targetJob: MatchableJob;
  coveragePercentage: number;
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchedPreferredSkills: string[];
  missingPreferredSkills: string[];
  prioritySkills: Array<{ name: string; priority: 1 | 2 }>;
  candidateProficiency: Record<string, string>;
}

function uniqueSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  return skills.filter((skill) => {
    const normalized = normalizeSkill(skill);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function calculateSkillGap(
  candidateSkills: CandidateSkill[],
  targetJob: MatchableJob,
): SkillGapResult {
  const candidateNormalized = new Set<string>();
  const candidateProficiency: Record<string, string> = {};
  for (const skill of candidateSkills) {
    const normalized = normalizeSkill(skill.name);
    if (!normalized) continue;
    candidateNormalized.add(normalized);
    if (skill.proficiency) candidateProficiency[normalized] = skill.proficiency;
  }

  const requiredSkills = uniqueSkills(targetJob.required_skills);
  const preferredSkills = uniqueSkills(targetJob.preferred_skills);
  const matchedRequiredSkills = requiredSkills.filter((skill) => candidateNormalized.has(normalizeSkill(skill)));
  const missingRequiredSkills = requiredSkills.filter((skill) => !candidateNormalized.has(normalizeSkill(skill)));
  const matchedPreferredSkills = preferredSkills.filter((skill) => candidateNormalized.has(normalizeSkill(skill)));
  const missingPreferredSkills = preferredSkills.filter((skill) => !candidateNormalized.has(normalizeSkill(skill)));
  const coveragePercentage = requiredSkills.length
    ? Math.round((matchedRequiredSkills.length / requiredSkills.length) * 100)
    : preferredSkills.length
      ? Math.round((matchedPreferredSkills.length / preferredSkills.length) * 100)
      : 0;

  return {
    targetJob,
    coveragePercentage: Math.max(0, Math.min(100, coveragePercentage)),
    matchedRequiredSkills,
    missingRequiredSkills,
    matchedPreferredSkills,
    missingPreferredSkills,
    prioritySkills: [
      ...missingRequiredSkills.map((name) => ({ name, priority: 1 as const })),
      ...missingPreferredSkills.map((name) => ({ name, priority: 2 as const })),
    ],
    candidateProficiency,
  };
}
