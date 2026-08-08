# NSDGA Enrollment — Auth, Roles, HeadAdmin & Admin Portals

This document explains everything added in this round of work: a real (browser-mocked)
authentication + role system, the new **HeadAdmin** portal, the restyled **Registrar/Admin**
logins, and the connected **Admin** portal. No real backend is used yet — all data lives in the
browser's `localStorage` and is designed to be swapped for Supabase later.

---

## 1. The four roles

| Role | Logs in at | Lands on | Can access |
|------|------------|----------|------------|
| `student` | `/StudentPortal/Login` (unchanged) | Application Status | Student pages |
| `registrar` | `/RegistrarPortal/Login` | `/RegistrarPortal/Dashboard` | Registrar pages |
| `admin` | `/AdminPortal/Login` | `/AdminPortal/Dashboard` | Admin content pages |
| `headadmin` | `/HeadAdminPortal/Login` | `/HeadAdminPortal/Accounts` | Accounts, Audit Log, Reports (+ Admin pages) |

### Seed accounts (created automatically on first load)
| Role | Email | Password | State |
|------|-------|----------|-------|
| HeadAdmin | `headadmin@nsdgamarikina.edu.ph` | `Head@123` | verified |
| Registrar | `registrar@nsdgamarikina.edu.ph` | `Registrar@123` | ✅ verified |
| Registrar | `registrar.pending@nsdgamarikina.edu.ph` | `Registrar@123` | 🆕 not verified (awaiting profile) |
| Admin | `admin@nsdgamarikina.edu.ph` | `Admin@123` | ✅ verified |
| Admin | `admin.pending@nsdgamarikina.edu.ph` | `Admin@123` | 🆕 not verified (awaiting profile) |

> New seed accounts are merged in on load, so they appear even in a browser that already has data.

> ⚠️ Passwords are stored in plain text in `localStorage` **only because this is a front-end
> prototype**. A real system must hash passwords on a server. This is the first thing to change
> when a backend is added.

---

## 2. Files ADDED

### Auth foundation
- **`src/auth/authStore.js`** — the mock "backend". Everything that would be a database/API call
  lives here: `login`, `logout`, `getSession`, `createAccount`, `setAccountStatus`, `updateRole`,
  `getStaffAccounts`, `getAuditLog`, `recordAudit`, plus `ROLES` and `ROLE_HOME`. Uses three
  `localStorage` keys: `nsdga_accounts`, `nsdga_session`, `nsdga_audit`.
- **`src/contexts/SessionProvider.jsx`** — React provider wrapped around the whole app. Holds the
  "who is logged in" state and exposes `login()` / `logout()`. Reads the session **synchronously**
  on first render so a page refresh keeps you logged in.
- **`src/contexts/useSession.js`** — the `useSession()` hook any component uses to read the current
  user or call login/logout.
- **`src/auth/ProtectedRoute.jsx`** — route guard. `allow={[roles]}` + `loginPath`. Not logged in →
  redirect to that login; wrong role → redirect to that role's home.
- **`src/auth/LoginForm.jsx`** — one reusable staff login that copies the **student login's exact
  look** and performs real authentication. Reused by Registrar, Admin and HeadAdmin logins.

### HeadAdmin portal
- **`src/components/HeadAdminSidebar.jsx`** — sidebar (Accounts / Audit Log / Reports) + real logout.
- **`src/components/pages/HeadAdminPortal/Login.jsx`** — HeadAdmin login (wraps `LoginForm`).
- **`src/components/pages/HeadAdminPortal/Accounts.jsx`** — create / disable / enable staff accounts
  and change their role; live stat tiles. Fully functional against `authStore`.
- **`src/components/pages/HeadAdminPortal/AuditLog.jsx`** — login history for staff, with search +
  role/result filters and stat tiles; failed attempts highlighted.
- **`src/components/pages/HeadAdminPortal/Reports.jsx`** — school-wide analytics **shell** (KPI
  cards, bar chart, status/level breakdowns). Sample data only, clearly labelled.

### Admin portal
- **`src/components/AdminSidebar.jsx`** — Admin navigation (Dashboard + 4 content editors) + logout.
- **`src/components/AdminLayout.jsx`** — wraps existing content pages with the sidebar **without
  editing them**, turning loose pages into a connected portal.
- **`src/components/pages/AdminPortal/Login.jsx`** — Admin login (wraps `LoginForm`).
- **`src/components/pages/AdminPortal/Dashboard.jsx`** — Admin home; mirrors the Registrar dashboard
  shell, cards link to each content editor.

### Other
- **`.claude/launch.json`** — dev-server config used to preview the app.

---

## 3. Files CHANGED

- **`src/main.jsx`** — wrapped `<App/>` in `<SessionProvider>` (inside `BrowserRouter`).
- **`src/App.jsx`** — added the auth imports; wrapped **all Registrar routes**, the **Admin routes**,
  and the **HeadAdmin routes** in `<ProtectedRoute>` (logins stay public). Admin content routes are
  wrapped in `<AdminLayout>`.
- **`src/components/pages/RegistrarPortal/LoginPage.jsx`** — now a 5-line wrapper around the shared
  `LoginForm` (real auth) instead of a fake `NavLink`.
- **`src/auth/authStore.js`** — `ROLE_HOME.admin` points at the new `/AdminPortal/Dashboard`.

## 4. Files MOVED (safe reorg — each role now owns its folder)

The four Admin content pages moved from `pages/AdminEdit/` → `pages/AdminPortal/` (same folder depth,
so their internal imports were unchanged):
`EditContactUs.jsx`, `EditSchoolEvent.jsx`, `EditExecutiveBoard.jsx`, `EditAcademicSched.jsx`.
Their URLs changed from `/AdminEdit/*` to `/AdminPortal/*`.

Resulting per-role structure:
```
src/
  auth/                     ← shared login form, store, route guard
  contexts/                 ← session provider + hook
  components/pages/
    StudentPortal/          (unchanged)
    RegistrarPortal/
    AdminPortal/            ← login + dashboard + 4 content editors
    HeadAdminPortal/        ← login + accounts + audit log + reports
```

---

## 5. How auth flows (the mental model)

1. App boots → `SessionProvider` seeds accounts (first run) and reads any saved session.
2. User submits a login → `LoginForm` calls `useSession().login()` → `authStore.login()` validates
   against `localStorage`, writes a session, and **records an audit entry** (success or failure).
3. `ProtectedRoute` checks the session before rendering a page.
4. Logout clears the session and records a `LOGOUT` audit entry.

To reset everything (accounts, session, audit) during testing: clear the browser's `localStorage`
for `localhost`, or run `localStorage.clear()` in the dev console.

---

## 6. What the Audit Log contains (and could add later)
Captured now: timestamp, name, email, role, action (Login/Logout), result (Success/Failed),
simulated IP, device/browser. Failed logins record a reason and are tinted red.

Suggested future additions: lockout after repeated failures, CSV export, and non-login events
(account created / disabled / role changed), plus a real server-captured IP.

---

## 7. Employee onboarding & verification (Round 2)

New employees created by HeadAdmin must complete a profile and be **verified** before they can
access their portal.

### Account lifecycle
```
HeadAdmin creates account
   → pending_profile        (🆕 "Awaiting profile")
   → pending_verification   (⏳ employee submitted; awaiting HeadAdmin)
   → verified               (✅ full access)
   (disabled = separate on/off toggle, independent of the above)
```
A `disabled` boolean is stored separately so disabling/enabling never loses the verification state.
Legacy accounts (old `status: 'active'/'disabled'`) are auto-migrated to `verified` on load.

### How the gate works
- Staff logins allow any non-disabled account in (they must log in to fill their profile).
- `ProtectedRoute` gained a `requireVerified` prop. Every Registrar/Admin **inner** route uses it;
  it reads the account's status **live** from the store, so a HeadAdmin verification takes effect
  as soon as the employee navigates/refreshes.
- An unverified staff member is redirected to `PROFILE_SETUP_PATH[role]`
  (`/RegistrarPortal/ProfileSetup` or `/AdminPortal/ProfileSetup`).

### Profile fields collected (Essential scope)
Account & Security (**forced new password**), Personal (photo, name, sex, DOB, civil status,
nationality), Contact (mobile, address, emergency contact, secondary email), Employment (employee
ID, position, department, date hired, employment type, supervisor), Credentials (education, course,
PRC license, certifications), and **optional** Government IDs (TIN/SSS/PhilHealth/Pag-IBIG — kept
optional for privacy). Required fields are marked with `*` and validated before submit.

### HeadAdmin review
The Accounts page now has **status tabs with counts** (All / New / Pending Verification / Verified /
Disabled). For a `pending_verification` account, **Review & Verify** opens the submitted profile in a
modal with two actions: **Verify** (approve) or **Return for Correction** (sends it back with an
optional note; the employee sees the note, fixes the profile, and resubmits).

### Files added / changed this round
- **Added** `src/components/pages/StaffProfile/ProfileSetup.jsx` — shared onboarding form + the
  "awaiting verification" and "verified" screens (used by both Registrar and Admin).
- **Changed** `src/auth/authStore.js` — `STATUS` constants, `PROFILE_SETUP_PATH`, account
  migration, and `getAccountById`, `submitProfile`, `verifyAccount`, `returnProfile`, `setDisabled`
  (replaces `setAccountStatus`); `login` now blocks only on `disabled`.
- **Changed** `src/auth/ProtectedRoute.jsx` — added the `requireVerified` gate.
- **Changed** `src/components/pages/HeadAdminPortal/Accounts.jsx` — tabs, status badges, and the
  review/verify/return modal.
- **Changed** `src/App.jsx` — added `/…/ProfileSetup` routes and `requireVerified` on all staff
  inner routes.

### Verified end-to-end
Create → login (forced to profile) → cannot bypass to dashboard → submit → awaiting screen →
HeadAdmin verifies → login with new password → dashboard access granted.

---

## 8. Personalized profiles + header/sidebar fixes (Round 3)

The Registrar/Admin header, sidebar, and My Profile page used to show hardcoded dummy data
("Nailong A. Bcdeghi", "Sean Andrei Amurao"). They now show the **actual logged-in user**.

- **`Header.jsx`** — reads `useSession()`; shows the real name + role (was a hardcoded name guessed
  from the URL).
- **`RegistrarSidebar.jsx`** — the logout button was a `console.log`; it now performs a real
  `logout()` + redirect, and the footer shows the signed-in user's name/email (matching the Admin &
  HeadAdmin sidebars).
- **`StaffProfileView.jsx`** (new, shared) — renders the logged-in user's own account + profile data
  (name, role, employee ID, gender, birthdate, department, date hired, employment, contact). Missing
  values show "—". The Contact section's phone/address are editable and **Save** persists them via
  the new `updateProfile()` store function.
- **`RegistrarPortal/MyProfile.jsx`** — now just wraps `StaffProfileView` with the registrar
  sidebar + header.
- **`AdminPortal/MyProfile.jsx`** (new) + **`AdminSidebar.jsx`** gained a **My Profile** item and a
  `/AdminPortal/Profile` route — Admins now have their own profile page too.
- **`authStore.js`** — the two verified seed accounts (Maria Santos / Jose Dela Cruz) now ship with
  full sample profiles, and a backfill adds that data to seed accounts created before this feature,
  plus the `updateProfile()` helper.

Verified live: Registrar profile shows *Maria L. Santos* (ID 2024-00892); Admin profile shows
*Jose P. Dela Cruz* (ID 2024-00450); header and sidebar both show the signed-in user.

---

## 9. Supabase migration — real auth (Phase 2)

The app no longer uses localStorage for auth. It now authenticates against **Supabase Auth**
(bcrypt-hashed passwords, real JWT sessions) and stores data in the `profiles` / `audit_log`
tables, with **Row-Level Security** enforcing access.

### Database (run once in the Supabase SQL Editor)
- **`supabase/schema.sql`** — `profiles` + `audit_log` tables, RLS policies, and triggers:
  - `handle_new_user()` — auto-creates a profile row on signup (always role `registrar`, never trusts
    client-supplied role).
  - `enforce_profile_update()` — **the key protection**: a normal user cannot change their own role,
    cannot enable/disable, and can only move status `pending_profile → pending_verification`. Only
    HeadAdmin (or the SQL/service context) can verify accounts or change roles.
  - `is_headadmin()` — helper used by the policies.
- **`supabase/seed.sql`** — creates the 5 demo accounts directly (hashed passwords, confirmed),
  sets roles/status, fills the two verified profiles, and adds a **dev-only** `demo_password`
  column (drop before production: `alter table public.profiles drop column demo_password;`).

### Code
- **`src/lib/supabase.js`** — the Supabase client (reads `.env.local`).
- **`src/auth/authStore.js`** — rewritten: every function is now async and backed by Supabase
  (`signIn`, `signOutWithAudit`, `fetchProfileById`, `getStaffAccounts`, `createAccount`,
  `setDisabled`, `updateRole`, `verifyAccount`, `returnProfile`, `submitProfile`, `updateProfile`,
  `getAuditLog`, `recordAudit`).
- **`src/contexts/SessionProvider.jsx`** — loads the session from Supabase (`getSession` +
  `onAuthStateChange`), merges the auth user with their profile row, and exposes a `loading` flag.
- **`src/auth/ProtectedRoute.jsx`** — shows a "Loading…" state until the async session resolves,
  then enforces login / role / verified.
- The screens (`LoginForm`, `Header`, `StaffProfileView`, `ProfileSetup`, HeadAdmin `Accounts` and
  `AuditLog`) are now async and read from the session/Supabase.

### Verified live (against Supabase)
Login as verified registrar → dashboard (header shows the Supabase profile); login as unverified →
forced to onboarding; HeadAdmin Accounts loads all staff via RLS; the audit log records + shows
logins; disable/enable writes persist through RLS.

### Remaining (#4)
HeadAdmin's **"New Account"** calls a `create-staff` **Edge Function** that isn't deployed yet, so
creating a staff account from the app will error until that function is deployed and public sign-ups
are disabled (the lock-down step). Everything else is live.

---

## 10. Two-Factor Authentication (MFA)

Registrar & Admin staff can turn on authenticator-app (TOTP) MFA from **Settings**. When on, the
6-digit code is required at every login. Built on Supabase Auth's MFA (`supabase.auth.mfa.*`).

- **`src/components/MfaSettings.jsx`** — the card in Settings: **Enable MFA** → shows a QR code + a
  manual secret → the user scans with Google Authenticator/Authy/etc. → enters the first code to
  activate. A **Disable MFA** button turns it off (handy for the demo).
- **`authStore.js`** — `enrollMfa()`, `activateMfa()`, `getMfaFactor()`, `disableMfa()`, and
  `verifyMfaLogin()`; `signIn()` now checks the assurance level and returns `mfaRequired` when a
  code is owed.
- **`SessionProvider`** — flags `needsMfa` (signed in with password but still at AAL1) and exposes
  `completeMfa()`.
- **`LoginForm`** — when `mfaRequired`, swaps to a "Two-Factor Verification" code step; on success
  the session is raised to AAL2 and the user proceeds.
- **`ProtectedRoute`** — holds an MFA-pending user at the login step (can't reach the app at AAL1).
- Added to **Registrar Settings** and a new **Admin Settings** page (`/AdminPortal/Settings`, with a
  new "Settings" item in the Admin sidebar).

Verified end-to-end against Supabase (enroll → activate with a real TOTP code → re-login requires the
code → verify → access → disable).

### Forced MFA (required roles)
MFA is **required for `admin` and `headadmin`** — configured by `MFA_REQUIRED_ROLES` in
`authStore.js` (set it to `[]` to make MFA fully optional again). A required-role user with no
authenticator yet is redirected to a forced setup page ([MfaSetup.jsx](src/components/pages/StaffProfile/MfaSetup.jsx),
routes `/AdminPortal/MfaSetup` and `/HeadAdminPortal/MfaSetup`) and cannot use the portal until they
enroll — the same gate pattern as profile verification. `SessionProvider` computes
`mfaSetupRequired`, and `ProtectedRoute` enforces it (with a `skipMfaGate` prop on the setup routes
to avoid a loop). Registrar stays optional/self-service. **Order matters:** MFA setup only applies to
**verified** accounts — a still-pending account completes profile verification first (otherwise the
ProfileSetup and MfaSetup gates redirect to each other endlessly → blank page).

**DEMO bypass (remove for production):** the setup page has a *"Continue to dashboard (demo — skip
MFA)"* button so you can demo admin/headadmin without enrolling. It sets a `sessionStorage` flag
(`nsdga_mfa_bypass`, cleared on logout) that `ProtectedRoute` honours. To remove for production,
delete: the button + `skipForDemo` in `MfaSetup.jsx`, the `mfaBypass`/`bypassMfa` logic in
`SessionProvider.jsx`, and the `&& !mfaBypass` check in `ProtectedRoute.jsx` (all marked `DEMO ONLY`).

---

## 11. Change Password (step-up re-authentication)

A shared **Change Password** card ([ChangePassword.jsx](src/components/ChangePassword.jsx)) on every
staff Settings page (Registrar, Admin, and a **new HeadAdmin Settings** page). Changing a password
requires re-authentication:

1. **Current password** — always required; verified on a *throwaway* Supabase client so a user at
   AAL2 (MFA) is not disturbed (`verifyCurrentPassword`).
2. **Authenticator code** — if MFA is enabled, a fresh 6-digit code is also required
   (`verifyMfaChallenge`). If MFA is off, a tip nudges the user to enable it.
3. New password is validated against the policy (12+ chars, upper+lower, number, special — shown as a
   live checklist) before `changePassword()` calls `supabase.auth.updateUser`.

Since admin & headadmin are forced to have MFA, their password change always needs the code.
Verified end-to-end (wrong/correct current password, session stays intact through the check, new
password works, old is rejected).

---

## 12. Account creation lockdown + audit hardening

- **`supabase/functions/create-staff/index.ts`** — Edge Function that creates staff accounts with
  the service_role key (no email/rate-limit issues) and only lets a **HeadAdmin** call it. The app's
  "New Account" button already invokes it (`createAccount` → `supabase.functions.invoke('create-staff')`).
  Deploy: `supabase functions deploy create-staff`, then **disable public sign-ups** in the dashboard.
- **`supabase/harden_audit.sql`** — replaces the open audit-log insert with one that only lets a
  signed-in user insert rows carrying **their own email** (`with check (email = auth.email())`) and
  revokes the anonymous insert. Prevents spoofing another user's login events. (Failed-login rows,
  which are anonymous, are no longer recorded — successful logins/logouts still are.)

---

## 13. Known follow-ups (not done this round)
- **Registrar operational pages are not yet duplicated into Admin.** The Admin portal currently
  covers content management (its actual job). If Admin genuinely needs the Registrar's
  application-review screens too, those can be mirrored the same way (shared sidebar + role-based
  base path) — flagged for confirmation.
- **`src/layouts/Mainlayouts.jsx`** has a harmless leftover (`SessionModule?.default` fallback that
  is always undefined). It works because the real `SessionContext` resolves first; can be tidied.
- **Student login** still uses the original OTP mock flow and was intentionally left unchanged.
- Swap `authStore.js` internals for Supabase Auth + a `role` column to go live.
