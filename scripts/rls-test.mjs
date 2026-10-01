// scripts/rls-test.mjs
// Basic RLS / access test for pentest evidence (M8). Hits the Supabase REST API
// with the ANON key only (no logged-in user) and checks that protected tables
// leak NOTHING. Also probes the privileged Edge Functions.
//
// Run:  node scripts/rls-test.mjs
// Reads VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY from env or .env.local.
import { readFileSync } from 'node:fs';

function loadEnv() {
  const env = { ...process.env };
  try {
    for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* no .env.local */ }
  return env;
}

const env = loadEnv();
const URL_ = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;
if (!URL_ || !KEY) { console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY'); process.exit(1); }

let pass = 0, fail = 0;
const ok = (name, cond, detail) => { console.log(`${cond ? '✅ PASS' : '❌ FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); cond ? pass++ : fail++; };

async function rest(path) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  let body = []; try { body = await r.json(); } catch { /* non-json */ }
  return { status: r.status, rows: Array.isArray(body) ? body.length : (body?.message ? `err:${body.message}` : 0) };
}
async function fn(name) {
  const r = await fetch(`${URL_}/functions/v1/${name}`, {
    method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: '{}',
  });
  let body = {}; try { body = await r.json(); } catch { /* */ }
  return { status: r.status, error: body?.error };
}

console.log(`\n── RLS / access test vs ${URL_} (ANON only) ──\n`);

// Protected tables must return 0 rows (or an auth error) to an anonymous caller.
for (const t of ['applications', 'profiles', 'otp_codes', 'audit_log', 'sections', 'presence']) {
  const { status, rows } = await rest(`${t}?select=*&limit=50`);
  ok(`anon read ${t}`, rows === 0 || String(rows).startsWith('err') || status === 401 || status === 403,
    `status ${status}, rows ${rows}`);
}

console.log('');
// Privileged Edge Functions must reject an unauthenticated caller.
for (const f of ['create-staff', 'admin-role-change', 'admin-set-password']) {
  const { status, error } = await fn(f);
  ok(`edge ${f} rejects anon`, !!error && /auth|head admin|only/i.test(error), `status ${status}, "${error}"`);
}

console.log(`\n── ${pass} passed, ${fail} failed ──\n`);
process.exit(fail ? 1 : 0);
