-- ============================================================================
-- Lock submitted documents at the API / database level (not just the UI).
-- Once a student is ENROLLED or COMPLETED, they may only ADD a document that is
-- still missing, or RE-UPLOAD one the Registrar marked 'rejected'. Documents
-- already 'uploaded' or 'verified' can no longer be changed or removed by the
-- student. Staff (and the service role) are unaffected.
--
-- This mirrors the UI lock on the student "My Documents" page, enforced server-
-- side so it can't be bypassed by calling the Supabase API directly.
--
-- Run once in the Supabase SQL Editor. It REPLACES enforce_application_update
-- (keeps the existing status / student_no / billing rules and adds the doc lock).
-- Needs: is_staff() (from students.sql).
-- ============================================================================
create or replace function public.enforce_application_update()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  k text;
begin
  -- Staff and server-side (auth.uid() is null) bypass all student restrictions.
  if auth.uid() is null or public.is_staff() then
    return new;
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

  -- Document lock — only once the student is enrolled/completed. During the
  -- application phase they may still freely edit/replace their documents.
  if old.status in ('enrolled', 'completed')
     and new.documents is distinct from old.documents then
    for k in select jsonb_object_keys(coalesce(old.documents, '{}'::jsonb)) loop
      -- A document already 'uploaded' or 'verified' must not change or be removed.
      if coalesce(old.documents->k->>'status', '') in ('uploaded', 'verified')
         and (new.documents->k) is distinct from (old.documents->k) then
        raise exception 'This document is already submitted and can no longer be changed.';
      end if;
      -- (A 'rejected' or missing document is NOT in this guard, so re-uploading
      --  a rejected one or adding a missing one is still allowed.)
    end loop;
  end if;

  return new;
end;
$$;

-- Recreate the trigger to be safe (it already exists from students.sql/billing.sql).
drop trigger if exists trg_enforce_application on public.applications;
create trigger trg_enforce_application
  before update on public.applications
  for each row execute function public.enforce_application_update();
