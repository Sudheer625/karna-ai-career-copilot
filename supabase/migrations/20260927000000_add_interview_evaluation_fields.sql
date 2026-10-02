alter table public.interview_sessions
  add column if not exists evaluation jsonb,
  add column if not exists evaluation_model text;