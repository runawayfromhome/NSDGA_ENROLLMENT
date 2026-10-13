// supabase/functions/create-staff/index.ts
// Creates a staff account. Runs server-side with the service_role key, so:
//   - no confirmation email is sent (no free-tier email rate limit)
//   - public sign-ups can stay DISABLED (this bypasses them)
//   - ONLY a signed-in HeadAdmin is allowed to call it
//
// Deploy:  supabase functions deploy create-staff
// (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected by
// Supabase automatically — no secrets to set.)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, serviceKey);

  try {
    // 1) Identify the caller from their JWT and require the HeadAdmin role.
    const authHeader = req.headers.get('Authorization') ?? '';
    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: 'Not authenticated.' });

    const { data: prof } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (!prof || prof.role !== 'headadmin') {
      return json({ error: 'Only the Head Administrator can create accounts.' });
    }

    // Require the Head Admin to have MFA enabled before creating accounts.
    const { data: factors } = await caller.auth.mfa.listFactors();
    if (!(factors?.totp || []).some((f) => f.status === 'verified')) {
      return json({ error: 'Enable Multi-Factor Authentication (MFA) in your Settings before making account changes.' });
    }

    // 2) Validate input.
    const { name, email, password, role } = await req.json();
    if (!name || !email || !password || !['registrar', 'admin'].includes(role)) {
      return json({ error: 'All fields are required (role must be registrar or admin).' });
    }
    // Server-side password policy (mirror of the client: 12+ with complexity).
    const pw = String(password);
    if (pw.length < 12 || !/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw) || !/[^A-Za-z0-9]/.test(pw)) {
      return json({ error: 'Password must be at least 12 characters with upper & lower case, a number, and a special character.' });
    }

    // 3) Create the auth user (confirmed, no email sent).
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { name },
    });
    if (cErr) return json({ error: cErr.message });

    // 4) The handle_new_user trigger made a default profile row (status
    //    'verified', which is right for self-registering students). Staff must
    //    instead go through onboarding: set role + name and reset to
    //    'pending_profile' so they complete ProfileSetup and the HeadAdmin
    //    verifies them before they can use the portal.
    await admin.from('profiles')
      .update({ name, role, status: 'pending_profile', verified_at: null })
      .eq('id', created.user.id);

    return json({ id: created.user.id, email, name, role });
  } catch (e) {
    return json({ error: String(e) });
  }
});
