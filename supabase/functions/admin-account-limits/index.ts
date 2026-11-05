// supabase/functions/admin-account-limits/index.ts
// Step-up-authenticated save of the per-role active-account limits. Only a
// signed-in HeadAdmin with an AAL2 authenticator session may call it — raising
// a cap could let someone add rogue staff.
//
// Deploy:  supabase functions deploy admin-account-limits
// Secrets: BREVO_API_KEY, NOTIFY_FROM_EMAIL, NOTIFY_FROM_NAME (already set).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const DEFAULTS: Record<string, number> = { headadmin: 2, admin: 4, registrar: 15 };
const ROLES = ['headadmin', 'admin', 'registrar'];

function getJwtAal(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
    return (JSON.parse(atob(normalized)) as { aal?: string }).aal ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, serviceKey);

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user?.email) return json({ error: 'Not authenticated.' }, 401);
    const { data: me } = await admin.from('profiles')
      .select('role, status, disabled')
      .eq('id', user.id)
      .single();
    if (!me) {
      return json({ error: 'No profile was found for the signed-in account.' }, 403);
    }
    if (me.role !== 'headadmin') {
      return json({ error: `The signed-in profile has role "${me.role ?? ' unset'}"; Head Administrator access is required.` }, 403);
    }
    if (me.status !== 'verified') {
      return json({ error: `The Head Administrator profile is not verified (status: "${me.status ?? ' unset'}").` }, 403);
    }
    if (me.disabled === true) {
      return json({ error: 'The Head Administrator profile is disabled.' }, 403);
    }

    // The signed JWT is the authoritative result of Supabase MFA verification.
    // Avoid a second factor-list lookup here, which can be stale immediately
    // after mfa.verify() even though the session is already elevated.
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (getJwtAal(jwt) !== 'aal2') {
      return json({ error: 'The authenticator verification did not produce an AAL2 session. Please enter a fresh code and try again.' }, 403);
    }

    const { limits } = await req.json();
    if (!limits || typeof limits !== 'object') return json({ error: 'Missing limits.' }, 400);

    const clean: Record<string, number> = {};
    for (const role of ROLES) {
      const n = Math.round(Number(limits[role]));
      clean[role] = Math.max(1, Math.min(99, Number.isFinite(n) ? n : DEFAULTS[role]));
    }
    const { error: wErr } = await admin.from('site_content').upsert({
      section: 'account_limits', content: clean, updated_at: new Date().toISOString(), updated_by: user.id,
    });
    if (wErr) return json({ error: wErr.message }, 500);

    return json({ ok: true, limits: clean });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
