import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'Server configuration is incomplete.' }, 500);

  try {
    const body = await req.json();
    const action = String(body.action || '');
    const status = String(body.status || 'FAILED');
    if (action !== 'LOGIN' || status !== 'FAILED') {
      return json({ error: 'Only failed-login events may use this endpoint.' }, 400);
    }

    // Supabase/Cloudflare supplies these values at the edge. Do not accept a
    // client-provided forwarded-for value.
    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || null;
    const admin = createClient(url, serviceKey);
    const { error } = await admin.rpc('log_event', {
      p_action: action,
      p_status: status,
      p_reason: String(body.reason || ''),
      p_device: String(body.device || ''),
      p_attempt_email: String(body.email || '').trim().toLowerCase() || null,
      p_ip: ip,
    });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  } catch (error) {
    return json({ error: String(error) }, 400);
  }
});
