-- ============================================================================
-- Account-recovery helper: remove a user's enrolled MFA (TOTP) factors.
-- Called ONLY by the admin-remove-mfa Edge Function (service role). The Edge
-- Function does the real authorization (who may reset whom) + OTP step-up.
-- Run once in the Supabase SQL Editor.
-- ============================================================================
create or replace function public.remove_user_mfa(uid uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  delete from auth.mfa_factors where user_id = uid;
  get diagnostics n = row_count;
  return n;
end; $$;

-- Lock it down: only the service role (the Edge Function) may call it.
revoke all on function public.remove_user_mfa(uuid) from public, anon, authenticated;
grant execute on function public.remove_user_mfa(uuid) to service_role;
