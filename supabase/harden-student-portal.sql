-- ============================================================================
-- STUDENT PORTAL SECURITY HARDENING — run once in the Supabase SQL Editor.
--
-- Closes gaps found in the student-portal security scan:
--   1) A student could INSERT a brand-new application row with status='enrolled'
--      and a self-chosen student_no (the enforce trigger was UPDATE-only), i.e.
--      self-enroll and bypass admission review.  → BEFORE INSERT guard.
--   2) A student could forge staff-only `form` fields (section / sectionApproved /
--      classmates) via a plain form update.      → blocked in both triggers.
--   3) Re-assert the hardened handle_new_user so a public sign-up can only ever
--      be a 'student' (never trust metadata role).
--   4) Give the private student-docs bucket a real size / type limit (UI-only
--      before this, so a direct API call could store arbitrary/large files).
--
-- Safe to re-run. Needs is_staff() (students.sql). Service-role inserts (the
-- create-applicant Edge Function) and staff are unaffected.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) BEFORE INSERT guard: a student may only file their OWN application, as a
--    fresh draft/submission, never pre-enrolled, never with a student number or
--    a (staff-assigned) section.
-- ----------------------------------------------------------------------------
create or replace function public.enforce_application_insert()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Service role (auth.uid() is null) and staff may insert anything.
  if auth.uid() is null or public.is_staff() then
    return new;
  end if;

  if new.student_id is distinct from auth.uid() then
    raise exception 'Cannot file an application for another user';
  end if;
  if new.status not in ('draft', 'submitted') then
    raise exception 'Not allowed to set that application status';
  end if;
  if new.student_no is not null then
    raise exception 'Not allowed to set a student number';
  end if;
  -- Section assignment is staff-only; a self-filed application carries none.
  if coalesce((new.form->>'sectionApproved')::boolean, false)
     or (new.form ? 'section')
     or (new.form ? 'classmates') then
    raise exception 'Not allowed to set a section assignment';
  end if;

  return new;
end; $$;

drop trigger if exists trg_enforce_application_insert on public.applications;
create trigger trg_enforce_application_insert
  before insert on public.applications
  for each row execute function public.enforce_application_insert();

-- ----------------------------------------------------------------------------
-- 2) UPDATE guard: keeps every existing rule (status / student_no / billing /
--    document lock) and ADDS a block on changing staff-only section fields.
--    (Replaces the function from lock-documents.sql.)
-- ----------------------------------------------------------------------------
create or replace function public.enforce_application_update()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  k text;
begin
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

  -- Section is assigned by the Registrar — a student can't grant it to themselves.
  if (new.form->'section')         is distinct from (old.form->'section')
     or (new.form->'sectionApproved') is distinct from (old.form->'sectionApproved')
     or (new.form->'classmates')   is distinct from (old.form->'classmates') then
    raise exception 'Not allowed to change section assignment';
  end if;

  -- Document lock once enrolled/completed: an already uploaded/verified document
  -- cannot be changed or removed (a missing or rejected one may still be (re)set).
  if old.status in ('enrolled', 'completed')
     and new.documents is distinct from old.documents then
    for k in select jsonb_object_keys(coalesce(old.documents, '{}'::jsonb)) loop
      if coalesce(old.documents->k->>'status', '') in ('uploaded', 'verified')
         and (new.documents->k) is distinct from (old.documents->k) then
        raise exception 'This document is already submitted and can no longer be changed.';
      end if;
    end loop;
  end if;

  return new;
end; $$;

drop trigger if exists trg_enforce_application on public.applications;
create trigger trg_enforce_application
  before update on public.applications
  for each row execute function public.enforce_application_update();

-- ----------------------------------------------------------------------------
-- 3) Re-assert: a public sign-up is ALWAYS the lowest-privilege 'student'
--    (never trust raw_user_meta_data->>'role'). Staff come from create-staff,
--    which sets their real role afterward.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role, status)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'name', new.email),
          'student', 'verified')
  on conflict (id) do nothing;
  return new;
end; $$;

-- ----------------------------------------------------------------------------
-- 4) Private bucket gets a real size / type limit (defense in depth; the UI
--    already restricts to 5MB and JPG/PNG/PDF).
-- ----------------------------------------------------------------------------
update storage.buckets
   set file_size_limit = 5242880, -- 5 MB
       allowed_mime_types = array['image/jpeg','image/png','application/pdf']
 where id = 'student-docs';
