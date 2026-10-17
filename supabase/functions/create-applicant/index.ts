// supabase/functions/create-applicant/index.ts
// Creates a STUDENT applicant account + files their admission application.
// Runs server-side with the service_role key, so:
//   - the account is created ALREADY CONFIRMED (no confirmation email needed)
//   - it does not depend on the "Confirm email" dashboard setting
//   - the application is filed atomically (rolled back if it fails)
// This is a PUBLIC endpoint (anyone applying online) — but it can ONLY ever
// create the lowest-privilege 'student' role, never staff.
//
// Deploy:  supabase functions deploy create-applicant
// (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { ...cors, 'Content-Type': 'application/json' } });

// Cloudflare Turnstile — verify the "I'm not a robot" token server-side so a bot
// can't call this public endpoint directly. FAIL CLOSED: if TURNSTILE_SECRET is
// not set, no signup is allowed (security review F-02). For the demo, set
// TURNSTILE_SECRET to Cloudflare's test secret (1x000...AA, always passes) as an
// explicit, deliberate choice — then swap in the real secret before go-live.
const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET');
async function verifyCaptcha(token: string, ip: string | null): Promise<boolean> {
  if (!TURNSTILE_SECRET || !token) return false; // no secret configured => fail closed
  try {
    const body = new FormData();
    body.append('secret', TURNSTILE_SECRET);
    body.append('response', token);
    if (ip) body.append('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const out = await r.json();
    return out.success === true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, serviceKey);

  try {
    const { email, password, contact, level, studentType, form, captchaToken } = await req.json();
    if (!email || !password || !form) return json({ error: 'Missing required fields.' });
    if (String(password).length < 8) return json({ error: 'Password must be at least 8 characters.' });

    // Bot check before doing any work (account creation / emails).
    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for');
    if (!(await verifyCaptcha(String(captchaToken || ''), ip))) {
      return json({ error: 'Bot check failed. Please complete the "I\'m not a robot" check and try again.' });
    }

    const clean = String(email).trim().toLowerCase();
    const name = `${form.firstName || ''} ${form.lastName || ''}`.trim() || clean;

    // Server-side format validation (mirror of the client's rules). The browser's
    // checks can be bypassed via dev tools, so re-enforce the important ones here.
    const PHONE_RE = /^09\d{9}$/;
    const GMAIL_RE = /^[^\s@]+@gmail\.com$/i;
    const pw = String(password);
    const fn = String(form.firstName || '').trim();
    const ln = String(form.lastName || '').trim();
    const phone = String(contact || form.contact || '').trim();
    if (!fn || !ln) return json({ error: 'First and last name are required.' });
    if (!GMAIL_RE.test(clean)) return json({ error: 'Please use a valid Gmail address (must end with @gmail.com).' });
    if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) {
      return json({ error: 'Password must be at least 8 characters and include a letter and a number.' });
    }
    if (!PHONE_RE.test(phone)) return json({ error: 'Enter a valid mobile number (09XXXXXXXXX).' });

    // 0) Reject a duplicate LRN — one learner can't register twice. (Skipped for
    //    incoming Grade 1 / no-LRN applicants, whose LRN is blank.)
    const lrn = String(form.lrn || '').trim();
    if (lrn) {
      if (!/^\d{12}$/.test(lrn)) return json({ error: 'LRN must be 12 digits.' });
      const { data: dup } = await admin.from('applications').select('id').filter('form->>lrn', 'eq', lrn).limit(1);
      if (dup && dup.length) {
        return json({ error: 'This LRN is already registered. If you already have an account, please log in instead.' });
      }
    }

    // 1) Create the confirmed applicant account (trigger makes a 'student' profile).
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: clean, password, email_confirm: true,
      user_metadata: { name, role: 'student', contact },
    });
    if (cErr) return json({ error: cErr.message });
    const uid = created.user.id;

    // 2) Open a DRAFT admission application (service role bypasses RLS). The
    //    applicant fills the rest of the wizard while signed in; OTP verification
    //    later flips this to 'submitted'. level/studentType may still be null.
    const { data: app, error: appErr } = await admin.from('applications').insert({
      student_id: uid,
      school_year: form.schoolYear || '2026-2027',
      grade_level: level || null,
      student_type: studentType || null,
      status: 'draft',
      form: { ...form, contact },
    }).select('id').single();
    if (appErr) {
      await admin.auth.admin.deleteUser(uid); // rollback so they can retry cleanly
      return json({ error: appErr.message });
    }

    return json({ ok: true, userId: uid, appId: app.id });
  } catch (e) {
    return json({ error: String(e) });
  }
});
