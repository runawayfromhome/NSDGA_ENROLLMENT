-- ============================================================================
-- Class sections & advisers (registrar-managed). One row per section per
-- grade per school year — Grade 1–12 can each have many sections.
-- A student's section is stored on their enrollment record (application form).
-- Run once in the Supabase SQL Editor.  (Needs is_staff() from students.sql.)
-- ============================================================================
create table if not exists public.sections (
  id          uuid primary key default gen_random_uuid(),
  school_year text not null,
  grade       text not null,              -- "Grade 7"
  name        text not null,              -- "St. Peter"
  adviser     text default '',
  capacity    int,
  created_at  timestamptz not null default now()
);

alter table public.sections enable row level security;

drop policy if exists "sections_all" on public.sections;
create policy "sections_all" on public.sections for all
  using (public.is_staff()) with check (public.is_staff());

grant select, insert, update, delete on public.sections to authenticated;
