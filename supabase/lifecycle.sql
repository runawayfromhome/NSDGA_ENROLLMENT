-- ============================================================================
-- Student lifecycle (soft deprovisioning): add post-enrollment states.
-- Records are NEVER deleted — a student is Withdrawn/Graduated/Archived and
-- their login is revoked (reversible). Run once in the Supabase SQL Editor.
-- ============================================================================
alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check
  check (status in (
    'submitted','under_review','needs_correction','enrolled','rejected',
    'withdrawn','graduated','archived'
  ));
