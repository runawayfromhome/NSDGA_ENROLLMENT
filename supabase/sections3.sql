-- ============================================================================
-- Senior High sections are strand-specific: a Grade 11/12 section belongs to one
-- strand (STEM / ABM / HUMSS / GAS / TVL) and only students of that strand may
-- be assigned to it. Grade 1-10 sections leave this null.
-- Run once in the Supabase SQL Editor.
-- ============================================================================
alter table public.sections add column if not exists strand text;
