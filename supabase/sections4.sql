-- ============================================================================
-- Harden section creation at the DATABASE level (not just in the app):
--   - Unique section name per school year + grade (case-insensitive). This
--     closes the race where two simultaneous creates slip past the app check.
-- Run once in the Supabase SQL Editor.
--
-- NOTE: if this fails, you already have duplicate names — find + rename them:
--   select school_year, grade, lower(name), count(*)
--   from public.sections group by 1,2,3 having count(*) > 1;
-- ============================================================================
create unique index if not exists sections_unique_name_per_grade
  on public.sections (school_year, grade, lower(name));
