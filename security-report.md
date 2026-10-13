# Security Review — NSDGA Online Enrollment System

**Type:** Authorized white-box review (owner-requested), non-destructive
**Target:** React (Vite) frontend + Supabase (Postgres/RLS, Auth, Storage, Edge Functions)
**Date:** 2026-10-13
**Reviewer:** White-hat engineer (code + policy review; no production data modified)

---

## 1. Executive summary

**Overall risk: LOW–MEDIUM.** The application is, on the whole, built with a security-first posture that is unusually good for a student capstone: Row-Level Security (RLS) is enabled on every table defined in the repository, students can only ever read or edit their *own* records (ID-tampering is blocked in the database, not just the UI), the privileged `service_role` key and all third-party API keys live only in Edge Functions, and every sensitive staff action (create account, change role, reset password, remove MFA, change account limits) is gated by role **and** MFA **and** an emailed one-time code, enforced server-side.

No critical data-exposure or privilege-escalation vulnerability was confirmed. The issues found are mostly **abuse-resistance and integrity** gaps rather than confidentiality breaches.

**Top 3 issues to fix first:**

1. **Audit log can be forged (Medium).** Any signed-in or anonymous user can insert arbitrary rows into `audit_log` (any email, role, action, result). Because the audit log is the Head Admin's main security-monitoring tool, forgeable entries let an attacker frame another account, hide their own actions, or flood the log.
2. **Public signup CAPTCHA falls back to an always-pass test secret (Medium).** If `TURNSTILE_SECRET` is not set on the server, `create-applicant` accepts Cloudflare's test token, which always succeeds — re-opening the endpoint to bots (mass account creation, OTP/email-quota abuse).
3. **`site_content` table RLS cannot be verified from the repo (Needs verification — High if misconfigured).** This table holds the active school year, per-role account limits, and all public website content. Its definition and policies live only in the dashboard. If any authenticated user can `UPDATE` it, a student could change the active school year, raise account limits, or alter announcements.

---

## 1b. Remediation applied (2026-10-13)

Fixes landed in code/SQL during this review:

| ID | Fix | Files | Your action |
|----|-----|-------|-------------|
| **F-01** | Audit writes now go through a `log_event()` SECURITY DEFINER function (identity from JWT); direct client insert revoked | `supabase/harden-audit-security.sql` (new), `src/auth/authStore.js` | **Run** `harden-audit-security.sql` |
| **F-02** | CAPTCHA now **fails closed** when `TURNSTILE_SECRET` is unset (no always-pass default) | `supabase/functions/create-applicant/index.ts` | **Redeploy** `create-applicant`; **set** `TURNSTILE_SECRET` (test value for demo, real value for go-live) |
| **F-03** | Explicit, reviewable `site_content` table + RLS (public read; write only verified Admin/HeadAdmin) | `supabase/harden-site-content.sql` (new) | **Run** `harden-site-content.sql`, then verify a student write is denied |
| **F-05** | Document uploads use a stable path + upsert — re-uploads overwrite instead of piling up | `src/lib/student.js` | none (auto-deploys) |
| **F-07** | `npm audit fix` → **0 vulnerabilities** | `package-lock.json` | none |
| **F-09** | "Two-Factor" → "Multi-Factor" in two error strings | `create-staff`, `admin-role-change` | redeploy those functions |
| **F-10** | *(found during verification)* `anon`/`authenticated` held default broad grants (DELETE/UPDATE/TRUNCATE/…) on `audit_log` — dormant (RLS/REST block them) but revoked as defense-in-depth. **Verified:** `authenticated → SELECT only`, `anon → none` | SQL (run in editor) | ✅ done |

> **F-10 note / systemic:** the broad `anon`/`authenticated` grants are Supabase's default on *every* table; the model correctly relies on RLS to gate them. Tightening other tables is optional hygiene. `audit_log` was prioritized since it is the integrity record. Not exploitable via the REST API (no TRUNCATE verb; DELETE/UPDATE need a permissive policy, which only `audit_log`'s now-removed INSERT ever had).

⚠️ **Deploy order for F-01:** run `harden-audit-security.sql` **before/with** pushing the frontend. The client now calls `log_event()`; until the function exists, audit writes silently no-op (nothing breaks, but no rows are recorded).

**Still open (deliberately deferred):** F-04 (chatbot rate limiting — recommend setting an Anthropic Console **spend limit** now as a backstop; full per-IP limiter can follow), F-06 (optional resubmit throttle), F-08 (search_path hardening — low value, change-risk). F-03 still needs a **live check** after running its SQL.

---

## 2. Scope & methodology

**Tested (white-box, static + policy review):**
- Secrets in frontend source, `.env`, git history, `.gitignore`, and client bundle
- All SQL migration/setup files in `supabase/` — table list, RLS status, every policy, triggers, and SECURITY DEFINER functions
- Auth & authorization: signup role assignment, role-escalation paths, Edge Function auth checks
- Storage bucket privacy and object-access policies
- Frontend XSS sinks, open redirects, sensitive logging/storage
- All Edge Functions (`supabase/functions/*`): auth, CORS, input validation, secrets handling
- `npm audit` (dependency vulnerabilities)
- Business-logic: status tampering, duplicate/record-destruction, mass export

**Not tested / out of scope:**
- Live exploit proof-of-concepts that write data (per your "do not modify production data" instruction) — findings are evidenced by policy/code review instead
- Denial-of-service load testing (per instruction)
- Supabase dashboard-only settings I cannot read from the repo (listed in §"What to export")
- Penetration of third-party services (Supabase, Cloudflare, Brevo, Anthropic)

**Tools:** manual code/policy review, `git log`/`git grep`, `npm audit`, ripgrep.

---

## 3. Findings table

| ID | Title | Severity | Component | Status |
|----|-------|----------|-----------|--------|
| F-01 | Audit log is forgeable (INSERT `with check (true)`, client-supplied identity) | **Medium** | `audit_log` RLS | Confirmed |
| F-02 | Public signup CAPTCHA falls back to always-pass test secret | **Medium** | `create-applicant` Edge Fn | Confirmed (code); env Needs verification |
| F-03 | `site_content` RLS not defined in repo — cannot verify | **High if misconfigured** | `site_content` table | Needs verification |
| F-04 | Chatbot endpoint has no rate limiting → API-credit drain | **Low–Medium** | `chatbot` Edge Fn | Confirmed |
| F-05 | Unbounded document re-uploads → storage exhaustion | **Low** | Storage / `uploadStudentDoc` | Confirmed (vector) |
| F-06 | Unlimited application resubmissions (self-only write amplification) | **Low** | `resubmitApplication` | Confirmed |
| F-07 | Dependency `source-map-js` high CVSS (build tooling) | **Low/Info** | `package.json` | Confirmed |
| F-08 | SECURITY DEFINER functions: tighten `search_path` | **Info** | DB functions | Confirmed |
| F-09 | Stale "Two-Factor" wording in two server error strings | **Info** | Edge Fns | Confirmed |

---

## 4. Detailed findings

### F-01 — Audit log is forgeable — Medium — Confirmed

**Description.** The insert policy on `audit_log` allows *any* anonymous or authenticated caller to insert *any* row, and the identity fields (`email`, `name`, `role`, `action`, `status`, `reason`) are supplied by the client, not derived from the server-trusted JWT.

**Evidence.**
`supabase/schema.sql:141`
```sql
create policy "audit_insert" on public.audit_log
  for insert to authenticated, anon with check (true);
```
Writes are client-driven with fully client-controlled fields — `src/auth/authStore.js:187`:
```js
export async function recordAudit(entry) {
  await supabase.from('audit_log').insert({ device: shortDevice(), ...entry });
}
```
A logged-in student (or an anonymous visitor using the public anon key) can therefore insert, e.g., `{ email: 'registrar@nsdgamarikina.edu.ph', role: 'registrar', action: 'ENROLL', status: 'SUCCESS', reason: 'Enrolled X' }`, or spam thousands of rows. Reads are correctly restricted (`audit_select_headadmin` + `audit_select_self`), so this is an **integrity**, not confidentiality, issue.

**Severity justification.** Impact: medium (the audit trail is the system's accountability mechanism; forged/﻿flooded entries can frame a staff member or bury real events). Likelihood: medium (trivial with the public anon key). Not higher because it cannot read others' data or change application/enrollment state.

**Affected.** `audit_log` table; `recordAudit` / `logAction` in `src/auth/authStore.js`; every `logAction` caller.

**Recommended fix.** Record audit events through a `SECURITY DEFINER` RPC that derives identity from the JWT, and remove the open table-insert grant. For failed-login logging (where there is no session yet) pass only the attempted email as data and still stamp `role='unknown'` server-side.
```sql
-- 1) Lock the table: no direct client insert.
revoke insert on public.audit_log from anon, authenticated;
drop policy if exists "audit_insert" on public.audit_log;

-- 2) Controlled writer: identity comes from the JWT, not the caller.
create or replace function public.log_event(
  p_action text, p_status text default 'SUCCESS',
  p_reason text default '', p_device text default '',
  p_attempt_email text default null   -- only used for failed logins (no session)
) returns void
language plpgsql security definer set search_path = '' as $$
declare v_email text; v_name text; v_role text;
begin
  if auth.uid() is not null then
    select p.email, p.name, p.role into v_email, v_name, v_role
      from public.profiles p where p.id = auth.uid();
  else
    v_email := p_attempt_email; v_name := p_attempt_email; v_role := 'unknown';
  end if;
  insert into public.audit_log(email, name, role, action, status, reason, device)
  values (v_email, v_name, v_role, p_action, p_status, p_reason, p_device);
end; $$;

grant execute on function public.log_event(text,text,text,text,text) to anon, authenticated;
```
Then change `recordAudit`/`logAction` to call `supabase.rpc('log_event', {...})`. (Optionally keep a per-role/per-minute insert rate check inside the function.)

**How to verify.** As a logged-in student, attempt `supabase.from('audit_log').insert({...})` → should fail (no insert grant). `supabase.rpc('log_event', { p_action:'TEST', p_reason:'poke' })` → should insert a row whose `email`/`role` equal the student's own, regardless of any values the client tried to pass.

---

### F-02 — Public signup CAPTCHA falls back to always-pass test secret — Medium — Confirmed (code)

**Description.** `create-applicant` verifies a Cloudflare Turnstile token, but if the `TURNSTILE_SECRET` environment variable is unset it uses Cloudflare's **test** secret, which makes `siteverify` always return success. In that state the bot protection is effectively disabled and the public endpoint can be scripted to mass-create confirmed student accounts and draft applications (and, via the follow-on OTP step, burn the Brevo 300-emails/day quota).

**Evidence.** `supabase/functions/create-applicant/index.ts:26`
```ts
const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET') || '1x0000000000000000000000000000000AA';
```
`1x000…AA` is Cloudflare's documented "always passes" test secret. The endpoint is intentionally public (`create-applicant/index.ts:7`).

**Severity justification.** Impact: medium (resource abuse, email-quota exhaustion, DB bloat; no data exposure). Likelihood: medium–high if the real secret is not set in production. Confirmed in code; actual production exposure **Needs verification** (does prod have `TURNSTILE_SECRET` set?).

**Affected.** `supabase/functions/create-applicant/index.ts`; also noted in `production-hardening-pending` memory.

**Recommended fix.** Fail closed when the real secret is absent, and set the real secret before go-live.
```ts
const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET');
// ...
if (!TURNSTILE_SECRET) return json({ error: 'Signup is temporarily unavailable.' }); // fail closed
if (!(await verifyCaptcha(String(captchaToken || ''), ip))) { /* ... */ }
```
Then in Supabase → Edge Functions → Secrets: `TURNSTILE_SECRET=<real key>`, and use the matching real site key on the client.

**How to verify.** With the real secret set, replay a signup request with a missing/garbage `captchaToken` → must be rejected with "Bot check failed".

---

### F-03 — `site_content` RLS not defined in the repo — Needs verification (High if misconfigured)

**Description.** `site_content` stores the active school year, per-role account limits, SHS strands, and all public website content. It is read publicly and written by Admin/HeadAdmin, but **no `create table` / `enable row level security` / policy for it exists in `supabase/`** — it was created directly in the dashboard. Its access rules therefore cannot be verified from code. If its `UPDATE`/`INSERT` policy is permissive (e.g., `to authenticated`), a logged-in student could change the active school year, raise the account limits (bypassing F-of the limit system), or edit announcements.

**Evidence.** `grep -rn site_content supabase/*.sql` returns only *reads* (e.g., `section-limit.sql:20`) and client usage (`src/lib/content.js:17,25`); no table/policy definition. Client writes assume RLS enforces Admin-only (`src/lib/content.js:23-29`).

**Severity justification.** Cannot be confirmed from the repo. If RLS is correct (write = admin/headadmin only) this is Info; if it allows broader writes it is High (tampering with system-wide settings).

**Affected.** `site_content` table; `src/lib/content.js`; `getAccountLimits`, `getActiveSchoolYear`.

**Recommended fix / baseline to apply.** Define it explicitly in a migration so it is reviewable and reproducible:
```sql
create table if not exists public.site_content (
  section text primary key,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.site_content enable row level security;

drop policy if exists "content_read" on public.site_content;
create policy "content_read" on public.site_content for select to anon, authenticated using (true);

drop policy if exists "content_write" on public.site_content;
create policy "content_write" on public.site_content for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;
```
Note: this allows any verified staff (incl. registrar) to write content. If only Admin/HeadAdmin should, replace `public.is_staff()` with a role-in check. (The OTP-protected account-limits path already routes through an Edge Function with service role, so limits writing is additionally guarded there.)

**How to verify.** As a logged-in student: `supabase.from('site_content').update({ content: {...} }).eq('section','enrollment')` → must return 0 rows / permission denied.

---

### F-04 — Chatbot endpoint has no rate limiting — Low–Medium — Confirmed

**Description.** The public `chatbot` Edge Function proxies to the Anthropic API using the server-side key. It caps message count and length (good) but has no per-IP/per-session rate limiting and CORS is `*`, so anyone with the public anon key can script the endpoint to drain the Anthropic credit balance.

**Evidence.** `supabase/functions/chatbot/index.ts:16-27` (CORS `*`, caps) — no rate/frequency guard; callable by any client.

**Severity justification.** Impact low–medium (cost drain bounded by your prepaid balance; no data exposure — the function sees no student records). Likelihood medium (endpoint + anon key are public).

**Recommended fix.** Add a lightweight per-IP sliding-window limit (e.g., store `{ip, count, window}` in a small table or KV and reject over N req/min), require a Turnstile token on the chat widget like signup, and/or set a conservative monthly **Spend limit** in the Anthropic Console as a backstop.

**How to verify.** Script >N requests/min from one IP → excess requests return 429.

---

### F-05 — Unbounded document re-uploads → storage exhaustion — Low — Confirmed (vector)

**Description.** Each upload writes a new timestamped object and old files are never deleted; files are capped at 5 MB but the *number* of uploads is not. A user can loop uploads on a draft/returned application to accumulate objects and fill the 1 GB bucket.

**Evidence.** `src/lib/student.js:66` path = `${user.id}/${docKey}-${Date.now()}.${ext}` with `upsert:false`; no cleanup of prior versions. Storage policies allow repeated inserts into the user's own folder (`student-docs.sql:18`).

**Severity justification.** Low — self-folder only, bounded by the 5 MB/type limit, requires many iterations; impact is resource exhaustion, not data exposure.

**Recommended fix.** On a new upload for a `docKey`, delete the previous object for that key (or `upsert` to a stable path per key), and/or add a per-user object-count/size cap.

**How to verify.** Re-upload the same document several times → confirm only the latest object remains for that key.

---

### F-06 — Unlimited application resubmissions — Low — Confirmed

**Description.** The per-application resubmit cap was intentionally removed (usability decision). A student can resubmit their own returned application unlimited times, each write re-touching the row and emitting an audit event. Impact is confined to the student's own record (RLS), so this is write amplification, not a breach.

**Evidence.** `src/components/pages/StudentPortal/EnrollmentForm.jsx` (cap removed); `resubmitApplication` in `src/lib/student.js:226`.

**Recommended fix (optional).** If abuse is a concern, add a soft server-side throttle (e.g., max 1 resubmission per minute) without re-introducing a hard lifetime cap.

---

### F-07 — Dependency: `source-map-js` high CVSS — Low/Info — Confirmed

**Description.** `npm audit` reports one High advisory: `source-map-js` 1.0.0–1.2.1 (event-loop DoS via crafted source-map offsets). It is build-time tooling (PostCSS/Vite); the deployed static SPA does not parse untrusted source maps at runtime, so real-world exploitability here is very low.

**Evidence.** `npm audit` → `GHSA-68fv-2mgg-jv7q`, "1 high severity vulnerability", "fix available via `npm audit fix`".

**Recommended fix.** `npm audit fix`, re-run `npm audit`, and keep build tooling current.

---

### F-08 — SECURITY DEFINER functions: tighten `search_path` — Info — Confirmed

**Description.** All SECURITY DEFINER functions reviewed are safe in intent (read-only helpers `is_staff`/`is_headadmin`, guarded triggers, and `remove_user_mfa` which is granted only to `service_role`). Most set `search_path = public`; as defense-in-depth, prefer an empty/pinned search path with fully schema-qualified names (as `remove_user_mfa` already does) to remove any search-path-hijack surface.

**Evidence.** `schema.sql:52,79,96` use `set search_path = public`; `remove-mfa.sql:8` uses `set search_path = ''` (the preferred form).

**Recommended fix.** Standardize on `set search_path = ''` (or `pg_catalog`) and schema-qualify all references in every SECURITY DEFINER function.

---

### F-09 — Stale "Two-Factor" wording in server error strings — Info — Confirmed

**Description.** The product standard is "Multi-Factor Authentication (MFA)", but two Edge Functions still return "Two-Factor Authentication" in an error string. Cosmetic only; no security impact.

**Evidence.** `create-staff/index.ts:44`, `admin-role-change/index.ts:50`.

**Recommended fix.** Replace "Two-Factor" with "Multi-Factor" in those strings for consistency.

---

## 5. Things done right (good practices observed)

- **Secret hygiene — excellent.** No `service_role`, `sk-ant-`, or Brevo secret appears in `src/`, in any committed file (checked across git history), or in `.env` (nothing env-related is tracked; `*.local` is git-ignored). The client uses only the Supabase **publishable/anon** key, which is safe by design. Service role + Anthropic + Brevo keys are read from `Deno.env` inside Edge Functions only.
- **RLS enabled on every table defined in the repo** (`profiles`, `applications`, `sections`, `audit_log`, `otp_codes`, `presence`).
- **No horizontal access.** A student can only `SELECT`/`UPDATE` rows where `student_id = auth.uid()` (`students.sql:85-96`); changing an ID in a query cannot return or modify another student's data — the filter is server-side.
- **No privilege escalation.** Self-signup role is hard-forced to `student` (`signup.sql:9-23`), and `enforce_profile_update` blocks any change to `role`, `status`, or `disabled` by non-HeadAdmins (`schema.sql:93-120`). Status/student-number/billing changes on applications are blocked for students by `enforce_application_update` (`students.sql`, `billing.sql`).
- **Strong staff-action gating.** `create-staff`, `admin-role-change`, `admin-set-password`, `admin-remove-mfa`, `admin-account-limits` all verify the caller's role from the JWT **and** require MFA, and the sensitive ones add an emailed OTP step-up — all server-side.
- **`otp_codes` fully locked** (RLS on, all grants revoked from anon/authenticated; service-role only).
- **Private document storage** with per-user folder isolation, staff-only broad read, short-lived signed URLs, and a 5 MB + jpg/png/pdf bucket limit.
- **No client-side XSS sinks.** No `dangerouslySetInnerHTML`/`innerHTML`; the one `document.write` (print) escapes every interpolated value via `esc()` (`src/lib/print.js:5`). No open redirects; no secrets/tokens logged to console.
- **Records can't be destroyed by clients** — no `DELETE` policy on `applications`/`profiles`; deprovisioning archives rather than deletes.
- **Concurrency guard** on application decisions (status-gated updates prevent two registrars double-handling one applicant).

---

## 6. Prioritized remediation checklist

1. [ ] **F-03** Export `site_content`'s definition + policies; apply the explicit migration and confirm student writes are denied. *(verify first — potentially High)*
2. [ ] **F-02** Set `TURNSTILE_SECRET` in production and make `create-applicant` fail closed when it's absent.
3. [ ] **F-01** Move audit writes to a `SECURITY DEFINER` `log_event()` RPC; revoke direct `audit_log` insert from anon/authenticated.
4. [ ] **F-04** Add rate limiting (and/or a Turnstile token) to the `chatbot` endpoint; set an Anthropic Console spend limit.
5. [ ] **F-05** Delete prior document versions on re-upload (or upsert to a stable path).
6. [ ] **F-07** `npm audit fix`.
7. [ ] **F-06** (optional) soft resubmit throttle.
8. [ ] **F-08 / F-09** search_path hardening + "Multi-Factor" wording.
9. [ ] Confirm the deferred go-live items already tracked: drop `demo_password`, delete `seed-test-data` Edge Function, force MFA for staff, purge demo students.

## What to export so I can finish verifying

- **`site_content`**: `select * from pg_policies where tablename='site_content';` plus its `create table`.
- **Full RLS snapshot (confirm nothing was disabled in the dashboard):**
  ```sql
  select schemaname, tablename, rowsecurity from pg_tables where schemaname='public';
  select tablename, policyname, cmd, roles, qual, with_check from pg_policies where schemaname='public' order by tablename;
  ```
- **Auth settings** (dashboard → Authentication): Is "Allow new users to sign up" / email sign-up **disabled** (so the only account path is the Edge Functions)? Is "Confirm email" on? Is leaked-password protection on?
- **Edge Function secrets present** (names only): `TURNSTILE_SECRET`, `ANTHROPIC_API_KEY`, `BREVO_API_KEY`, `NOTIFY_FROM_EMAIL`, `NOTIFY_FROM_NAME`.

---

## 7. Appendix

### A. Tables + RLS status (from repo)

| Table | RLS | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|-----|--------|--------|--------|--------|-------|
| `profiles` | ✅ | self or HeadAdmin | HeadAdmin only | self or HeadAdmin | — (denied) | `enforce_profile_update` blocks role/status/disabled changes |
| `applications` | ✅ | own or staff | own (`student_id=uid`) | own or staff | — (denied) | triggers block status/student_no/billing changes + elevated inserts |
| `sections` | ✅ | staff | staff | staff | staff | all-staff |
| `audit_log` | ✅ | HeadAdmin or self (email) | **anon+auth `check(true)`** ⚠️ F-01 | — | — | insert open; reads restricted |
| `otp_codes` | ✅ | none (revoked) | none (revoked) | none | none | service-role only ✅ |
| `presence` | ✅ | self or staff | self | self | — | heartbeat |
| `site_content` | ❓ | ❓ | ❓ | ❓ | ❓ | **not in repo — F-03** |

**Storage:** `student-docs` (private; insert/select/update own-folder, staff broad read, no delete) ✅; `site-images` (public, for website images) — expected.

**SECURITY DEFINER functions:** `is_headadmin`, `is_staff`, `handle_new_user`, `enforce_profile_update`, `enforce_application_update`, `enforce_application_insert`, `enforce_section_limit`, `enforce_account_limit`, `remove_user_mfa` — all reviewed; intent safe; `remove_user_mfa` execute granted only to `service_role`. See F-08 for `search_path` hardening.

### B. Dependency audit

```
# npm audit (prod tree)
source-map-js  1.0.0 - 1.2.1   Severity: high   GHSA-68fv-2mgg-jv7q
1 high severity vulnerability — fix available via `npm audit fix`
```
Build-time tooling; low runtime exploitability for the deployed SPA (see F-07).

### C. Secret-exposure checks (all passed)

- `git ls-files | grep .env` → none tracked.
- `grep -rn "service_role|SERVICE_ROLE|sk-ant-|BREVO|sb_secret" src/` → none.
- `git log -S "service_role"` / `-S "sk-ant-"` across history → only variable-name references in Edge Functions and docs; no secret values.
- `.gitignore` ignores `*.local`, `dist`, `node_modules`.
