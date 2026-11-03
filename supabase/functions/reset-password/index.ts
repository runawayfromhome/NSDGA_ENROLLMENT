// supabase/functions/reset-password/index.ts
// PUBLIC forgot-password steps 2 & 3. Anonymous — identifies the student by
// email server-side.
//   { email, code }               → VERIFY ONLY (checks the code without
//                                    consuming it; used on the OTP screen)
//   { email, code, newPassword }  → VERIFY + set the new password + consume the
//                                    code (used on the New Password screen)
// Codes expire after 10 minutes; max 5 wrong attempts.
//
// Deploy:  supabase functions deploy reset-password
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
  const admin = createClient(url, serviceKey);

  try {
    const { email, code, newPassword } = await req.json();
    const clean = String(email || '').trim().toLowerCase();
    if (!clean || !code) return json({ error: 'Email and code are required.' }, 400);
    if (newPassword !== undefined && String(newPassword).length < 8) {
      return json({ error: 'Password must be at least 8 characters.' }, 400);
    }

    const { data: prof } = await admin.from('profiles')
      .select('id, role').ilike('email', clean).maybeSingle();
    // Generic error — never reveal whether the account exists.
    const bad = () => json({ error: 'Incorrect or expired code.' }, 400);
    if (!prof || prof.role !== 'student') return bad();

    const { data: row } = await admin.from('otp_codes').select('*').eq('user_id', prof.id).maybeSingle();
    if (!row || row.purpose !== 'reset') return bad();
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await admin.from('otp_codes').delete().eq('user_id', prof.id);
      return json({ error: 'This code has expired. Please request a new one.' }, 400);
    }
    if (row.attempts >= 5) {
      await admin.from('otp_codes').delete().eq('user_id', prof.id);
      return json({ error: 'Too many attempts. Please request a new code.' }, 429);
    }

    const ok = (await sha256(`${prof.id}:${String(code).trim()}`)) === row.code_hash;
    if (!ok) {
      await admin.from('otp_codes').update({ attempts: row.attempts + 1 }).eq('user_id', prof.id);
      return bad();
    }

    // Verify-only mode: code is correct, leave it in place for the final step.
    if (newPassword === undefined) return json({ ok: true });

    // Set the new password (service role, no session needed) and consume the code.
    const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(prof.id);
    if (authUserError || !authUser.user) {
      console.error('Reset password profile has no matching auth user', {
        profileId: prof.id,
        authError: authUserError?.message || null,
      });
      return json({ error: 'The account could not be loaded. Please contact the administrator.' }, 500);
    }

    const { error: upErr } = await admin.auth.admin.updateUserById(prof.id, { password: String(newPassword) });
    if (upErr) {
      console.error('Reset password Auth update failed', {
        profileId: prof.id,
        authError: upErr.message,
      });
      return json({ error: 'The password could not be updated. Please try again or contact the administrator.' }, 500);
    }

    const { error: consumeError } = await admin.from('otp_codes').delete().eq('user_id', prof.id);
    if (consumeError) {
      console.error('Reset password OTP cleanup failed', {
        profileId: prof.id,
        databaseError: consumeError.message,
      });
    }
    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
