-- ============================================================================
-- F-06 (resubmit throttle) + F-08 (search_path hardening, safe subset).
-- Non-destructive: `create or replace` updates the function bodies in place; the
-- existing triggers/policies stay attached. Run once in the SQL Editor.
--
-- F-08 scope note: the functions below already fully-qualify every reference
-- (public.*, auth.*), so search_path = public was not actually exploitable. We
-- still pin search_path = '' on the two most-used RLS helpers as defense-in-depth.
-- The remaining definer functions (handle_new_user, enforce_profile_update,
-- enforce_application_insert, enforce_section_limit, enforce_account_limit) are
-- likewise fully-qualified and are ACCEPTED as-is — re-creating ~8 critical auth
-- functions for no real gain carries more breakage risk than benefit.
-- ============================================================================

-- F-08: pin search_path on the two helpers used by (almost) every RLS policy.
create or replace function public.is_headadmin()
returns boolean
language sql security definer set search_path = '' stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'headadmin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql security definer set search_path = '' stable
as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid()
       and role in ('registrar', 'admin', 'headadmin')
       and status = 'verified'
  );
$$;

-- F-06 (+ F-08): re-assert the application-update guard with search_path = '' and
-- add a soft throttle — a student may resubmit a returned application at most once
-- per minute. Staff and the server (auth.uid() is null) are never throttled.
create or replace function public.enforce_application_update()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_staff() then
    return new;                                   -- staff/server may do anything
  end if;

  if new.status is distinct from old.status
     and not (old.status = 'needs_correction' and new.status = 'submitted') then
    raise exception 'Not allowed to change application status';
  end if;
  if new.student_no is distinct from old.student_no then
    raise exception 'Not allowed to set a student number';
  end if;
  if new.billing is distinct from old.billing then
    raise exception 'Not allowed to change billing';
  end if;

  -- F-06: soft anti-spam throttle on resubmission (self-only; backstop against a
  -- scripted rapid-resubmit via the API — the UI already gates this).
  if old.status = 'needs_correction' and new.status = 'submitted'
     and old.submitted_at is not null
     and old.submitted_at > now() - interval '60 seconds' then
    raise exception 'Please wait a minute before resubmitting.';
  end if;

  return new;
end;
$$;
