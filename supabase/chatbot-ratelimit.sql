-- ============================================================================
-- Chatbot rate limiting (security review F-04).
-- The public chatbot endpoint proxies to the paid Anthropic API, so a script
-- could drain credits. This adds a per-IP fixed-window counter the chatbot Edge
-- Function checks (via service role) before each call. Run once in the SQL Editor.
-- ============================================================================

create table if not exists public.chat_rate_limits (
  ip           text primary key,
  window_start timestamptz not null default now(),
  count        int not null default 0
);

alter table public.chat_rate_limits enable row level security;
-- No policies + revoked grants => only the service role (the Edge Function) can
-- touch this table; anon/authenticated have no access at all.
revoke all on public.chat_rate_limits from anon, authenticated;

-- Atomic check-and-increment. Returns TRUE if the request is allowed, FALSE if
-- the caller has exceeded p_limit requests within the last p_window_secs.
create or replace function public.chat_rate_check(p_ip text, p_limit int, p_window_secs int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_count int;
begin
  if coalesce(p_ip, '') = '' then
    return true; -- no identifiable IP: don't block legitimate users
  end if;

  insert into public.chat_rate_limits as crl (ip, window_start, count)
  values (p_ip, now(), 1)
  on conflict (ip) do update set
    window_start = case when crl.window_start < now() - make_interval(secs => p_window_secs)
                        then now() else crl.window_start end,
    count        = case when crl.window_start < now() - make_interval(secs => p_window_secs)
                        then 1 else crl.count + 1 end
  returning crl.count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.chat_rate_check(text, int, int) from public, anon, authenticated;
grant execute on function public.chat_rate_check(text, int, int) to service_role;
