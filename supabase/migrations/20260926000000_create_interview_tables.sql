create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  target_role text,
  interview_type text not null default 'technical',
  status text not null default 'created'
    check (status in ('created', 'in_progress', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  question_order integer not null,
  question text not null,
  category text,
  difficulty text,
  user_answer text,
  evaluation jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, question_order)
);

create index interview_sessions_user_id_idx
  on public.interview_sessions(user_id);

create index interview_sessions_resume_id_idx
  on public.interview_sessions(resume_id);

create index interview_sessions_job_id_idx
  on public.interview_sessions(job_id);

create index interview_questions_session_id_idx
  on public.interview_questions(session_id);

create index interview_questions_session_order_idx
  on public.interview_questions(session_id, question_order);

alter table public.interview_sessions enable row level security;
alter table public.interview_questions enable row level security;

create policy "interview_sessions_select_own"
  on public.interview_sessions
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "interview_sessions_insert_own"
  on public.interview_sessions
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "interview_sessions_update_own"
  on public.interview_sessions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "interview_sessions_delete_own"
  on public.interview_sessions
  for delete
  to authenticated
  using (user_id = auth.uid());

create policy "interview_questions_select_own_session"
  on public.interview_questions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.interview_sessions
      where interview_sessions.id = interview_questions.session_id
        and interview_sessions.user_id = auth.uid()
    )
  );

create policy "interview_questions_insert_own_session"
  on public.interview_questions
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.interview_sessions
      where interview_sessions.id = interview_questions.session_id
        and interview_sessions.user_id = auth.uid()
    )
  );

create policy "interview_questions_update_own_session"
  on public.interview_questions
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.interview_sessions
      where interview_sessions.id = interview_questions.session_id
        and interview_sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.interview_sessions
      where interview_sessions.id = interview_questions.session_id
        and interview_sessions.user_id = auth.uid()
    )
  );

create policy "interview_questions_delete_own_session"
  on public.interview_questions
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.interview_sessions
      where interview_sessions.id = interview_questions.session_id
        and interview_sessions.user_id = auth.uid()
    )
  );

create or replace function public.set_interview_sessions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger interview_sessions_set_updated_at
before update on public.interview_sessions
for each row
execute function public.set_interview_sessions_updated_at();

create or replace function public.set_interview_questions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger interview_questions_set_updated_at
before update on public.interview_questions
for each row
execute function public.set_interview_questions_updated_at();