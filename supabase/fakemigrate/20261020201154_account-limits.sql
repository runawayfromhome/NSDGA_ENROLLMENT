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
