create table if not exists public.career_roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  model text not null,
  roadmap jsonb not null,
  status text not null default 'completed'
    check (status in ('processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists career_roadmaps_user_id_idx
  on public.career_roadmaps(user_id);

create index if not exists career_roadmaps_resume_id_idx
  on public.career_roadmaps(resume_id);

create index if not exists career_roadmaps_job_id_idx
  on public.career_roadmaps(job_id);

alter table public.career_roadmaps enable row level security;

create policy "career_roadmaps_select_own"
  on public.career_roadmaps
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "career_roadmaps_insert_own"
  on public.career_roadmaps
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "career_roadmaps_update_own"
  on public.career_roadmaps
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "career_roadmaps_delete_own"
  on public.career_roadmaps
  for delete
  to authenticated
  using (user_id = auth.uid());

create or replace function public.set_career_roadmaps_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger career_roadmaps_set_updated_at
before update on public.career_roadmaps
for each row
execute function public.set_career_roadmaps_updated_at();
