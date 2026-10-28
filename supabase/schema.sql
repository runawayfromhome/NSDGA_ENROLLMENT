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
