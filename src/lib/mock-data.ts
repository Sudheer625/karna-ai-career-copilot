export type SkillStatus = "Strong" | "Developing" | "Missing";

export const demoProfile = {
  name: "Alex Kumar",
  email: "alex.kumar@example.com",
  phone: "+91 98765 43210",
  degree: "B.Tech Computer Science",
  branch: "Computer Science & Engineering",
  graduation: "2026",
  experience: "Fresher",
  targetRole: "Machine Learning Engineer",
  location: "Bengaluru, India",
};

export const skills = [
  { name: "Python", level: 100, status: "Strong" as SkillStatus, priority: "—" },
  { name: "SQL", level: 80, status: "Strong" as SkillStatus, priority: "—" },
  { name: "Machine Learning", level: 70, status: "Developing" as SkillStatus, priority: "Medium" },
  { name: "Pandas", level: 82, status: "Strong" as SkillStatus, priority: "—" },
  { name: "Scikit-learn", level: 76, status: "Strong" as SkillStatus, priority: "—" },
  { name: "Docker", level: 30, status: "Missing" as SkillStatus, priority: "High" },
  { name: "AWS", level: 20, status: "Missing" as SkillStatus, priority: "Medium" },
  { name: "TensorFlow", level: 46, status: "Developing" as SkillStatus, priority: "Medium" },
  { name: "Git", level: 74, status: "Strong" as SkillStatus, priority: "—" },
];

export const activity = [
  { title: "Resume analyzed", detail: "resume_alex_kumar.pdf", time: "12 min ago", tone: "info" },
  { title: "Job description analyzed", detail: "Machine Learning Engineer · Nimbus Labs", time: "Yesterday", tone: "brand" },
  { title: "Skill roadmap generated", detail: "5 milestones · 12 week plan", time: "2 days ago", tone: "signal" },
  { title: "Interview session completed", detail: "Technical · 82% relevance", time: "4 days ago", tone: "success" },
];

export const roadmap = [
  { phase: "Phase 1", topic: "Strengthen SQL", description: "Practice joins, window functions, and analytics queries with real datasets.", effort: "2 weeks", status: "In progress", action: "Continue practice" },
  { phase: "Phase 2", topic: "Learn Docker", description: "Containerize an ML service and understand reproducible development workflows.", effort: "3 weeks", status: "Next up", action: "Start learning" },
  { phase: "Phase 3", topic: "Learn TensorFlow", description: "Build and train a small neural network for a classification problem.", effort: "3 weeks", status: "Planned", action: "Preview milestone" },
  { phase: "Phase 4", topic: "Build ML project", description: "Create a portfolio project with evaluation, documentation, and a clear product story.", effort: "2 weeks", status: "Planned", action: "Preview milestone" },
  { phase: "Phase 5", topic: "Deploy project", description: "Ship the project with a simple API, monitoring basics, and a polished README.", effort: "2 weeks", status: "Planned", action: "Preview milestone" },
];

export const jobAnalysis = {
  title: "Machine Learning Engineer",
  company: "Nimbus Labs",
  location: "Bengaluru · Hybrid",
  required: ["Python", "SQL", "Machine Learning", "Pandas", "Scikit-learn"],
  preferred: ["TensorFlow", "Docker", "AWS"],
  responsibilities: [
    "Build and evaluate machine learning models for customer-facing products.",
    "Work with product and engineering teams to turn data into reliable features.",
    "Document experiments, model performance, and deployment considerations.",
  ],
};

export const interviewQuestion = "Explain the difference between supervised and unsupervised learning.";

export const mockServices = {
  analyzeResume: async () => ({ status: "success", message: "AI-generated insights are ready." }),
  analyzeJob: async () => ({ status: "success", message: "Job requirements mapped to your profile." }),
  saveProfile: async () => ({ status: "success", message: "Profile changes saved for this demo." }),
};