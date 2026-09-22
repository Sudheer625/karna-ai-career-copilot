import assert from "node:assert/strict";
import { calculateSkillGap } from "../src/lib/skill-gap.ts";

const job = (required_skills, preferred_skills = []) => ({
  id: "job",
  title: "Test Job",
  company: "Test Company",
  location: "Remote",
  employment_type: "Full-time",
  required_skills,
  preferred_skills,
});

const first = calculateSkillGap(
  [{ name: "Python" }, { name: "React" }, { name: "JavaScript" }],
  job(["Python", "React", "TypeScript"]),
);
assert.deepEqual(first.matchedRequiredSkills, ["Python", "React"]);
assert.deepEqual(first.missingRequiredSkills, ["TypeScript"]);
assert.equal(first.coveragePercentage, 67);

const second = calculateSkillGap(
  [{ name: "Python" }, { name: "SQL" }, { name: "Excel" }],
  job(["Python", "SQL"], ["Excel", "Power BI"]),
);
assert.equal(second.coveragePercentage, 100);
assert.deepEqual(second.matchedPreferredSkills, ["Excel"]);
assert.deepEqual(second.missingPreferredSkills, ["Power BI"]);

const third = calculateSkillGap([{ name: "Python" }], job(["Python", "SQL"]));
assert.equal(third.coveragePercentage, 50);
assert.deepEqual(third.missingRequiredSkills, ["SQL"]);

const aliases = calculateSkillGap(
  [{ name: "ReactJS", proficiency: "advanced" }, { name: "NodeJS" }],
  job(["React.js", "Node.js"]),
);
assert.equal(aliases.coveragePercentage, 100);
assert.equal(aliases.candidateProficiency.react, "advanced");
console.log("Deterministic skill gap checks passed.");
