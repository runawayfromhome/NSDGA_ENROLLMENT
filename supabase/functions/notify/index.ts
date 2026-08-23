// supabase/functions/notify/index.ts
// Sends a transactional email to a student (e.g. on enroll / correction / reject).
// - Caller must be signed-in STAFF (registrar/admin/headadmin).
// - Recipient email is resolved server-side from the studentId (service role),
//   so we never expose student emails to the client.
// - Uses Brevo (https://brevo.com) transactional email — free 300/day, no domain
//   required (just verify a sender email in your Brevo account).
//
// Deploy:   supabase functions deploy notify
// Secrets:  BREVO_API_KEY=xkeysib-...        (Brevo → SMTP & API → API Keys)
//           NOTIFY_FROM_EMAIL=you@email.com  (a VERIFIED sender in Brevo)
//           NOTIFY_FROM_NAME=NSDGA Admissions (optional)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

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
    // 1) Caller must be staff.
    const authHeader = req.headers.get('Authorization') ?? '';
    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: 'Not authenticated.' }, 401);
    const { data: prof } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (!prof || !['registrar', 'admin', 'headadmin'].includes(prof.role)) {
      return json({ error: 'Only staff can send notifications.' }, 403);
    }

    // 2) Resolve recipient.
    const { studentId, to: toDirect, subject, html } = await req.json();
    if (!subject || !html) return json({ error: 'subject and html are required.' }, 400);
    let to = toDirect;
    if (!to && studentId) {
      const { data: got, error } = await admin.auth.admin.getUserById(studentId);
      if (error || !got?.user?.email) return json({ error: 'Could not resolve recipient email.' }, 400);
      to = got.user.email;
    }
    if (!to) return json({ error: 'No recipient.' }, 400);

    // 3) Send via Brevo.
    if (!brevoKey) return json({ error: 'BREVO_API_KEY not configured.' }, 500);
    if (!fromEmail) return json({ error: 'NOTIFY_FROM_EMAIL not configured.' }, 500);
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': brevoKey, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    const data = await r.json();
    if (!r.ok) return json({ error: data.message || 'Email send failed.' }, 502);
    return json({ ok: true, id: data.messageId });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
