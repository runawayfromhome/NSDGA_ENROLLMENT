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
