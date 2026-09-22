# KARNA AI Career Copilot

> An AI-powered career assistant that helps students and job seekers analyze resumes, discover matching jobs, identify skill gaps, and build personalized career roadmaps.

[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?logo=github)](https://github.com/Sudheer625/karna-ai-career-copilot)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?logo=google)](https://ai.google.dev/)

## Overview

**KARNA AI Career Copilot** is a full-stack AI career platform designed to turn a user's resume and career target into actionable guidance.

The platform combines:

- Secure authentication and user profiles
- Resume upload and PDF text extraction
- AI-powered resume intelligence
- Deterministic job matching
- Deterministic skill-gap analysis
- AI-generated personalized career roadmaps
- A professional career workspace UI

The project uses deterministic logic wherever possible and Gemini where generative reasoning adds value.

## Core Features

### 1. Authentication & Profile

- Email/password authentication with Supabase Auth
- User profile management
- Academic and career information
- Target role and preferred location
- User skill management
- Row Level Security (RLS) for user-owned data

### 2. Resume Management

- Secure PDF resume upload
- Private Supabase Storage bucket
- Per-user storage paths
- Resume metadata tracking
- Resume processing status
- PDF text extraction
- Processing failure and retry states
- Signed access URLs for private resume files

### 3. AI Resume Intelligence

Gemini analyzes the processed resume and extracts structured information including:

- Professional summary
- Technical and soft skills
- Skill proficiency
- Education
- Experience
- Projects
- Certifications
- Recommended roles
- Missing skills

The structured result is stored in Supabase so the application does not regenerate the analysis on every page load.

### 4. Job Matching

KARNA uses deterministic skill matching rather than spending AI credits for every job comparison.

Current scoring:

- **80%** required-skill coverage
- **20%** preferred-skill coverage

Common skill aliases are normalized, including React.js/ReactJS, NodeJS/Node.js, JS/JavaScript, TS/TypeScript, ML/Machine Learning, and Postgres/PostgreSQL.

The system stores:

- Match score
- Matched skills
- Missing skills

### 5. Skill Gap Analysis

The Skill Gap page compares the candidate's analyzed skills against a selected target job.

It provides:

- Overall skill coverage
- Matched skills with proficiency
- Missing required skills
- Missing preferred skills
- Deterministic priority ordering

Required gaps are treated as the primary learning priority, followed by preferred skill gaps.

No Gemini call is required for this feature.

### 6. Personalized Career Roadmap

The Career Roadmap feature combines:

```text
Resume Analysis
       +
Target Job
       +
Skill Gap Analysis
       ↓
      Gemini
       ↓
Personalized Career Roadmap
```

A generated roadmap can include:

- Career goal
- Target role
- Current level
- Estimated duration
- Learning phases
- Skills to develop
- Topics to study
- Practice tasks
- Projects
- Final project
- Milestones

Generated roadmaps are persisted in Supabase and reused on subsequent visits instead of automatically calling Gemini again.

## Architecture

```text
                     ┌──────────────────────┐
                     │      KARNA UI        │
                     │ React + TypeScript   │
                     │ TanStack Start       │
                     └──────────┬───────────┘
                                │
                     Authenticated Requests
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
      ┌───────▼────────┐                ┌────────▼────────┐
      │    Supabase    │                │  Server AI Layer │
      │ Auth + Postgres│                │  TanStack Start  │
      │ + Storage + RLS│                │                  │
      └───────┬────────┘                └────────┬─────────┘
              │                                  │
              │                           ┌──────▼──────┐
              │                           │   Gemini    │
              │                           │ 2.5 Flash   │
              │                           └─────────────┘
              │
              └───────────────┬─────────────────────
                              │
                    Persisted AI Results
```

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 |
| Language | TypeScript |
| Full-stack framework | TanStack Start |
| Routing | TanStack Router |
| Build tool | Vite |
| Styling | Tailwind CSS |
| UI primitives | Radix UI |
| Backend | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| File storage | Supabase Storage |
| AI | Google Gemini 2.5 Flash |
| Validation | Zod |
| Deployment target | Vercel |
| Version control | Git + GitHub |

## Project Structure

```text
karna-ai-career-copilot/
├── public/
├── scripts/
│   ├── verify-job-matching.mjs
│   └── verify-skill-gap.mjs
├── src/
│   ├── components/
│   │   ├── karna-pages.tsx
│   │   └── karna-ui.tsx
│   ├── lib/
│   │   ├── career-roadmap.ts
│   │   ├── gemini-resume-analysis.ts
│   │   ├── job-matching.ts
│   │   ├── job-matching-service.ts
│   │   ├── resume-processing.ts
│   │   ├── resume-service.ts
│   │   └── skill-gap.ts
│   ├── routes/
│   │   ├── dashboard.tsx
│   │   ├── interview.tsx
│   │   ├── jobs.tsx
│   │   ├── login.tsx
│   │   ├── profile.tsx
│   │   ├── register.tsx
│   │   ├── resume.tsx
│   │   ├── roadmap.tsx
│   │   ├── settings.tsx
│   │   └── skills.tsx
│   └── start.ts
├── supabase/
│   └── migrations/
├── AGENTS.md
├── package.json
└── README.md
```

## Database

Core tables:

- `profiles`
- `user_skills`
- `resumes`
- `resume_analyses`
- `jobs`
- `job_matches`
- `career_roadmaps`

### Security

User-owned tables use Supabase Row Level Security.

The application follows these principles:

- Users can access only their own profile and career data.
- Resume files are stored in a private bucket.
- Resume storage paths are scoped to authenticated user IDs.
- Gemini API keys are server-side only.
- Service-role/secret keys are never exposed to the frontend.
- AI results are persisted to reduce unnecessary API calls.
- Server functions verify authentication and resource ownership before processing.

## Environment Variables

Create `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY

GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Never expose or commit:

```text
GEMINI_API_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_SECRET_KEY
```

Only the Supabase publishable key belongs in browser-side environment variables.

## Getting Started

### 1. Clone

```bash
git clone https://github.com/Sudheer625/karna-ai-career-copilot.git
cd karna-ai-career-copilot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create `.env.local` and add the required Supabase and Gemini variables.

### 4. Start development server

```bash
npm run dev
```

### 5. Open the application

Use the local URL printed by TanStack Start/Vite.

## Validation

Before committing changes:

```bash
npx tsc --noEmit
npm run build
git diff --check
```

For deterministic matching and skill-gap logic:

```bash
node --experimental-strip-types scripts/verify-job-matching.mjs
node --experimental-strip-types scripts/verify-skill-gap.mjs
```

## Current Development Progress

### Completed

- [x] Authentication
- [x] User profiles
- [x] User skills
- [x] Resume upload
- [x] Private resume storage
- [x] PDF text extraction
- [x] Gemini resume analysis
- [x] Deterministic job matching
- [x] Skill gap analysis
- [x] Career roadmap database
- [x] Gemini career roadmap generation
- [x] Career roadmap UI

### Planned

- [ ] AI mock interview
- [ ] Interview evaluation and feedback
- [ ] Interview history
- [ ] Dashboard integration
- [ ] Career progress tracking
- [ ] Production hardening
- [ ] Final QA
- [ ] Vercel deployment

## AI Usage Strategy

A key design principle of KARNA AI Career Copilot is:

> **Use AI where reasoning is valuable; use deterministic logic where rules are sufficient.**

| Feature | Approach |
|---|---|
| Resume intelligence | Gemini |
| Job matching | Deterministic |
| Skill gap analysis | Deterministic |
| Career roadmap | Gemini |
| Stored roadmap retrieval | Database |
| Skill normalization | Deterministic |

This reduces unnecessary AI usage, improves reproducibility, and makes core matching behavior easier to test.

## Roadmap Generation Flow

```text
User
 │
 ├── Select Resume
 │
 └── Select Target Job
          │
          ▼
   Existing Roadmap?
      │          │
     Yes         No
      │          │
      ▼          ▼
 Return Stored   Skill Gap
 Roadmap            │
                    ▼
                  Gemini
                    │
                    ▼
                Zod Validation
                    │
                    ▼
              Supabase Database
                    │
                    ▼
             Display Roadmap
```

## Development Philosophy

KARNA is being developed incrementally with a focus on:

- Secure-by-default architecture
- Reusable services
- Deterministic algorithms where appropriate
- Structured AI outputs
- Persistent AI results
- Minimal unnecessary API calls
- Strong ownership checks
- Production-friendly deployment
- Clean and professional UI/UX

## Contributing

This repository is primarily a personal/educational project.

If you want to suggest improvements:

1. Fork the repository.
2. Create a feature branch.
3. Make focused changes.
4. Run the validation commands.
5. Open a pull request.

Avoid rewriting published Git history because the repository may be connected to external development tooling.

## Author

**Singidi Sai Naga Sudheer**

B.Tech — Computer Science and Engineering

GitHub: https://github.com/Sudheer625

Project Repository: https://github.com/Sudheer625/karna-ai-career-copilot

## License

This project is currently intended as a personal/educational project. Add a formal license before distributing or reusing the project commercially.
