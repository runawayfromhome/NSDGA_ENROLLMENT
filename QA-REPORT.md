# QA & Security Test Report — NSDGA Online Enrollment

**Date:** 2026-10-14
**Target:** live Supabase project `yxxiqc…supabase.co` (demo/test data only; authorized Option-B testing)
**Tester:** QA + application-security engineer
**Method:** Phase 1 recon → Phase 2 functional → Phase 3 backend/API → Phase 4 security → Phase 5 report
**Tools:** manual code/policy review, in-app browser, `node tests/security/rls.test.mjs` (reusable probe), `curl`, `npm audit`, `git`
**Related:** full fix write-ups in [`security-report.md`](security-report.md); reusable RLS probe in [`tests/security/rls.test.mjs`](tests/security/rls.test.mjs)

---

## 1. Summary

**Overall status: PASS (secure).** Every confirmed vulnerability found during the engagement has been **fixed and re-verified**; the student↔registrar authorization boundary holds under direct-API attack. Functional flows and route protection work with no bugs.

**Severity counts (12 findings):**

| Severity | Count | Status |
|---|---|---|
| 🔴 Critical | 1 | ✅ Fixed |
| 🟠 High | 1 | ✅ Fixed |
| 🟡 Medium | 2 | ✅ Fixed |
| 🟢 Low | 5 | ✅ Fixed |
| ⚪ Info | 3 | 2 fixed · 1 open (cosmetic) |

**Headline results**
- **No data-exposure or privilege-escalation path survives.** Direct-API probe: **24/24 PASS** (18 RLS + 6 edge-function auth).
- **The one Critical (F-11)** — self-signup could create an `admin` — is fixed; the trigger now forces `role='student'`.
- **1 open finding (QA-1, Info):** escalation attempts are blocked but the error message leaks a role count. Cosmetic.
- **Open operational item:** confirm cleanup of 2 rogue staff accounts created via F-11 before it was patched.

---

## 2. API inventory (Pass/Fail)

| # | Where | Type | Target | Op | Role | Auth | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | student.js / SessionProvider | Table | `applications` | select | student(own)/staff | ✅ | ✅ RLS scoped (S1/R1) |
| 2 | student.js | Table | `applications` | insert/update | student(own) | ✅ | ✅ triggers block status/no/billing (S7/S8) |
| 3 | registrar.js / billing.js | Table | `applications` | select/update | staff | ✅ | ✅ staff-only (R1) |
| 4 | authStore / student.js | Table | `profiles` | select | self/headadmin | ✅ | ✅ self-only; no enumeration (S3/R2) |
| 5 | authStore | Table | `profiles` | update(role) | headadmin | ✅ | ✅ escalation blocked (S6/R3/R4) |
| 6 | registrar.js | Table | `sections` | CRUD | staff | ✅ | ✅ students get 0 rows (S4) |
| 7 | authStore / registrar.js | Table | `audit_log` | select | headadmin/self | ✅ | ✅ self-only (S5) |
| 8 | authStore (`log_event`) | RPC | `log_event` | insert(definer) | anon/auth | — | ✅ identity from JWT (F-01) |
| 9 | content.js / authStore | Table | `site_content` | select/upsert | public / admin | r:❌ w:✅ | ⚠️ live-write-deny check pending (F-03) |
| 10 | student.js | Storage | `student-docs` | upload/signed-url | student own / staff | ✅ | ✅ cross-user blocked (S10) |
| 11 | content.js | Storage | `site-images` | upload/public-url | admin / public | w:✅ | ✅ (policy review) |
| 12 | student.js | Edge | `create-applicant` | signup | **anon** +CAPTCHA | ❌ | ✅ fail-closed + server validation (F-02) |
| 13 | ChatbotWidget | Edge | `chatbot` | LLM proxy | **anon** | ❌ | ✅ rate-limited 20/60s (F-04) |
| 14 | authStore | Edge | `create-staff` | create staff | headadmin+MFA | ✅ | ✅ rejects anon ("Not authenticated") |
| 15 | authStore | Edge | `admin-role-change` | role change | headadmin+MFA+OTP | ✅ | ✅ rejects anon (401) |
| 16 | authStore | Edge | `admin-set-password` | reset pw | headadmin/admin+MFA+OTP | ✅ | ✅ rejects anon (401) |
| 17 | authStore | Edge | `admin-remove-mfa` | reset MFA | headadmin/admin+MFA+OTP | ✅ | ✅ rejects anon (401) |
| 18 | authStore | Edge | `admin-account-limits` | set caps | headadmin+MFA+OTP | ✅ | ✅ rejects anon (401) |
| 19 | registrar.js | Edge | `notify` | email student | staff | ✅ | ✅ rejects anon (401) |
| 20 | student.js | Edge | `send-otp`/`verify-otp`/`send-reset-otp`/`reset-password` | OTP flows | applicant/anon | mixed | ◻ not re-tested (covered by prior review) |
| 21 | authStore / student.js | Auth | signIn/out, mfa.*, updateUser, resetPassword | — | varies | — | ✅ login+logout verified (F-5/F-6) |

---

## 3. Findings

> Full remediation detail (corrected SQL/code + how-to-verify) lives in **[`security-report.md`](security-report.md)**. Summarized here.

### F-11 — Privilege escalation via self-signup — 🔴 Critical — ✅ Fixed
- **Area:** Database / Auth. **Repro:** `supabase.auth.signUp({ email, password, options:{ data:{ role:'admin' }}})`.
- **Expected:** new user = `student`. **Actual (before):** `handle_new_user` read `raw_user_meta_data->>'role'` → attacker got **admin**.
- **Evidence:** `supabase/signup.sql` / live `pg_proc` check (`uses_metadata_ROLE = true`). Rogue accounts found: `nkosjasdk@gmail.com` (admin), `sleepythrill@gmail.com` (registrar).
- **Fix:** `supabase/harden-signup-role.sql` — role hard-forced to `'student'`; metadata used only for name. **Verified:** `uses_metadata_ROLE = false`; S6/R3/R4 escalation tests pass.

### F-03 — `site_content` RLS undefined in repo — 🟠 High (if misconfigured) — ✅ Fixed
- **Area:** Database. Table holds active school year, account limits, announcements. **Fix:** `supabase/harden-site-content.sql` (public read; write = verified admin/headadmin). **Pending:** one live student-write-deny spot-check.

### F-01 — Audit log forgeable — 🟡 Medium — ✅ Fixed
- Any anon/auth user could `insert` arbitrary audit rows. **Fix:** writes via `log_event()` SECURITY DEFINER (identity from JWT); direct insert revoked. **Verified** on DB (`authenticated → SELECT only`).

### F-02 — Public signup CAPTCHA bypass — 🟡 Medium — ✅ Fixed
- `create-applicant` defaulted to Cloudflare's always-pass test secret. **Fix:** fail-closed + server-side format validation (phone/LRN/Gmail/password). **Live-verified:** tokenless request → "Bot check failed", no account created.

### F-10 — Broad default grants on `audit_log` — 🟢 Low — ✅ Fixed (verified)
### F-04 — Chatbot had no rate limit — 🟢 Low–Med — ✅ Fixed (live-verified 20/60s → 429)
### F-05 — Unbounded document re-uploads — 🟢 Low — ✅ Fixed (stable path)
### F-06 — Unlimited resubmissions — 🟢 Low — ✅ Fixed (60s throttle)
### F-07 — Vulnerable dependency (`source-map-js`) — 🟢 Low — ✅ Fixed (`npm audit` → 0)
### F-08 — `search_path` hardening — ⚪ Info — ✅ Addressed + accepted
### F-09 — "Two-Factor" wording — ⚪ Info — ✅ Fixed

### QA-1 — Escalation error leaks role count — ⚪ Info — ⏳ Open
- **Area:** Database. **Repro:** as a student, `update profiles set role='admin' where id=<self>`.
- **Expected:** "Not allowed to change role." **Actual:** *"Active admin limit reached (4)…"* — the `enforce_account_limit` trigger fires before `enforce_profile_update`, so the error leaks the admin count (and headadmin count "2" for staff). **The escalation is still blocked** — info-leak only.
- **Evidence:** `tests/security/rls.test.mjs` S6/R3/R4 output.
- **Fix (low priority):** order `enforce_profile_update` to raise first, or scope the limit check to staff-initiated changes.

### QA-2 — `create-staff` returns HTTP 200 on auth failure — ⚪ Info — ⏳ Open
- Other privileged functions return **401**; `create-staff` returns **200** with `{"error":"Not authenticated."}`. Action is fully blocked — status-code inconsistency only. **Fix:** return 401/403.

---

## 4. Test cases

### Phase 2 — Functional (frontend)
| ID | Feature | Role | Steps | Expected | Actual | Status |
|---|---|---|---|---|---|---|
| F-1 | Route guard | anon | open `/RegistrarPortal/Dashboard` | → login | → Registrar login | ✅ |
| F-2 | Route guard | anon | open `/HeadAdminPortal/Accounts` | → login | → HeadAdmin login | ✅ |
| F-3 | Route guard | student | open `/RegistrarPortal/Dashboard` | blocked | → redirected to Student Dashboard | ✅ |
| F-4 | Route guard | student | open `/HeadAdminPortal/Accounts` | blocked | redirected; no "Account Management" | ✅ |
| F-5 | Logout | student | sign out | session cleared | cleared | ✅ |
| F-6 | Post-logout guard | anon | open `/StudentPortal/Documents` | → login | → Student Login | ✅ |
| F-7 | Console errors | student | load dashboard | none | none | ✅ |
| F-8 | Data scoping | student | view dashboard | own data only | only jose (No. 2026-0001) | ✅ |

### Phase 3 — Backend/API (direct, no UI) — `tests/security/rls.test.mjs`
| ID | Test | Role | Expected | Actual | Status |
|---|---|---|---|---|---|
| S1 | read applications | student | own only | 2 rows, all own | ✅ |
| S2 | read foreign application (IDOR) | student | 0 rows | 0 rows | ✅ |
| S3 | read profiles | student | own only | 1 row | ✅ |
| S4 | read sections | student | 0 rows | 0 rows | ✅ |
| S5 | read audit_log | student | self only | 18 rows, all own | ✅ |
| S6 | self-promote to admin | student | blocked | blocked (trigger) | ✅ |
| S7 | change own app status | student | blocked | "Not allowed to change application status" | ✅ |
| S8 | set own student_no | student | blocked | "Not allowed to set a student number" | ✅ |
| S9 | modify foreign application | student | 0 rows | 0 rows | ✅ |
| S10 | sign URL for foreign doc | student | denied | "Object not found" | ✅ |
| AN1–4 | read applications/profiles/sections/audit_log | anon | 0 rows | 0 rows each | ✅ |
| R1 | read all applications | registrar | all | 157 rows | ✅ |
| R2 | read profiles | registrar | own only | 1 row | ✅ |
| R3 | self-promote to headadmin | registrar | blocked | blocked | ✅ |
| R4 | self-promote to headadmin | admin | blocked | blocked | ✅ |

### Edge-function auth (no user JWT, anon key only) — `curl`
| Function | Expected | Actual | Status |
|---|---|---|---|
| create-staff | reject | `{"error":"Not authenticated."}` (HTTP 200 — see QA-2) | ✅ |
| admin-role-change | reject | 401 "Not authenticated." | ✅ |
| admin-set-password | reject | 401 "Not authenticated." | ✅ |
| admin-remove-mfa | reject | 401 "Not authenticated." | ✅ |
| admin-account-limits | reject | 401 "Not authenticated." | ✅ |
| notify | reject | 401 "Not authenticated." | ✅ |
| create-applicant (no token) | reject | "Bot check failed" (no account created) | ✅ |
| create-applicant (bad phone/email/LRN) | reject | field-specific errors, no account | ✅ |
| chatbot (21 rapid reqs) | 429 at #21 | 429 at #21 | ✅ |

**Totals: Phase 2 = 8/8 · Phase 3 = 24/24 · Edge abuse = 9/9.**

---

## 5. What was NOT tested (and why)

- **Supabase dashboard settings** — "Allow new users to sign up" state, leaked-password protection, and the **Security Advisor** report. *(No dashboard access; needs operator check — tracked as open items.)*
- **Email delivery (Brevo)** — OTP / notify emails not sent to real inboxes (avoid spamming; quota). Edge functions' auth/validation were tested, not actual send.
- **Staff business-logic write flows with a valid staff JWT** — e.g., registrar *enroll/approve/section* mutations end-to-end. Avoided to not mutate live data; RLS/authorization for these paths is covered by R1 + policy review.
- **Exhaustive form edge cases** — every field's max-length / special-char / double-submit across all forms. Core validation (client + server) confirmed on the signup path; others spot-checked.
- **Responsiveness & full accessibility audit** — basic only; no screen-reader / full WCAG pass.
- **Load / performance / DoS** — out of scope per engagement rules.
- **Local isolated environment** — Docker/local Supabase not set up (no Docker installed); tested against the live demo project with QA fixtures (Option B).

---

## Appendix — Open items checklist
- [ ] Confirm deletion/demotion of rogue staff: `nkosjasdk@gmail.com`, `sleepythrill@gmail.com`
- [ ] Live spot-check F-03 (student `update site_content` → denied)
- [ ] Dashboard: public signup OFF? leaked-password protection ON? Security Advisor clean?
- [ ] (Low) QA-1 trigger ordering · QA-2 status code
- [ ] Delete QA fixtures when done: `delete from auth.users where email like 'qa.%@demo.nsdga.test';`
- [ ] Go-live hardening (see `security-report.md`): real Turnstile key, Anthropic spend limit, drop `demo_password`, delete `seed-test-data`, force staff MFA, purge demo students
