alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check
  check (status in (
    'submitted','under_review','needs_correction','enrolled','rejected',
    'withdrawn','graduated','archived'
  ));