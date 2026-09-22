export interface CandidateSkill {
  name: string;
  category?: string;
  proficiency?: string;
}

export interface MatchableJob {
  id: string;
  title: string;
  company: string;
  location: string;
  employment_type: string;
  required_skills: string[];
  preferred_skills: string[];
}

export interface CalculatedJobMatch {
  job_id: string;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
}

const skillAliases: Record<string, string> = {
  ai: "artificial intelligence",
  artificialintelligence: "artificial intelligence",
  artificial_intelligence: "artificial intelligence",
  javascript: "javascript",
  js: "javascript",
  ml: "machine learning",
  machinelearning: "machine learning",
  machine_learning: "machine learning",
  mongodb: "mongodb",
  nodejs: "node.js",
  node_js: "node.js",
  node: "node.js",
  nextjs: "next.js",
  next_js: "next.js",
  postgres: "postgresql",
  postgresql: "postgresql",
  reactjs: "react",
  react_js: "react",
  reactdotjs: "react",
  ts: "typescript",
  typescript: "typescript",
};

export function normalizeSkill(skill: string): string {
  const collapsed = skill.trim().toLowerCase().replace(/[.\s-]+/g, " ").replace(/\s+/g, " ");
  const compact = collapsed.replace(/[ _]/g, "");
  return skillAliases[compact] ?? skillAliases[collapsed.replace(/ /g, "_")] ?? collapsed;
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

export function calculateJobMatch(
  candidateSkills: CandidateSkill[],
  job: MatchableJob,
): CalculatedJobMatch {
  const candidateByNormalized = new Map<string, string>();
  for (const skill of candidateSkills) {
    const normalized = normalizeSkill(skill.name);
    if (normalized && !candidateByNormalized.has(normalized)) {
      candidateByNormalized.set(normalized, skill.name.trim());
    }
  }

  const requiredSkills = uniqueSkills(job.required_skills);
  const preferredSkills = uniqueSkills(job.preferred_skills);
  const matchedRequired = requiredSkills.filter((skill) => candidateByNormalized.has(normalizeSkill(skill)));
  const matchedPreferred = preferredSkills.filter((skill) => candidateByNormalized.has(normalizeSkill(skill)));
  const requiredMatch = requiredSkills.length ? matchedRequired.length / requiredSkills.length : null;
  const preferredMatch = preferredSkills.length ? matchedPreferred.length / preferredSkills.length : null;
  const score =
    requiredMatch !== null && preferredMatch !== null
      ? requiredMatch * 80 + preferredMatch * 20
      : requiredMatch !== null
        ? requiredMatch * 100
        : (preferredMatch ?? 0) * 100;

  const matchedSkills = [...matchedRequired, ...matchedPreferred].map(
    (skill) => candidateByNormalized.get(normalizeSkill(skill)) ?? skill,
  );
  const missingSkills = requiredSkills.filter(
    (skill) => !candidateByNormalized.has(normalizeSkill(skill)),
  );

  return {
    job_id: job.id,
    match_score: Math.max(0, Math.min(100, Math.round(score))),
    matched_skills: matchedSkills,
    missing_skills: missingSkills,
  };
}
