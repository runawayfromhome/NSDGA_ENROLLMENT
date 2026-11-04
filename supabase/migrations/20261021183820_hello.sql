-- NSDGA Enrollment - schema-only Supabase migration bundle
--
-- Generated from supabase/*.sql in dependency order.
-- Demo seed scripts live in supabase/seed/ and are never deployed by supabase db push.
-- Do not put passwords or demo data in this migration.


-- ============================================================================
-- BEGIN schema.sql
-- ============================================================================
-- ============================================================================
-- NSDGA Enrollment — Supabase schema (run this in the Supabase SQL Editor)
-- Dashboard -> SQL Editor -> New query -> paste all of this -> Run.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE / DROP ... IF EXISTS).
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user (role, verification status, profile data)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  name         text,
  role         text not null default 'student'
                 check (role in ('registrar','admin','headadmin','student')),
  status       text not null default 'pending_profile'
                 check (status in ('pending_profile','pending_verification','verified')),
  disabled     boolean not null default false,
  profile      jsonb,
  return_note  text default '',
  created_at   timestamptz not null default now(),
  submitted_at timestamptz, 
  verified_at  timestamptz
);

-- ---------------------------------------------------------------------------
-- audit_log: login / logout history
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email      text,
  name       text,
  role       text,
  action     text,   -- LOGIN / LOGOUT
  status     text,   -- SUCCESS / FAILED
  reason     text,
  ip         text,
  device     text
);

create table if not exists public.audit_log_rate_limits (
  identity text primary key,
  window_started timestamptz not null default now(),
  event_count integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Auto-create a student profile whenever a new auth user is created. Applicant
-- accounts are confirmed by create-applicant and are immediately usable; staff
-- accounts are changed to pending_profile by the protected create-staff flow.
-- Only the display name is read from signup metadata; role is never client-controlled.
-- Runs as owner (security definer), so it bypasses RLS.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
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
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helper: is the caller a HeadAdmin? security definer avoids RLS recursion.
-- ---------------------------------------------------------------------------
create or replace function public.is_headadmin()
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'headadmin'
      and status = 'verified' and disabled = false
  );
$$;

-- ---------------------------------------------------------------------------
-- Guard: a normal user may edit ONLY their own profile data. They cannot change
-- their role, cannot enable/disable, and can only move their status from
-- pending_profile -> pending_verification (i.e. submit). Only HeadAdmin can
-- verify accounts or change roles. This is what makes the flow tamper-proof.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_profile_update()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_headadmin() then
    return new; -- HeadAdmin may change anything
  end if;
  if new.role is distinct from old.role then
    raise exception 'Not allowed to change role';
  end if;
  if new.disabled is distinct from old.disabled then
    raise exception 'Not allowed to change disabled';
  end if;
  if new.status is distinct from old.status then
    if not (old.status = 'pending_profile' and new.status = 'pending_verification') then
      raise exception 'Not allowed to change status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_profile_update on public.profiles;
create trigger trg_enforce_profile_update
  before update on public.profiles
  for each row execute function public.enforce_profile_update();

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.is_headadmin());

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (id = auth.uid() or public.is_headadmin())
  with check (id = auth.uid() or public.is_headadmin());

drop policy if exists "profiles_insert_headadmin" on public.profiles;
create policy "profiles_insert_headadmin" on public.profiles
  for insert with check (public.is_headadmin());

drop policy if exists "audit_select_headadmin" on public.audit_log;
create policy "audit_select_headadmin" on public.audit_log
  for select using (public.is_headadmin());

-- ---------------------------------------------------------------------------
-- Table privileges for the API roles (RLS still governs row access)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles  to authenticated;
revoke insert on public.audit_log from anon, authenticated;

-- Trusted audit writer. Identity is derived from the session, not caller input.
create or replace function public.log_event(
  p_action text,
  p_status text default 'SUCCESS',
  p_reason text default '',
  p_device text default '',
  p_attempt_email text default null,
  p_ip text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_name text;
  v_role text;
  v_identity text;
  v_count integer;
begin
  if p_action not in (
    'LOGIN', 'LOGOUT', 'MFA_FAIL', 'MFA_ENABLE', 'MFA_DISABLE', 'MFA_RESET',
    'PASSWORD_CHANGE', 'PASSWORD_RESET', 'ACCOUNT_CREATE', 'ACCOUNT_VERIFY',
    'ROLE_CHANGE', 'PROFILE_RETURN', 'CONTENT_EDIT', 'BILLING_UPDATE',
    'DOC_UPLOAD', 'APPLY_SIGNUP', 'APPLY_SUBMIT', 'APPLY_RESUBMIT',
    'REVIEW', 'RETURN', 'REJECT', 'ENROLL', 'COMPLETE', 'READMIT',
    'BULK_ARCHIVE', 'REACTIVATE', 'SECTION_APPROVE', 'SECTION_UNAPPROVE',
    'SECTION_CREATE', 'SECTION_RENAME', 'SECTION_SUBMIT', 'SECTION_DELETE'
  ) then
    raise exception 'Unsupported audit action';
  end if;
  if coalesce(p_status, 'SUCCESS') not in ('SUCCESS', 'FAILED') then
    raise exception 'Unsupported audit status';
  end if;

  v_identity := coalesce(auth.uid()::text, lower(nullif(trim(p_attempt_email), '')));
  if v_identity is null then
    raise exception 'An authenticated identity or attempted email is required';
  end if;

  if coalesce(p_status, 'SUCCESS') = 'FAILED' then
    insert into public.audit_log_rate_limits (identity, window_started, event_count)
    values (v_identity, now(), 1)
    on conflict (identity) do update
      set window_started = case
        when public.audit_log_rate_limits.window_started <= now() - interval '1 minute'
          then now()
        else public.audit_log_rate_limits.window_started
      end,
      event_count = case
        when public.audit_log_rate_limits.window_started <= now() - interval '1 minute'
          then 1
        else public.audit_log_rate_limits.event_count + 1
      end
    returning event_count into v_count;
    if v_count > 20 then
      return;
    end if;
  end if;

  if auth.uid() is not null then
    select p.email, p.name, p.role
      into v_email, v_name, v_role
      from public.profiles p
     where p.id = auth.uid();
  else
    v_email := p_attempt_email;
    v_name := p_attempt_email;
    v_role := 'unknown';
  end if;

  insert into public.audit_log (email, name, role, action, status, reason, ip, device)
  values (v_email, coalesce(v_name, v_email), coalesce(v_role, 'unknown'),
          p_action, coalesce(p_status, 'SUCCESS'), coalesce(p_reason, ''),
          p_ip, coalesce(p_device, ''));
end;
$$;

drop function if exists public.log_event(text, text, text, text, text);
revoke all on function public.log_event(text, text, text, text, text, text)
  from public;
grant execute on function public.log_event(text, text, text, text, text, text)
  to anon, authenticated;
grant select on public.audit_log to authenticated;

-- ============================================================================
-- AFTER running the above, and AFTER you create the HeadAdmin user in the
-- dashboard (Authentication -> Users -> Add user, email + password, Auto
-- Confirm), run THIS to promote that account to HeadAdmin + verified:
-- ============================================================================
-- update public.profiles
--   set role = 'headadmin', status = 'verified', verified_at = now(),
--       name = 'System Head Administrator'
--   where email = 'headadmin@nsdgamarikina.edu.ph';

-- END schema.sql
-- ============================================================================

-- ============================================================================
-- BEGIN students.sql
-- ============================================================================
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
begin
  if auth.uid() is null or public.is_staff() then return new; end if;
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
  if auth.uid() is null or public.is_staff() then return new; end if;
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

-- END students.sql
-- ============================================================================

-- ============================================================================
-- BEGIN sections.sql
-- ============================================================================
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
language plpgsql security definer set search_path = ''
as $$
declare
  cnt int;
  max_per_grade int;
begin
  if auth.uid() is null then return new; end if;
  if to_regclass('public.site_content') is not null then
    select nullif(content->>'maxSectionsPerGrade', '')::int into max_per_grade
      from public.site_content where section = 'enrollment';
  end if;
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

-- END sections.sql
-- ============================================================================

-- ============================================================================
-- BEGIN presence.sql
-- ============================================================================
-- ============================================================================
-- Presence: a per-user "last seen" heartbeat so Head Admin can see who's online
-- / offline and for how long. Each user upserts only their own row; staff read
-- all. Run once in the Supabase SQL Editor.  (Needs is_staff() from students.sql.)
-- ============================================================================
create table if not exists public.presence (
  id         uuid primary key references auth.users(id) on delete cascade,
  last_seen  timestamptz not null default now()
);

alter table public.presence enable row level security;

-- A user manages only their own presence row.
drop policy if exists "presence_self" on public.presence;
create policy "presence_self" on public.presence for all
  using (id = auth.uid()) with check (id = auth.uid());

-- Staff (registrar/admin/headadmin) can read everyone's presence.
drop policy if exists "presence_read" on public.presence;
create policy "presence_read" on public.presence for select
  using (public.is_staff());

grant select, insert, update on public.presence to authenticated;

-- END presence.sql
-- ============================================================================

-- ============================================================================
-- BEGIN student-docs.sql
-- ============================================================================
-- ============================================================================
-- STUDENT DOCUMENTS — private storage bucket + access rules.
-- Documents (PSA, report cards, etc.) are sensitive, so the bucket is PRIVATE
-- and files are viewed via short-lived signed URLs.
-- Run once in the Supabase SQL Editor.  (Needs is_staff() from students.sql.)
-- ============================================================================

-- 1) Private bucket
insert into storage.buckets (id, name, public)
values ('student-docs', 'student-docs', false)
on conflict (id) do nothing;

-- Files are stored under a per-student folder:  {user_id}/{doc}-{timestamp}.{ext}
-- so (storage.foldername(name))[1] is the owner's user id.

-- 2) A student can upload into THEIR OWN folder only
drop policy if exists "student_docs_insert" on storage.objects;
create policy "student_docs_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'student-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- 3) A student can read their own files; staff can read ALL
drop policy if exists "student_docs_select" on storage.objects;
create policy "student_docs_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'student-docs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff())
  );

-- 4) A student can replace their own files
drop policy if exists "student_docs_update" on storage.objects;
create policy "student_docs_update" on storage.objects for update to authenticated
  using (bucket_id = 'student-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- END student-docs.sql
-- ============================================================================

-- ============================================================================
-- BEGIN harden-site-content.sql
-- ============================================================================
-- ============================================================================
-- Define + lock down site_content (security review F-03).
-- This table holds the active school year, per-role account limits, SHS strands,
-- and all public website content. Its RLS was not in the repo, so this file makes
-- it explicit and reviewable: public READ, write only by verified Admin/HeadAdmin.
-- `create table if not exists` is non-destructive — it will NOT drop existing data.
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================================

create table if not exists public.site_content (
  section    text primary key,
  content    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.site_content enable row level security;

-- Helper: is the caller a VERIFIED Admin or HeadAdmin? security definer avoids
-- RLS recursion on profiles.
create or replace function public.is_admin_or_head()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid()
       and role in ('admin', 'headadmin')
       and status = 'verified'
       and disabled = false
  );
$$;

-- Public (even logged-out visitors) may READ site content.
drop policy if exists "content_read" on public.site_content;
create policy "content_read" on public.site_content
  for select to anon, authenticated using (true);

-- Only a verified Admin / HeadAdmin may create or change content.
drop policy if exists "content_write" on public.site_content;
create policy "content_write" on public.site_content
  for all to authenticated
  using (public.is_admin_or_head())
  with check (public.is_admin_or_head());

grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;

-- Note: the account-limits OTP flow writes through the admin-account-limits Edge
-- Function (service role), which is unaffected by these policies and keeps its
-- own HeadAdmin + MFA + emailed-code checks.

-- END harden-site-content.sql
-- ============================================================================

-- ============================================================================
-- BEGIN account-limits.sql
-- ============================================================================
-- ============================================================================
-- Active-account limits per staff role (defense-in-depth for the app-level check
-- in src/auth/authStore.js). An account is "active" when status = 'verified' AND
-- disabled = false. Caps are read from site_content('account_limits') with the
-- defaults below; HeadAdmin edits them in Settings → Account Limits.
--
-- The trigger fires only for INTERACTIVE writes (auth.uid() is not null), so it
-- enforces HeadAdmin actions (verify / enable / role change) but never blocks the
-- SQL-editor seed or the service-role create-staff function. Students are never
-- capped. Run once in the Supabase SQL Editor.
-- ============================================================================
create or replace function public.enforce_account_limit()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  defaults jsonb := '{"headadmin":2,"admin":4,"registrar":15}'::jsonb;
  limits   jsonb;
  cap      int;
  n        int;
begin
  -- Seed / service-role writes (no interactive user) are exempt. Also exempt any
  -- NON-HeadAdmin caller: only a HeadAdmin can legitimately change roles / verify
  -- accounts, so an illegitimate change (e.g. a student self-promoting) should be
  -- stopped by enforce_profile_update ("Not allowed to change role") instead of
  -- this cap — which otherwise leaks the role count to the attacker (QA-1).
  if auth.uid() is null or not public.is_headadmin() then return new; end if;
  -- Only staff roles are limited.
  if new.role not in ('headadmin','admin','registrar') then return new; end if;
  -- Only care when the NEW row would be active.
  if not (new.status = 'verified' and new.disabled = false) then return new; end if;
  -- Already-active same-role row (e.g. an unrelated profile edit) adds nothing.
  if tg_op = 'UPDATE'
     and old.status = 'verified' and old.disabled = false and old.role = new.role then
    return new;
  end if;

  select content into limits from public.site_content where section = 'account_limits';
  cap := coalesce((coalesce(limits, '{}'::jsonb) ->> new.role)::int, (defaults ->> new.role)::int);

  select count(*) into n from public.profiles
   where role = new.role and status = 'verified' and disabled = false and id <> new.id;

  if n >= cap then
    raise exception 'Active % limit reached (%). Disable an existing account or raise the limit in Settings.', new.role, cap;
  end if;
  return new;
end; $$;

drop trigger if exists trg_enforce_account_limit on public.profiles;
create trigger trg_enforce_account_limit
  before insert or update on public.profiles
  for each row execute function public.enforce_account_limit();

-- END account-limits.sql
-- ============================================================================

-- ============================================================================
-- BEGIN activity-history.sql
-- ============================================================================
-- ============================================================================
-- Registrar "My Activity History" — let a staff member read their OWN audit_log
-- rows (so the History page can show what they did). Run once in the Supabase
-- SQL Editor.
--
-- Before: audit_log SELECT was HeadAdmin-only, so a registrar/admin couldn't see
--         their own actions.
-- After:  a user can read rows that carry their own email; HeadAdmin still reads
--         all (the existing headadmin policy stays, and permissive SELECT
--         policies combine with OR). Insert rules are unchanged.
-- ============================================================================
drop policy if exists "audit_select_self" on public.audit_log;
create policy "audit_select_self" on public.audit_log
  for select to authenticated
  using (email = auth.email());

-- END activity-history.sql
-- ============================================================================

-- ============================================================================
-- BEGIN chatbot-ratelimit.sql
-- ============================================================================
-- ============================================================================
-- Chatbot rate limiting (security review F-04).
-- The public chatbot endpoint proxies to the paid Anthropic API, so a script
-- could drain credits. This adds a per-IP fixed-window counter the chatbot Edge
-- Function checks (via service role) before each call. Run once in the SQL Editor.
-- ============================================================================

create table if not exists public.chat_rate_limits (
  ip           text primary key,
  window_start timestamptz not null default now(),
  count        int not null default 0
);

alter table public.chat_rate_limits enable row level security;
-- No policies + revoked grants => only the service role (the Edge Function) can
-- touch this table; anon/authenticated have no access at all.
revoke all on public.chat_rate_limits from anon, authenticated;

-- Password-reset OTP resend limiter. The identity is a SHA-256 email hash,
-- so raw email addresses are never stored in this table.
create table if not exists public.otp_resend_limits (
  identity text primary key,
  window_started timestamptz not null default now(),
  request_count integer not null default 0,
  last_requested_at timestamptz not null default now()
);

alter table public.otp_resend_limits enable row level security;
revoke all on public.otp_resend_limits from public, anon, authenticated;

-- Atomic check-and-increment. Returns TRUE if the request is allowed, FALSE if
-- the caller has exceeded p_limit requests within the last p_window_secs.
create or replace function public.chat_rate_check(p_ip text, p_limit int, p_window_secs int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_count int;
begin
  if coalesce(p_ip, '') = '' then
    return true; -- no identifiable IP: don't block legitimate users
  end if;

  insert into public.chat_rate_limits as crl (ip, window_start, count)
  values (p_ip, now(), 1)
  on conflict (ip) do update set
    window_start = case when crl.window_start < now() - make_interval(secs => p_window_secs)
                        then now() else crl.window_start end,
    count        = case when crl.window_start < now() - make_interval(secs => p_window_secs)
                        then 1 else crl.count + 1 end
  returning crl.count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.chat_rate_check(text, int, int) from public, anon, authenticated;
grant execute on function public.chat_rate_check(text, int, int) to service_role;

-- END chatbot-ratelimit.sql
-- ============================================================================

-- ============================================================================
-- BEGIN remove-mfa.sql
-- ============================================================================
-- ============================================================================
-- Account-recovery helper: remove a user's enrolled MFA (TOTP) factors.
-- Called ONLY by the admin-remove-mfa Edge Function (service role). The Edge
-- Function does the real authorization (who may reset whom) + OTP step-up.
-- Run once in the Supabase SQL Editor.
-- ============================================================================
create or replace function public.remove_user_mfa(uid uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  delete from auth.mfa_factors where user_id = uid;
  get diagnostics n = row_count;
  return n;
end; $$;

-- Lock it down: only the service role (the Edge Function) may call it.
revoke all on function public.remove_user_mfa(uuid) from public, anon, authenticated;
grant execute on function public.remove_user_mfa(uuid) to service_role;

-- END remove-mfa.sql
-- ============================================================================

-- ============================================================================
-- BEGIN harden-production.sql
-- ============================================================================
-- ============================================================================
-- PRODUCTION HARDENING — run once in the Supabase SQL Editor before go-live.
-- Removes the dev-only plain-text password column. Safe if it doesn't exist.
-- ============================================================================
alter table public.profiles drop column if exists demo_password;

-- Reminder (do these in the dashboard, not here):
--   * Delete the 'seed-test-data' Edge Function (if still deployed).
--   * To FORCE MFA for staff, set MFA_REQUIRED_ROLES = ['admin','headadmin']
--     in src/auth/authStore.js — but ONLY after every staff member has an
--     authenticator enrolled, or they will be locked out at MFA setup.

-- END harden-production.sql
-- ============================================================================
