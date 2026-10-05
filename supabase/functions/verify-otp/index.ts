// supabase/functions/verify-otp/index.ts
// Verifies the 6-digit code for the SIGNED-IN applicant. On success it marks the
// contact verified and flips their DRAFT application to 'submitted' (completing
// registration). Max 5 attempts; codes expire after 10 minutes.
//
// Deploy:  supabase functions deploy verify-otp
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
  const admin = createClient(url, serviceKey);

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: 'Not authenticated.' }, 401);

    const { code } = await req.json();
    if (!code) return json({ error: 'Enter the 6-digit code.' }, 400);

    const { data: row } = await admin.from('otp_codes').select('*').eq('user_id', user.id).maybeSingle();
    if (!row) return json({ error: 'No code found. Please request a new one.' }, 400);
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

    // Success: consume the code, mark verified, and complete the submission.
    await admin.from('otp_codes').delete().eq('user_id', user.id);
    const { data: app } = await admin.from('applications')
      .select('id, form, status').eq('student_id', user.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (app) {
      const form = { ...(app.form || {}), contactVerified: true, verifiedAt: new Date().toISOString() };
      const patch: Record<string, unknown> = { form };
      if (app.status === 'draft') { patch.status = 'submitted'; patch.submitted_at = new Date().toISOString(); }
      await admin.from('applications').update(patch).eq('id', app.id);
    }
    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
