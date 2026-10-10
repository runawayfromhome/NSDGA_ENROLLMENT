-- ============================================================================
-- Registrar "My Activity History" — let a staff member read their OWN audit_log
-- rows (so the History page can show what they did). Run once in the Supabase
-- SQL Editor.
--
-- Before: audit_log SELECT was HeadAdmin-only, so a registrar/admin couldn't see
--         their own actions.
-- After:  a user can read rows that carry their own email; HeadAdmin still reads
--         all (the existing headadmin policy stays, and permissive SELECT
--         policies combine with OR). Insert rules are unchanged.
-- ============================================================================
drop policy if exists "audit_select_self" on public.audit_log;
create policy "audit_select_self" on public.audit_log
  for select to authenticated
  using (email = auth.email());
