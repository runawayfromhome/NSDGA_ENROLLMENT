-- Public site images used by Admin/HeadAdmin content editors.
-- The bucket is public for read-only display on public pages; writes remain
-- restricted to verified, enabled Admin and HeadAdmin accounts.

insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do update set public = true;

drop policy if exists "site_images_select" on storage.objects;
create policy "site_images_select" on storage.objects
  for select
  using (bucket_id = 'site-images');

drop policy if exists "site_images_insert" on storage.objects;
create policy "site_images_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'site-images'
    and (storage.foldername(name))[1] in ('events', 'board', 'strands')
    and public.is_admin_or_head()
  );

drop policy if exists "site_images_update" on storage.objects;
create policy "site_images_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'site-images'
    and public.is_admin_or_head()
  )
  with check (
    bucket_id = 'site-images'
    and (storage.foldername(name))[1] in ('events', 'board', 'strands')
    and public.is_admin_or_head()
  );

drop policy if exists "site_images_delete" on storage.objects;
create policy "site_images_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'site-images'
    and public.is_admin_or_head()
  );
