-- ============================================================================
-- Harden audit-log integrity (security review F-01).
-- Before: any anon/authenticated caller could INSERT arbitrary audit rows with
-- client-chosen email/name/role/action (forgery + flooding of the audit trail).
-- After:  all writes go through log_event(), which stamps identity from the JWT;
-- direct client INSERT into audit_log is revoked.
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================================

-- 1) The only writer. SECURITY DEFINER so it can insert past RLS, but it derives
--    email/name/role from the signed-in user — never from the caller's input.
--    For a failed login (no session yet) it records role 'unknown' and the
--    attempted email only.
create or replace function public.log_event(
  p_action        text,
  p_status        text default 'SUCCESS',
  p_reason        text default '',
  p_device        text default '',
  p_attempt_email text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text; v_name text; v_role text;
begin
  if auth.uid() is not null then
    select p.email, p.name, p.role
      into v_email, v_name, v_role
      from public.profiles p
     where p.id = auth.uid();
  else
    v_email := p_attempt_email;
    v_name  := p_attempt_email;
    v_role  := 'unknown';
  end if;

  insert into public.audit_log (email, name, role, action, status, reason, device)
  values (
    v_email,
    coalesce(v_name, v_email),
    coalesce(v_role, 'unknown'),
    p_action,
    coalesce(p_status, 'SUCCESS'),
    coalesce(p_reason, ''),
    coalesce(p_device, '')
  );
end;
$$;

revoke all on function public.log_event(text, text, text, text, text) from public;
grant execute on function public.log_event(text, text, text, text, text) to anon, authenticated;

-- 2) Close the open table-level insert — clients may no longer write rows directly.
drop policy if exists "audit_insert" on public.audit_log;
revoke insert on public.audit_log from anon, authenticated;

-- (SELECT policies are unchanged: HeadAdmin reads all; a user reads their own
--  rows via the email = auth.email() self-select policy.)
