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
