// supabase/functions/admin-remove-mfa/index.ts
// Step-up-authenticated MFA RESET (account recovery). Who may reset whom:
//   - Head Admin  → a registrar or admin (staff) who lost their authenticator
//   - Admin       → a student who lost their authenticator
// The caller must ALSO have MFA enabled (same rule as other account changes).
//   { }                           → emails a 6-digit code to the caller
//   { targetUserId, code }        → verifies the code, then removes the target's
//                                   enrolled MFA factors (via remove_user_mfa RPC)
// Codes expire after 10 minutes; max 5 wrong attempts.
//
// Deploy:  supabase functions deploy admin-remove-mfa
// Needs:   public.remove_user_mfa(uuid) (see supabase/remove-mfa.sql) + BREVO secrets.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

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
    if (!me || !['headadmin', 'admin'].includes(me.role)) return json({ error: 'Not allowed.' }, 403);

    // The caller must have their own MFA enabled to perform account changes.
    const { data: factors } = await caller.auth.mfa.listFactors();
    if (!(factors?.totp || []).some((f) => f.status === 'verified')) {
      return json({ error: 'Enable Two-Factor Authentication (MFA) in your Settings before making account changes.' }, 403);
    }

    const { targetUserId, code } = await req.json();

    // ---- Mode 1: request a step-up code (emailed to the caller) --------------
    if (!code) {
      const { data: existing } = await admin.from('otp_codes').select('created_at').eq('user_id', user.id).maybeSingle();
      if (existing && Date.now() - new Date(existing.created_at).getTime() < 30_000) {
        return json({ error: 'Please wait a few seconds before requesting another code.' }, 429);
      }
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const code_hash = await sha256(`${user.id}:${otp}`);
      const expires_at = new Date(Date.now() + 10 * 60_000).toISOString();
      const { error: upErr } = await admin.from('otp_codes')
        .upsert({ user_id: user.id, code_hash, purpose: 'mfareset', expires_at, attempts: 0, created_at: new Date().toISOString() });
      if (upErr) return json({ error: upErr.message }, 500);
      if (!brevoKey || !fromEmail) return json({ error: 'Email is not configured on the server.' }, 500);
      const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto">
        <div style="background:#800000;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0">
          <h2 style="margin:0;font-size:17px">Nuestra Señora de Guia Academy</h2>
          <p style="margin:4px 0 0;opacity:.85;font-size:12px">Security Confirmation</p></div>
        <div style="border:1px solid #eee;border-top:none;padding:24px;border-radius:0 0 12px 12px;color:#333">
          <p>Use this code to confirm an <b>MFA reset</b> you are performing for another account:</p>
          <p style="font-size:30px;font-weight:bold;letter-spacing:8px;color:#800000;text-align:center;margin:18px 0">${otp}</p>
          <p style="color:#777;font-size:13px">Expires in 10 minutes. If you did NOT initiate this, ignore this email and review your account security.</p>
        </div></div>`;
      const r = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': brevoKey, 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ sender: { name: fromName, email: fromEmail }, to: [{ email: user.email }], subject: 'NSDGA — confirm MFA reset', htmlContent: html }),
      });
      const data = await r.json();
      if (!r.ok) return json({ error: data.message || 'Could not send the code.' }, 502);
      return json({ ok: true, sentTo: user.email });
    }

    // ---- Mode 2: verify the code, then remove the target's MFA ---------------
    if (!targetUserId) return json({ error: 'Missing target.' }, 400);
    if (targetUserId === user.id) return json({ error: "You can't reset your own MFA here." }, 400);

    const { data: row } = await admin.from('otp_codes').select('*').eq('user_id', user.id).maybeSingle();
    if (!row || row.purpose !== 'mfareset') return json({ error: 'Request a code first.' }, 400);
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

    // Authorization matrix: who may reset whom.
    const { data: target } = await admin.from('profiles').select('role').eq('id', targetUserId).single();
    if (!target) return json({ error: 'Target account not found.' }, 404);
    const allowed = (me.role === 'headadmin' && ['registrar', 'admin'].includes(target.role))
                 || (me.role === 'admin' && target.role === 'student');
    if (!allowed) {
      return json({ error: me.role === 'admin' ? 'Admins can only reset student MFA.' : 'Head Admin can only reset staff (registrar/admin) MFA.' }, 403);
    }

    const { error: rpcErr } = await admin.rpc('remove_user_mfa', { uid: targetUserId });
    if (rpcErr) return json({ error: rpcErr.message }, 500);

    await admin.from('otp_codes').delete().eq('user_id', user.id);
    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
