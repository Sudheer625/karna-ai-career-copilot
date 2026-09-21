# KARNA Career Compass

KARNA AI CAREER COPILOT

Phase 2 — Lovable Master Prompt

You are building the frontend prototype and initial application structure for a production-quality AI career platform called KARNA AI Career Copilot.

The attached Phase 1 document is the authoritative product specification. Follow it for product scope, user flows, modules, and architecture.

Your task in this phase is to build a high-quality, responsive frontend/MVP prototype that is ready for later backend and AI integration.

1. PRODUCT VISION

KARNA AI Career Copilot helps students and fresh graduates improve their career readiness through AI-powered:

Resume analysis

Job-description analysis

Job matching

Skill-gap analysis

Personalized career roadmaps

Interview preparation

Career progress tracking

The application should feel like a serious modern SaaS product, not a generic AI demo.

Target users:

B.Tech/B.E. students

Fresh graduates

Entry-level job seekers

Placement-preparation students

2. IMPORTANT SCOPE RULE

This is Phase 2 — UI/UX + Initial MVP.

For this phase:

DO

Build the complete frontend experience.

Build reusable components.

Build all major pages.

Build navigation and user flows.

Use realistic mock data where backend data is unavailable.

Create polished loading, empty, error, and success states.

Make the application responsive.

Prepare the codebase for future Supabase and Gemini integration.

Keep components modular and maintainable.

DO NOT YET

Do not implement production Gemini API integration.

Do not expose or request any API keys.

Do not implement production Supabase authentication.

Do not implement real resume storage.

Do not implement real job-board integrations.

Do not implement n8n automation.

Do not hard-code the architecture in a way that makes future backend integration difficult.

Use clean mock services/data so the backend can later replace them without redesigning the UI.

3. TECHNOLOGY

Use:

Next.js

React

TypeScript

Tailwind CSS

Modern component architecture

Lucide icons or another consistent icon library

Responsive design

Prefer reusable components over duplicated page-specific code.

Keep the project deployment-friendly for Vercel.

4. DESIGN DIRECTION

Create a premium AI career SaaS interface.

The visual language should communicate:

Intelligent

Professional

Trustworthy

Modern

Academic/career focused

Clean

Technical without being intimidating

Avoid:

Generic AI landing-page aesthetics

Excessive gradients

Excessive glassmorphism

Overloaded dashboards

Cartoonish illustrations

Huge decorative elements

Unnecessary animations

Cluttered cards

Use subtle visual hierarchy, spacing, borders, shadows, and restrained accents.

5. BRANDING

Application name:

KARNA AI Career Copilot

Short brand:

KARNA AI

Tagline:

Your AI-powered career companion.

Supporting message:

Analyze your resume, discover your skill gaps, match your profile with opportunities, and prepare for your next interview.

Use a professional dark/light capable design system.

Primary UI should be clean and readable.

Include a theme toggle if it can be implemented cleanly.

6. GLOBAL APPLICATION STRUCTURE

Create the following structure:

/
Landing Page

/login
Login

/register
Registration

/dashboard
Main Dashboard

/profile
Student Profile

/resume
Resume Analyzer

/jobs
Job Matching

/skills
Skill Gap Analyzer

/roadmap
Career Roadmap

/interview
Interview Preparation

/settings
Settings


Use a consistent application shell after login.

7. LANDING PAGE

Create a polished landing page.

Hero

Headline:

Build the career you’re ready for.

Subheadline:

KARNA AI Career Copilot analyzes your resume, identifies skill gaps, matches you with target roles, and helps you prepare for interviews.

Primary CTA:

Get Started

Secondary CTA:

Explore Features

Hero visual

Show a polished dashboard preview/mockup demonstrating:

Profile alignment

Skills

Skill gaps

Job matches

Career roadmap

Do not use fake stock photos as the main visual.

8. LANDING PAGE SECTIONS

Include:

Features

Resume Intelligence
Job Matching
Skill Gap Analysis
Career Roadmaps
Interview Preparation

How it works

Upload Resume
      ↓
Understand Your Profile
      ↓
Compare With Target Roles
      ↓
Find Skill Gaps
      ↓
Build Your Roadmap
      ↓
Prepare For Interviews


Target users

Students and fresh graduates.

CTA

Start Your Career Analysis

Footer

Include:

KARNA AI

Product

Features

About

Privacy

Terms

Use placeholder links where necessary.

9. LOGIN PAGE

Create a professional login page.

Fields:

Email

Password

Actions:

Login

Forgot password

Continue to registration

Include a clean KARNA AI brand presentation.

For Phase 2, authentication can be mocked.

10. REGISTRATION PAGE

Fields:

Full name

Email

Password

Confirm password

Optional:

Degree

Graduation year

CTA:

Create Account

Use client-side validation.

11. MAIN DASHBOARD

The dashboard is the most important authenticated page.

Create a professional application shell:

Sidebar
    Dashboard
    Resume Analyzer
    Job Matching
    Skill Gap
    Career Roadmap
    Interview Prep
    Profile
    Settings

Top Bar
    Search
    Notifications
    User Profile


Dashboard content:

Welcome

Example:

Good morning, Sudheer 👋

Let’s move your career forward.

Career Overview

Cards:

Profile Alignment

Skills

Skill Gaps

Jobs Analyzed

Interview Progress

Use realistic mock values.

Example:

Profile Alignment
78%

Skills
14

Skill Gaps
5

Jobs Analyzed
8


12. DASHBOARD — SKILL OVERVIEW

Create a visual skill section.

Example:

Python        ██████████ 100%
SQL           ████████░░ 80%
Machine Learning ███████░░░ 70%
Docker        ███░░░░░░░ 30%
AWS           ██░░░░░░░░ 20%


Use progress indicators.

Do not imply that these values are real user data.

13. DASHBOARD — RECENT ACTIVITY

Display:

Resume analyzed

Job description analyzed

Skill roadmap generated

Interview session completed

Use realistic timestamps.

14. DASHBOARD — QUICK ACTIONS

Create prominent actions:

Analyze Resume

Analyze a Job

Find Skill Gaps

Start Interview Prep

15. RESUME ANALYZER

Route:

/resume

Create a polished resume analysis workflow.

Initial state:

Large upload area.

Text:

Upload your resume

Supported format:

PDF

CTA:

Choose Resume

Also provide:

Drag & Drop

For Phase 2, use mock upload behavior.

After upload, show a processing state:

Uploading Resume
Extracting Content
Analyzing Skills
Generating Insights


Then show a realistic analysis result.

16. RESUME ANALYSIS RESULT

Create sections:

Resume Overview

Education

Experience

Projects

Certifications

Skills

Strengths

Example:

Strong Python foundation

Relevant ML projects

Good technical skill coverage

Areas to Improve

Example:

Add measurable project outcomes

Improve keyword alignment

Add deployment experience

Resume Indicators

Show:

Skill coverage

Keyword coverage

Project relevance

Experience alignment

Do not label these as an official ATS score.

17. JOB MATCHING

Route:

/jobs

Create two possible input modes:

Option A

Paste job description.

Option B

Upload job description.

For Phase 2, implement paste mode fully with mock analysis.

Fields:

Job title

Company

Job description

CTA:

Analyze Job

18. JOB ANALYSIS

Display:

Role

Machine Learning Engineer

Required Skills

Python

SQL

Machine Learning

Pandas

Scikit-learn

Preferred Skills

TensorFlow

Docker

AWS

Responsibilities

Show realistic bullet points.

19. JOB MATCH RESULT

Create a premium result page.

Show:

Profile Alignment

78%

Again, clearly present this as an application-generated alignment indicator.

Show:

Matched Skills
✓ Python
✓ Pandas
✓ Scikit-learn

Missing Skills
○ Docker
○ AWS
○ TensorFlow


Create a visual comparison between:

Your Profile

and

Job Requirements

20. SKILL GAP ANALYZER

Route:

/skills

Create a clear skill-gap dashboard.

Categories:

Strong

Skills already aligned with target role.

Developing

Skills where improvement is recommended.

Missing

Skills not currently demonstrated in the profile.

Example:

SkillStatusPriorityPythonStrong—SQLStrong—DockerMissingHighTensorFlowDevelopingMediumAWSMissingMedium

Use visual status indicators.

21. CAREER ROADMAP

Route:

/roadmap

Create a personalized roadmap interface.

Example:

Career Goal
Machine Learning Engineer

        ↓

Phase 1
Strengthen SQL

        ↓

Phase 2
Learn Docker

        ↓

Phase 3
Learn TensorFlow

        ↓

Phase 4
Build ML Project

        ↓

Phase 5
Deploy Project


Each milestone should have:

Topic

Description

Estimated learning effort

Status

Recommended action

Use realistic mock data.

22. INTERVIEW PREPARATION

Route:

/interview

Create:

Select target role

Example:

Machine Learning Engineer

Interview types

Technical

HR

Project

Mixed

Difficulty

Beginner

Intermediate

Advanced

CTA:

Start Interview

23. INTERVIEW SESSION UI

Create an interview interface.

Show:

Question 1 of 10

Explain the difference between
supervised and unsupervised learning.


Answer box.

Buttons:

Submit Answer

Skip

Next Question

After submission, show a mock evaluation:

Relevance       82%
Clarity         76%
Technical Depth 71%

Feedback:
Your answer is correct but could include
a concrete example.


24. PROFILE PAGE

Route:

/profile

Sections:

Personal Information

Name

Email

Phone

Education

Degree

Branch

Graduation year

Career Preferences

Target role

Preferred location

Experience level

Skills

Allow adding/removing mock skills.

CTA:

Save Profile

25. SETTINGS

Route:

/settings

Sections:

Account

Appearance

Notifications

Privacy

Add theme toggle if supported cleanly.

26. RESPONSIVE DESIGN

The application must work properly on:

Desktop

Laptop

Tablet

Mobile

On mobile:

Convert sidebar to mobile navigation

Preserve readable cards

Stack dashboard sections

Ensure upload components remain usable

Ensure tables become responsive

Do not simply shrink desktop UI.

27. UX STATES

Every major feature should include:

Loading

Use skeleton loaders.

Empty

Explain what the user should do next.

Error

Provide useful recovery actions.

Success

Provide clear confirmation.

Disabled

Use disabled states where actions are unavailable.

Avoid blank screens.

28. MOCK DATA ARCHITECTURE

Create mock data/services separately.

For example:

mock/
services/
components/
pages/


Do not hard-code mock values throughout UI components.

The future backend should be replaceable without rewriting the UI.

29. FUTURE BACKEND COMPATIBILITY

Design the frontend so it can later connect to:

Supabase

Authentication

PostgreSQL

Storage

Gemini API

Resume analysis

Job analysis

Skill extraction

Roadmap generation

Interview generation

Answer evaluation

The frontend should use service abstractions rather than directly coupling every component to future APIs.

30. COMPONENT SYSTEM

Create reusable components for:

Buttons

Cards

Modal/dialog

Input

Textarea

Select

Tabs

Progress bars

Badges

Alerts

Upload area

Skill chips

Metric cards

Charts

Timeline

Navigation

Empty states

Loading states

Avoid duplicate implementations.

31. ACCESSIBILITY

Ensure:

Keyboard navigation

Visible focus states

Proper labels

Semantic HTML

Sufficient contrast

Accessible buttons

Accessible form fields

Responsive text sizing

32. ANIMATION

Use subtle animations only.

Examples:

Page transitions

Card hover

Progress animation

Upload processing

Dashboard entrance

Avoid excessive motion.

33. DATA VISUALIZATION

Use charts only where they communicate meaningful information.

Potential charts:

Skill progress

Career progress

Interview performance

Profile alignment

Do not fill the dashboard with unnecessary charts.

34. IMPORTANT PRODUCT LANGUAGE

Use professional terminology.

Prefer:

Profile Alignment

instead of:

Guaranteed Job Match

Prefer:

AI-generated insights

instead of:

Perfect career prediction

Prefer:

Skill Gap

instead of:

You are unqualified

The application should help users make informed career decisions without promising employment outcomes.

35. DEMO USER

Create a realistic demo profile for the prototype.

Example:

Name:
Alex Kumar

Degree:
B.Tech Computer Science

Graduation:
2026

Experience:
Fresher

Target Role:
Machine Learning Engineer

Skills:

Python

SQL

Pandas

NumPy

Scikit-learn

Git

Machine Learning

Use this only as mock/demo data.

36. CODE QUALITY

Follow these rules:

TypeScript strictness where practical

Reusable components

Clean folder structure

Clear naming

Avoid unnecessary duplication

Avoid huge monolithic components

Keep business logic separated from UI

Keep mock data separate

Keep future API boundaries clear

37. DO NOT OVERBUILD

Do not add unrelated features.

Do not add:

Social network

Chat community

Payment system

Job application automation

LinkedIn scraping

Complex admin panel

Unrequested AI agents

Keep the product focused on career intelligence.

38. FINAL ACCEPTANCE CRITERIA

The Phase 2 result should have:

A polished landing page

Functional navigation

Login/register UI

Dashboard

Resume analyzer UI

Job matching UI

Skill gap UI

Career roadmap UI

Interview preparation UI

Profile page

Settings page

Responsive design

Realistic mock data

Loading states

Empty states

Error states

Reusable components

Clean TypeScript code

Clear separation between UI and mock services

Vercel-friendly project structure

The result should feel like a real SaaS product prototype, not a collection of unrelated pages.

39. FINAL INSTRUCTION

Build the application incrementally and verify that all pages are connected through navigation.

Prioritize:

Product consistency

UX quality

Responsive design

Component reusability

Clean architecture

Future Supabase compatibility

Future Gemini API compatibility

Do not implement the production backend or real Gemini integration in this phase.

Use realistic mock data and clearly separated mock services.

The final result should be ready for the next development phase where Claude Code/Codex will inspect the repository and implement the backend, Supabase integration, Gemini integration, security, and production logic.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/942bbf47-17fa-43f4-b739-82f12a706dee).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
