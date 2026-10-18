// tests/security/rls.test.mjs
// Reusable RLS / authorization probe for the NSDGA enrollment backend.
// Calls Supabase DIRECTLY (bypassing the UI) with the public anon key, as
// anon / student A / student B / registrar, and asserts the security boundary.
//
// Run:  node tests/security/rls.test.mjs
// Uses only the PUBLIC anon key + demo/QA test accounts. Non-destructive: every
// write it attempts is one that SHOULD be rejected (trigger/RLS rolls it back).
import { createClient } from '@supabase/supabase-js';

const URL = 'https://yxxiqcvzgwyztfduuftl.supabase.co';
const ANON = 'sb_publishable_rmgx7In7VLt2xeEk-vCA1A_6JIgZLJ4';

const STUDENT_A = { email: 'jose.santos1@demo.nsdga.test', password: 'Student@123' };       // seed i=1 (enrolled)
const STUDENT_B = { email: 'patricia.delacruz2@demo.nsdga.test', password: 'Student@123' }; // seed i=2 (enrolled)
const REGISTRAR = { email: 'qa.registrar@demo.nsdga.test', password: 'QA-test-2026!' };     // needs QA-staff SQL
const ADMIN     = { email: 'qa.admin@demo.nsdga.test',     password: 'QA-test-2026!' };     // needs QA-staff SQL

let pass = 0, fail = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}  ${name}${detail ? '  — ' + detail : ''}`);
  ok ? pass++ : fail++;
};
const mk = () => createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
async function trySignIn(c, cr) {
  const { data, error } = await c.auth.signInWithPassword(cr);
  return error ? null : data.user;
}

const clients = [];
async function run() {
  console.log('\n=== NSDGA RLS / authorization probe ===\n');

  // --- Student B: get a real foreign application id (B reading B's own) ----
  const b = mk(); clients.push(b);
  const userB = await trySignIn(b, STUDENT_B);
  let otherAppId = null, otherUserId = null;
  if (userB) {
    const { data } = await b.from('applications').select('id, student_id').limit(1);
    otherAppId = data?.[0]?.id; otherUserId = data?.[0]?.student_id;
  } else console.log('(note: student B login failed; IDOR tests limited)');

  // --- Student A ----------------------------------------------------------
  const a = mk(); clients.push(a);
  const userA = await trySignIn(a, STUDENT_A);
  if (!userA) { console.log('student A login failed — cannot continue'); return; }

  const { data: myApps } = await a.from('applications').select('id, student_id');
  check('S1  student reads only OWN applications',
    (myApps?.length || 0) >= 1 && myApps.every((r) => r.student_id === userA.id),
    `${myApps?.length || 0} rows, all mine`);

  if (otherAppId && otherUserId !== userA.id) {
    const { data: stolen } = await a.from('applications').select('*').eq('id', otherAppId);
    check('S2  student CANNOT read another student application (IDOR)', (stolen?.length || 0) === 0,
      `got ${stolen?.length || 0} rows for foreign appId`);
  } else check('S2  (skipped — no foreign application)', true);

  const { data: profs } = await a.from('profiles').select('id, role');
  check('S3  student reads only OWN profile', (profs || []).length > 0 && profs.every((p) => p.id === userA.id), `${profs?.length || 0} rows`);

  const { data: secs } = await a.from('sections').select('id');
  check('S4  student CANNOT read sections (staff-only)', (secs?.length || 0) === 0, `${secs?.length || 0} rows`);

  const { data: audit } = await a.from('audit_log').select('email').limit(50);
  check('S5  student audit_log is self-only', (audit || []).every((r) => (r.email || '').toLowerCase() === userA.email.toLowerCase()), `${audit?.length || 0} rows`);

  const r6 = await a.from('profiles').update({ role: 'admin' }).eq('id', userA.id).select();
  check('S6  student CANNOT self-promote to admin', !!r6.error || (r6.data?.length || 0) === 0, r6.error?.message || 'no row changed');

  const r7 = await a.from('applications').update({ status: 'under_review' }).eq('id', myApps?.[0]?.id).select();
  check('S7  student CANNOT change own application status', !!r7.error || (r7.data?.length || 0) === 0, r7.error?.message || '');

  const r8 = await a.from('applications').update({ student_no: 'QA-HACK-9999' }).eq('id', myApps?.[0]?.id).select();
  check('S8  student CANNOT set own student number', !!r8.error || (r8.data?.length || 0) === 0, r8.error?.message || '');

  if (otherAppId && otherUserId !== userA.id) {
    const r9 = await a.from('applications').update({ status: 'rejected' }).eq('id', otherAppId).select();
    check('S9  student CANNOT modify another student application', (r9.data?.length || 0) === 0, `${r9.data?.length || 0} rows changed`);
    const { data: sign, error: sErr } = await a.storage.from('student-docs').createSignedUrl(`${otherUserId}/photo-seed.pdf`, 300);
    check('S10 student CANNOT sign URL for another student document', !sign?.signedUrl, sign?.signedUrl ? 'GOT A SIGNED URL!' : (sErr?.message || 'denied'));
  } else { check('S9  (skipped)', true); check('S10 (skipped)', true); }

  // --- Anonymous ----------------------------------------------------------
  const anon = mk(); clients.push(anon);
  for (const t of ['applications', 'profiles', 'sections', 'audit_log']) {
    const { data } = await anon.from(t).select('*').limit(5);
    check(`AN  anon reads nothing from ${t}`, (data?.length || 0) === 0, `${data?.length || 0} rows`);
  }

  // --- Registrar (staff) --------------------------------------------------
  const reg = mk(); clients.push(reg);
  const userReg = await trySignIn(reg, REGISTRAR);
  if (userReg) {
    const { data: allApps } = await reg.from('applications').select('id').limit(500);
    check('R1  registrar reads ALL applications (staff access works)', (allApps?.length || 0) > (myApps?.length || 0), `${allApps?.length || 0} rows`);
    const { data: regProfs } = await reg.from('profiles').select('id');
    check('R2  registrar reads only OWN profile (no user enumeration)', (regProfs || []).length > 0 && regProfs.every((p) => p.id === userReg.id), `${regProfs?.length || 0} rows`);
    const r3 = await reg.from('profiles').update({ role: 'headadmin' }).eq('id', userReg.id).select();
    check('R3  registrar CANNOT self-promote to headadmin', !!r3.error || (r3.data?.length || 0) === 0, r3.error?.message || 'no row changed');
  } else console.log('\x1b[33mSKIP\x1b[0m  R1-R3  registrar — run the QA-staff SQL');

  // --- Admin (staff) ------------------------------------------------------
  const adm = mk(); clients.push(adm);
  const userAdm = await trySignIn(adm, ADMIN);
  if (userAdm) {
    const r4 = await adm.from('profiles').update({ role: 'headadmin' }).eq('id', userAdm.id).select();
    check('R4  admin CANNOT self-promote to headadmin', !!r4.error || (r4.data?.length || 0) === 0, r4.error?.message || 'no row changed');
  } else console.log('\x1b[33mSKIP\x1b[0m  R4  admin — run the QA-staff SQL');
}

run()
  .catch((e) => { console.error('Harness error:', e.message); fail++; })
  .finally(async () => {
    for (const c of clients) { try { await c.auth.signOut(); } catch { /* ignore */ } }
    console.log(`\n=== ${pass} passed, ${fail} failed ===\n`);
    process.exitCode = fail ? 1 : 0;
  });
