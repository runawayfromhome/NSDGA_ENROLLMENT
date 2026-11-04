-- ============================================================================
-- Student applications, signup verification, and application security.
-- Run after schema.sql. Safe to re-run.
-- ============================================================================

create or replace function public.is_staff()
returns boolean
language sql security definer set search_path = '' stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('registrar', 'admin', 'headadmin')
      and status = 'verified'
      and disabled = false
  );
$$;

create table if not exists public.applications (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references auth.users(id) on delete cascade,
  school_year  text,
  grade_level  text,
  student_type text,
  status       text not null default 'submitted'
               check (status in (
                 'draft','submitted','under_review','needs_correction','enrolled',
                 'rejected','withdrawn','graduated','archived','completed'
               )),
  form         jsonb,
  documents    jsonb,
  billing      jsonb not null default '{}'::jsonb,
  review_note  text default '',
  student_no   text,
  reviewed_by  uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  reviewed_at  timestamptz
);

alter table public.applications
  add column if not exists billing jsonb not null default '{}'::jsonb;

create unique index if not exists applications_student_no_unique
  on public.applications (student_no) where student_no is not null;
create index if not exists idx_applications_status_year
  on public.applications (status, school_year);
create index if not exists idx_applications_student_id
  on public.applications (student_id);
create index if not exists idx_applications_grade
  on public.applications ((form->>'grade'));
create index if not exists idx_applications_strand
  on public.applications ((form->>'strand'));

create table if not exists public.otp_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code_hash text not null,
  purpose text not null default 'signup',
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.otp_codes enable row level security;
revoke all on public.otp_codes from anon, authenticated;

create or replace function public.enforce_application_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  previous_grade int;
  returning_grade int;
begin
  if auth.uid() is null then return new; end if;
  if public.is_staff() then
    if new.student_type = 'Returnee' then
      select max(nullif(regexp_replace(form->>'grade', '\D', '', 'g'), '')::int)
        into previous_grade
        from public.applications
        where student_id = new.student_id;
      returning_grade := nullif(regexp_replace(new.form->>'grade', '\D', '', 'g'), '')::int;
      if previous_grade = 12 then
        raise exception 'Grade 12 students cannot be re-admitted';
      end if;
      if previous_grade is null or returning_grade is null or returning_grade <= previous_grade then
        raise exception 'A returning student must be re-admitted to a higher grade';
      end if;
    elsif exists (
      select 1 from public.applications
      where student_id = new.student_id
        and form->>'grade' = 'Grade 12'
    ) then
      raise exception 'Grade 12 students cannot be re-admitted';
    end if;
    return new;
  end if;
  if new.student_id is distinct from auth.uid()
     or new.status not in ('draft', 'submitted')
     or new.student_no is not null then
    raise exception 'Not allowed to create this application';
  end if;
  if coalesce((new.form->>'sectionApproved')::boolean, false)
     or (new.form ? 'section') or (new.form ? 'classmates') then
    raise exception 'Not allowed to set a section assignment';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_application_insert on public.applications;
create trigger trg_enforce_application_insert
  before insert on public.applications
  for each row execute function public.enforce_application_insert();

create or replace function public.enforce_application_update()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  k text;
begin
  if auth.uid() is null then return new; end if;
  if public.is_staff() then
    if new.status = 'graduated'
       and old.status = 'enrolled'
       and old.form->>'grade' not in ('Grade 6', 'Grade 10', 'Grade 12') then
      raise exception 'Only Grade 6, Grade 10, and Grade 12 students can be graduated';
    end if;
    return new;
  end if;
  if new.status is distinct from old.status
     and not (old.status = 'needs_correction' and new.status = 'submitted') then
    raise exception 'Not allowed to change application status';
  end if;
  if new.student_no is distinct from old.student_no then
    raise exception 'Not allowed to set a student number';
  end if;
  if new.school_year is distinct from old.school_year
     or new.student_type is distinct from old.student_type
     or new.form->>'grade' is distinct from old.form->>'grade'
     or new.form->>'strand' is distinct from old.form->>'strand' then
    raise exception 'Not allowed to change application classification';
  end if;
  if new.billing is distinct from old.billing then
    raise exception 'Not allowed to change billing';
  end if;
  if (new.form->'section') is distinct from (old.form->'section')
     or (new.form->'sectionApproved') is distinct from (old.form->'sectionApproved')
     or (new.form->'classmates') is distinct from (old.form->'classmates') then
    raise exception 'Not allowed to change section assignment';
  end if;
  if old.status in ('enrolled', 'completed')
     and new.documents is distinct from old.documents then
    for k in select jsonb_object_keys(coalesce(old.documents, '{}'::jsonb)) loop
      if coalesce(old.documents->k->>'status', '') in ('uploaded', 'verified')
         and (new.documents->k) is distinct from (old.documents->k) then
        raise exception 'This document is already submitted and can no longer be changed.';
      end if;
    end loop;
  end if;
  if old.status = 'needs_correction' and new.status = 'submitted'
     and old.submitted_at is not null
     and old.submitted_at > now() - interval '60 seconds' then
    raise exception 'Please wait a minute before resubmitting.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_application on public.applications;
create trigger trg_enforce_application
  before update on public.applications
  for each row execute function public.enforce_application_update();

alter table public.applications enable row level security;

drop policy if exists "app_select" on public.applications;
create policy "app_select" on public.applications for select
  using (student_id = auth.uid() or public.is_staff());

drop policy if exists "app_insert" on public.applications;
create policy "app_insert" on public.applications for insert
  with check (student_id = auth.uid() or public.is_staff());

drop policy if exists "app_update" on public.applications;
create policy "app_update" on public.applications for update
  using (student_id = auth.uid() or public.is_staff())
  with check (student_id = auth.uid() or public.is_staff());

grant select, insert, update on public.applications to authenticated;
