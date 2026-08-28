-- ============================================================================
-- Re-enrollment cycle: add the 'completed' state (finished a year, eligible to
-- re-enroll into the next grade). Run once in the Supabase SQL Editor.
-- Specific grade is stored inside the application's `form` JSON, so no new
-- column or Edge Function change is needed.
-- ============================================================================
alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check
  check (status in (
    'submitted','under_review','needs_correction','enrolled','rejected',
    'withdrawn','graduated','archived','completed'
  ));
