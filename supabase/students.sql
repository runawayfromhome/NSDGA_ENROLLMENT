-- ============================================================================
-- STUDENT ONLINE APPLY — applications table + security
-- Run this once in the Supabase SQL Editor.
-- ============================================================================

-- 1) New public sign-ups become the LOWEST-privilege role: 'student'.
--    (Staff keep coming from the create-staff Edge Function, which sets their
--    real role afterward — so a self-signup can never make itself staff.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    'student',
    'verified'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

-- 2) Helper: is the caller a VERIFIED staff member? (verified-gated on purpose,
--    so an unverified/half-made account never counts as staff.)
create or replace function public.is_staff()
returns boolean
language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('registrar','admin','headadmin')
      and status = 'verified'
  );
$$;

-- 3) The applications table (one admission form per applicant / school year).
create table if not exists public.applications (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references auth.users(id) on delete cascade,
  school_year  text,
  grade_level  text,
  student_type text,                                   -- New / Transferee / Returnee
  status       text not null default 'submitted'
               check (status in ('submitted','under_review','needs_correction','enrolled','rejected')),
  form         jsonb,                                  -- the admission form fields
  documents    jsonb,                                  -- uploaded document URLs (later)
  review_note  text default '',
  student_no   text,                                   -- assigned by registrar on enroll
  reviewed_by  uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  reviewed_at  timestamptz
);

-- 4) A STUDENT may edit their own application, but may NOT enroll themselves:
--    they cannot set a student number, and cannot flip their own status
--    (except resubmitting after a "needs correction"). Only staff can enroll.
create or replace function public.enforce_application_update()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_staff() then
    return new;                                        -- staff (registrar) can do anything
  end if;
  if new.status is distinct from old.status
     and not (old.status = 'needs_correction' and new.status = 'submitted') then
    raise exception 'Not allowed to change application status';
  end if;
  if new.student_no is distinct from old.student_no then
    raise exception 'Not allowed to set a student number';
  end if;
  return new;
end; $$;

drop trigger if exists trg_enforce_application on public.applications;
create trigger trg_enforce_application
  before update on public.applications
  for each row execute function public.enforce_application_update();

-- 5) Row-Level Security: a student sees ONLY their own row; staff see all.
alter table public.applications enable row level security;

drop policy if exists "app_select" on public.applications;
create policy "app_select" on public.applications for select
  using (student_id = auth.uid() or public.is_staff());

drop policy if exists "app_insert" on public.applications;
create policy "app_insert" on public.applications for insert
  with check (student_id = auth.uid());

drop policy if exists "app_update" on public.applications;
create policy "app_update" on public.applications for update
  using (student_id = auth.uid() or public.is_staff())
  with check (student_id = auth.uid() or public.is_staff());

grant select, insert, update on public.applications to authenticated;
