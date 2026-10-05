// supabase/functions/send-reset-otp/index.ts
// PUBLIC forgot-password step 1: emails a 6-digit reset code to a STUDENT.
// Anonymous (the user forgot their password), so it looks the account up by
// email server-side with the service role. To avoid leaking which emails exist,
// it ALWAYS returns { ok: true } — a code is only actually sent for a real
// student account. Code is stored hashed with a 10-minute expiry.
//
// Deploy:  supabase functions deploy send-reset-otp
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
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const brevoKey = Deno.env.get('BREVO_API_KEY');
  const fromEmail = Deno.env.get('NOTIFY_FROM_EMAIL');
  const fromName = Deno.env.get('NOTIFY_FROM_NAME') || 'NSDGA Admissions';
  const admin = createClient(url, serviceKey);

  try {
    const { email } = await req.json();
    const clean = String(email || '').trim().toLowerCase();
    if (!clean) return json({ error: 'Email is required.' }, 400);

    // Look up the student by email. If none, pretend success (no leak).
    const { data: prof } = await admin.from('profiles')
      .select('id, role').ilike('email', clean).maybeSingle();
    if (!prof || prof.role !== 'student') return json({ ok: true });

    // Throttle: refuse if a code was issued < 30s ago.
    const { data: existing } = await admin.from('otp_codes').select('created_at').eq('user_id', prof.id).maybeSingle();
    if (existing && Date.now() - new Date(existing.created_at).getTime() < 30_000) {
      return json({ ok: true }); // silently ok — don't reveal timing either
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const code_hash = await sha256(`${prof.id}:${code}`);
    const expires_at = new Date(Date.now() + 10 * 60_000).toISOString();
    await admin.from('otp_codes').upsert({ user_id: prof.id, code_hash, purpose: 'reset', expires_at, attempts: 0, created_at: new Date().toISOString() });

    if (brevoKey && fromEmail) {
      const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto">
        <div style="background:#800000;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0">
          <h2 style="margin:0;font-size:17px">Nuestra Señora de Guia Academy</h2>
          <p style="margin:4px 0 0;opacity:.85;font-size:12px">Student Portal · Password Reset</p></div>
        <div style="border:1px solid #eee;border-top:none;padding:24px;border-radius:0 0 12px 12px;color:#333">
          <p>Use this code to reset your password:</p>
          <p style="font-size:30px;font-weight:bold;letter-spacing:8px;color:#800000;text-align:center;margin:18px 0">${code}</p>
          <p style="color:#777;font-size:13px">This code expires in 10 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
        </div></div>`;
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': brevoKey, 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ sender: { name: fromName, email: fromEmail }, to: [{ email: clean }], subject: 'Your NSDGA password reset code', htmlContent: html }),
      });
    }
    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
