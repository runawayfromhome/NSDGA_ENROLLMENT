drop policy if exists "app_insert" on public.applications;
create policy "app_insert" on public.applications for insert
  with check (student_id = auth.uid() or public.is_staff());
