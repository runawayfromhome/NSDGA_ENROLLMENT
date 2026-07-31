-- ============================================================================
-- Harden the audit log (run once in the Supabase SQL Editor).
--
-- Before: anyone (even anonymous) could INSERT any audit row → spoof/spam.
-- After:  only a signed-in user can insert, and ONLY rows about themselves
--         (email must match their own JWT). No one can forge another user's
--         login/logout events, and anonymous inserts are blocked entirely.
--
-- Trade-off: failed-login attempts (which happen while anonymous) are no longer
-- written to this table. Successful logins and logouts still are.
-- ============================================================================

-- remove the old open policy + the anonymous insert grant
drop policy if exists "audit_insert" on public.audit_log;
revoke insert on public.audit_log from anon;

-- authenticated users may insert ONLY rows carrying their own email
create policy "audit_insert_self" on public.audit_log
  for insert to authenticated
  with check ( email = auth.email() );

-- (select stays HeadAdmin-only, unchanged)
