-- ============================================================================
-- Re-admission: let staff file an enrollment record on behalf of a returning
-- student (previously students could only insert their own). Run once.
-- ============================================================================
drop policy if exists "app_insert" on public.applications;
create policy "app_insert" on public.applications for insert
  with check (student_id = auth.uid() or public.is_staff());
