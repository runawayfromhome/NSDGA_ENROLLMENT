
drop policy if exists "audit_insert" on public.audit_log;
revoke insert on public.audit_log from anon;


create policy "audit_insert_self" on public.audit_log
  for insert to authenticated
  with check ( email = auth.email() );


