import assert from "node:assert/strict";
import { calculateJobMatch } from "../src/lib/job-matching.ts";

const job = (required_skills, preferred_skills) => ({
  id: "job",
  title: "Test Job",
  company: "Test Company",
  location: "Remote",
  employment_type: "Full-time",
  required_skills,
  preferred_skills,
});

assert.equal(
  calculateJobMatch([{ name: "Python" }, { name: "React" }, { name: "JavaScript" }], job(["Python", "React"], ["TypeScript"])).match_score,
  80,
);
assert.equal(
  calculateJobMatch([{ name: "Python" }], job(["Python", "SQL"], ["Excel"])).match_score,
  40,
);
assert.equal(
  calculateJobMatch([{ name: "Python" }, { name: "SQL" }, { name: "Excel" }], job(["Python", "SQL"], ["Excel"])).match_score,
  100,
);

const normalized = calculateJobMatch([{ name: "ReactJS" }, { name: "NodeJS" }], job(["React.js", "Node.js"], []));
assert.deepEqual(normalized.missing_skills, []);
assert.equal(normalized.match_score, 100);
console.log("Deterministic job matching checks passed.");
