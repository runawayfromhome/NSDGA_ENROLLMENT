-- ============================================================================
-- M1 + M4 — data-integrity + performance. Run once in the Supabase SQL Editor.
-- All statements are safe/additive (IF NOT EXISTS).
-- ============================================================================

-- M1: one student number can never be issued twice (closes the enroll race).
-- Partial index so the many not-yet-enrolled rows (null student_no) are allowed.
create unique index if not exists applications_student_no_unique
  on public.applications (student_no) where student_no is not null;

-- M4: indexes for frequently-filtered columns (faster at scale).
create index if not exists idx_applications_status_year  on public.applications (status, school_year);
create index if not exists idx_applications_student_id   on public.applications (student_id);
create index if not exists idx_applications_grade        on public.applications ((form->>'grade'));
create index if not exists idx_applications_strand       on public.applications ((form->>'strand'));
create index if not exists idx_sections_year_grade       on public.sections (school_year, grade);

-- Optional (run only if these tables exist in your project):
-- create index if not exists idx_audit_created    on public.audit_log (created_at desc);
-- create index if not exists idx_presence_lastseen on public.presence (last_seen);
