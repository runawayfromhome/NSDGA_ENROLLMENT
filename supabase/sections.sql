-- ============================================================================
-- Class sections, approval, strand support, and section limits.
-- Run after students.sql. Safe to re-run.
-- ============================================================================

create table if not exists public.sections (
  id          uuid primary key default gen_random_uuid(),
  school_year text not null,
  grade       text not null,
  name        text not null,
  adviser     text default '',
  capacity    int,
  status      text not null default 'pending',
  strand      text,
  created_at  timestamptz not null default now()
);

alter table public.sections
  add column if not exists status text not null default 'pending';
alter table public.sections
  add column if not exists strand text;

alter table public.sections enable row level security;

drop policy if exists "sections_all" on public.sections;
create policy "sections_all" on public.sections for all
  using (public.is_staff()) with check (public.is_staff());

create unique index if not exists sections_unique_name_per_grade
  on public.sections (school_year, grade, lower(name));
create index if not exists idx_sections_year_grade
  on public.sections (school_year, grade);

grant select, insert, update, delete on public.sections to authenticated;

create or replace function public.enforce_section_limit()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  cnt int;
  max_per_grade int;
begin
  if auth.uid() is null then return new; end if;
  select nullif(content->>'maxSectionsPerGrade', '')::int into max_per_grade
    from public.site_content where section = 'enrollment';
  if max_per_grade is null or max_per_grade < 1 then max_per_grade := 20; end if;
  if new.strand is not null then
    select count(*) into cnt from public.sections
      where school_year = new.school_year and grade = new.grade and strand = new.strand;
  else
    select count(*) into cnt from public.sections
      where school_year = new.school_year and grade = new.grade and strand is null;
  end if;
  if cnt >= max_per_grade then
    raise exception 'This grade/strand already has the maximum % sections per school year.', max_per_grade;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_section_limit on public.sections;
create trigger trg_enforce_section_limit
  before insert on public.sections
  for each row execute function public.enforce_section_limit();
