-- 1) Private bucket
insert into storage.buckets (id, name, public)
values ('student-docs', 'student-docs', false)
on conflict (id) do nothing;

-- Files are stored under a per-student folder:  {user_id}/{doc}-{timestamp}.{ext}
-- so (storage.foldername(name))[1] is the owner's user id.

-- 2) A student can upload into THEIR OWN folder only
drop policy if exists "student_docs_insert" on storage.objects;
create policy "student_docs_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'student-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- 3) A student can read their own files; staff can read ALL
drop policy if exists "student_docs_select" on storage.objects;
create policy "student_docs_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'student-docs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff())
  );

-- 4) A student can replace their own files
drop policy if exists "student_docs_update" on storage.objects;
create policy "student_docs_update" on storage.objects for update to authenticated
  using (bucket_id = 'student-docs' and (storage.foldername(name))[1] = auth.uid()::text);
