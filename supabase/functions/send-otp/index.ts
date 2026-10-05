// supabase/functions/send-otp/index.ts
// Emails a 6-digit verification code to the SIGNED-IN applicant (themselves).
// The code is stored hashed (never in plaintext) with a 10-minute expiry.
// Uses Brevo, same as the notify function.
//
// Deploy:  supabase functions deploy send-otp
// Secrets: BREVO_API_KEY, NOTIFY_FROM_EMAIL, NOTIFY_FROM_NAME (already set).
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
  const fromName = Deno.env.get('NOTIFY_FROM_NAME') || 'NSDGA Admissions';
  const admin = createClient(url, serviceKey);

  try {
    // Caller must be signed in; the code is always for THEIR OWN account.
    const authHeader = req.headers.get('Authorization') ?? '';
    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user?.email) return json({ error: 'Not authenticated.' }, 401);

    // Simple resend throttle: refuse if a code was issued < 30s ago.
    const { data: existing } = await admin.from('otp_codes').select('created_at').eq('user_id', user.id).maybeSingle();
    if (existing && Date.now() - new Date(existing.created_at).getTime() < 30_000) {
      return json({ error: 'Please wait a few seconds before requesting another code.' }, 429);
    }

    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
    const code_hash = await sha256(`${user.id}:${code}`);
    const expires_at = new Date(Date.now() + 10 * 60_000).toISOString();
    const { error: upErr } = await admin.from('otp_codes')
      .upsert({ user_id: user.id, code_hash, purpose: 'signup', expires_at, attempts: 0, created_at: new Date().toISOString() });
    if (upErr) return json({ error: upErr.message }, 500);

    if (!brevoKey || !fromEmail) return json({ error: 'Email is not configured on the server.' }, 500);
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto">
      <div style="background:#800000;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0">
        <h2 style="margin:0;font-size:17px">Nuestra Señora de Guia Academy</h2>
        <p style="margin:4px 0 0;opacity:.85;font-size:12px">Online Admission</p></div>
      <div style="border:1px solid #eee;border-top:none;padding:24px;border-radius:0 0 12px 12px;color:#333">
        <p>Use this code to verify your account and complete your registration:</p>
        <p style="font-size:30px;font-weight:bold;letter-spacing:8px;color:#800000;text-align:center;margin:18px 0">${code}</p>
        <p style="color:#777;font-size:13px">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
      </div></div>`;
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': brevoKey, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ sender: { name: fromName, email: fromEmail }, to: [{ email: user.email }], subject: 'Your NSDGA verification code', htmlContent: html }),
    });
    const data = await r.json();
    if (!r.ok) return json({ error: data.message || 'Could not send the code.' }, 502);
    return json({ ok: true, sentTo: user.email });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
