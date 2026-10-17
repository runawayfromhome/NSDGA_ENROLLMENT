// supabase/functions/admin-account-limits/index.ts
// Step-up-authenticated save of the per-role active-account limits. Only a
// signed-in HeadAdmin (with MFA enabled) may call it — raising a cap could let
// someone add rogue staff, so a 6-digit code is emailed to confirm.
//   { }                 → emails a code to the HeadAdmin
//   { limits, code }    → verifies the code, then writes site_content('account_limits')
// Codes expire after 10 minutes; max 5 wrong attempts.
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

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const brevoKey = Deno.env.get('BREVO_API_KEY');
  const fromEmail = Deno.env.get('NOTIFY_FROM_EMAIL');
  const fromName = Deno.env.get('NOTIFY_FROM_NAME') || 'NSDGA Admin';
  const admin = createClient(url, serviceKey);

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user?.email) return json({ error: 'Not authenticated.' }, 401);
    const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (!me || me.role !== 'headadmin') return json({ error: 'Only the Head Administrator can change account limits.' }, 403);

    const { data: factors } = await caller.auth.mfa.listFactors();
    if (!(factors?.totp || []).some((f) => f.status === 'verified')) {
      return json({ error: 'Enable Multi-Factor Authentication (MFA) in your Settings before changing account limits.' }, 403);
    }

    const { limits, code } = await req.json();

    // ---- Mode 1: email a step-up code --------------------------------------
    if (!code) {
      const { data: existing } = await admin.from('otp_codes').select('created_at').eq('user_id', user.id).maybeSingle();
      if (existing && Date.now() - new Date(existing.created_at).getTime() < 30_000) {
        return json({ error: 'Please wait a few seconds before requesting another code.' }, 429);
      }
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const code_hash = await sha256(`${user.id}:${otp}`);
      const expires_at = new Date(Date.now() + 10 * 60_000).toISOString();
      const { error: upErr } = await admin.from('otp_codes')
        .upsert({ user_id: user.id, code_hash, purpose: 'limits', expires_at, attempts: 0, created_at: new Date().toISOString() });
      if (upErr) return json({ error: upErr.message }, 500);
      if (!brevoKey || !fromEmail) return json({ error: 'Email is not configured on the server.' }, 500);
      const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto">
        <div style="background:#800000;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0">
          <h2 style="margin:0;font-size:17px">Nuestra Señora de Guia Academy</h2>
          <p style="margin:4px 0 0;opacity:.85;font-size:12px">Head Admin · Security Confirmation</p></div>
        <div style="border:1px solid #eee;border-top:none;padding:24px;border-radius:0 0 12px 12px;color:#333">
          <p>Use this code to confirm a change to the <b>staff account limits</b>:</p>
          <p style="font-size:30px;font-weight:bold;letter-spacing:8px;color:#800000;text-align:center;margin:18px 0">${otp}</p>
          <p style="color:#777;font-size:13px">Expires in 10 minutes. If you did NOT initiate this, ignore this email and review your account security.</p>
        </div></div>`;
      const r = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': brevoKey, 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ sender: { name: fromName, email: fromEmail }, to: [{ email: user.email }], subject: 'NSDGA — confirm account-limit change', htmlContent: html }),
      });
      const data = await r.json();
      if (!r.ok) return json({ error: data.message || 'Could not send the code.' }, 502);
      return json({ ok: true, sentTo: user.email });
    }

    // ---- Mode 2: verify the code, then save the limits ---------------------
    if (!limits || typeof limits !== 'object') return json({ error: 'Missing limits.' }, 400);

    const { data: row } = await admin.from('otp_codes').select('*').eq('user_id', user.id).maybeSingle();
    if (!row || row.purpose !== 'limits') return json({ error: 'Request a code first.' }, 400);
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await admin.from('otp_codes').delete().eq('user_id', user.id);
      return json({ error: 'This code has expired. Please request a new one.' }, 400);
    }
    if (row.attempts >= 5) {
      await admin.from('otp_codes').delete().eq('user_id', user.id);
      return json({ error: 'Too many attempts. Please request a new code.' }, 429);
    }
    const ok = (await sha256(`${user.id}:${String(code).trim()}`)) === row.code_hash;
    if (!ok) {
      await admin.from('otp_codes').update({ attempts: row.attempts + 1 }).eq('user_id', user.id);
      return json({ error: 'Incorrect code. Please try again.' }, 400);
    }

    const clean: Record<string, number> = {};
    for (const role of ROLES) {
      const n = Math.round(Number(limits[role]));
      clean[role] = Math.max(1, Math.min(99, Number.isFinite(n) ? n : DEFAULTS[role]));
    }
    const { error: wErr } = await admin.from('site_content').upsert({
      section: 'account_limits', content: clean, updated_at: new Date().toISOString(), updated_by: user.id,
    });
    if (wErr) return json({ error: wErr.message }, 500);

    await admin.from('otp_codes').delete().eq('user_id', user.id);
    return json({ ok: true, limits: clean });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
