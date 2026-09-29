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
