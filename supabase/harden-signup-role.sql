-- ============================================================================
-- CRITICAL FIX (security review F-11): privilege escalation via self-signup.
-- If handle_new_user() read the new user's role from raw_user_meta_data, then a
-- public signUp() with { data: { role: 'admin' } } would create an ADMIN. This
-- re-asserts the hardened trigger: the role is ALWAYS forced to 'student'
-- server-side; client metadata is used only for the display name. Staff accounts
-- are created exclusively by the create-staff Edge Function (service role), which
-- upgrades the role afterward — so forcing 'student' here never blocks them.
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),  -- name only (harmless)
    'student',   -- ROLE is ALWAYS forced here — NEVER taken from client metadata
    'verified'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- The trigger itself is unchanged (already attached); re-create defensively.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
