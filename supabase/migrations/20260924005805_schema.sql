create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user (role, verification status, profile data)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  name         text,
  role         text not null default 'registrar'
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

-- ---------------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user is created.
-- name/role come from the metadata passed to signUp({ options: { data }}).
-- Runs as owner (security definer), so it bypasses RLS.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'registrar'),
    'pending_profile'
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
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'headadmin'
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
security definer set search_path = public
as $$
begin
  if public.is_headadmin() then
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

drop policy if exists "audit_insert" on public.audit_log;
create policy "audit_insert" on public.audit_log
  for insert to authenticated, anon with check (true);

drop policy if exists "audit_select_headadmin" on public.audit_log;
create policy "audit_select_headadmin" on public.audit_log
  for select using (public.is_headadmin());

-- ---------------------------------------------------------------------------
-- Table privileges for the API roles (RLS still governs row access)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles  to authenticated;
grant insert on public.audit_log to anon, authenticated;
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