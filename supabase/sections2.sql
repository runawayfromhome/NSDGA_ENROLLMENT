-- ============================================================================
-- Section approval: sections start 'pending' (registrar) and become 'approved'
-- (admin). On approval the roster is written to each student's own record, so
-- students see their class without ever reading other students' data.
-- Run once in the Supabase SQL Editor.
-- ============================================================================
alter table public.sections add column if not exists status text not null default 'pending';
