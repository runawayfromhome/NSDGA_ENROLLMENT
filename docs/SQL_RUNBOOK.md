# NSDGA — Supabase SQL Editor Runbook

Practical, copy-paste reference for the SQL we actually run by hand in the
**Supabase Dashboard → SQL Editor**. Covers **seeding accounts**, **deleting a
single account**, **wiping all accounts (clean slate)**, and **removing MFA**.

> **Where to run:** Supabase Dashboard → your project
> (`yxxiqcvzgwyztfduuftl`) → left sidebar **SQL Editor** → *New query* → paste →
> **Run**.
>
> ⚠️ This is the **PRODUCTION** project. SQL here bypasses RLS and runs as the
> database owner — there is **no undo**. Read the "Before you delete" box in each
> section first. When in doubt, run the **inspect** query first to see exactly
> what rows you are about to touch.

### 🛟 Golden rules (read before any destructive SQL)

1. **`select` before you `delete`.** Run the matching inspect query first — look
   at the exact rows you're about to remove.
2. **Delete children before parents.** Clear non-cascading references
   (`applications.reviewed_by`, `site_content.updated_by`) before deleting a
   staff user (§0, §3b, §4).
3. **Wrap multi-step deletes in `begin; … commit;`** so a mistake rolls back
   instead of half-finishing. If something looks wrong before you `commit`, run
   `rollback;`.
4. **Back up first for anything big** — download a CSV or confirm a recent
   Database backup (§16). There is no undo.
5. **Prefer the portal over SQL** when the HeadAdmin UI can do it — those actions
   are authorized *and* logged in the Audit Log. SQL is the fallback.

### 🧭 Find your situation fast

| I need to… | Go to |
|---|---|
| Understand why a delete is blocked | §0 Why order matters · §14 Common errors |
| Create the demo staff accounts | §1 Seed staff |
| Create 100 demo students | §2 Seed students |
| Delete one student / one staff member | §3 Delete ONE account |
| Reset to a clean slate (keep only HeadAdmin) | §4 Wipe ALL |
| Remove someone's MFA | §5 Remove MFA · §15b locked out by MFA |
| Enable/disable, verify, change role, reset password | §8 Account recovery |
| "Active … limit reached" | §8g |
| Fix a stuck / wrong application | §9 Application fixes |
| "I never got my OTP code" | §10 OTP problems |
| Someone's stuck showing "online" | §11 Presence |
| Read the audit log / check brute-force | §12 Audit log |
| Section is wrong / empty | §13 Sections |
| Decode an error message | §14 Common errors cheat-sheet |
| I'm locked out of HeadAdmin | §15 Disaster recovery |
| Back up before a wipe | §16 Backup first |
| Student's uploaded files / orphaned files | §17 Documents / Storage |
| Chatbot blocked a user | §18 Chatbot rate-limit |
| Hunt for data inconsistencies | §19 Data-integrity checks |
| See what triggers/policies are really live | §20 Inspect schema |
| "Where is the active school year / secrets?" | §21 Not in the database |

---

## 0. Why order matters (read this once)

Users live in `auth.users`. Other tables point back to a user with a foreign
key. Some of those FKs **cascade** on delete (the child row disappears
automatically); some **do not** (the delete is *blocked* until you clear the
reference yourself).

| Reference | FK target | On delete |
|---|---|---|
| `public.profiles.id` | `auth.users(id)` | **CASCADE** — profile auto-deletes with the user |
| `public.applications.student_id` | `auth.users(id)` | **CASCADE** — the student's own application auto-deletes |
| `public.applications.reviewed_by` | `auth.users(id)` | **NO cascade** — blocks deletion of the staff who reviewed it |
| `public.site_content.updated_by` | `auth.users(id)` | **NO cascade** — blocks deletion of the staff who edited content |
| `auth.identities.user_id` | `auth.users(id)` | CASCADE (handled by Supabase) |

**Rule of thumb:** before deleting a staff user, first clear anything that
points at them via a *non-cascading* FK — i.e. `applications.reviewed_by` and
`site_content.updated_by`. Students rarely hit this (they don't review or edit
content), so a plain student delete usually just works.

If you skip this you'll see:

```
ERROR: 23503: update or delete on table "users" violates foreign key
constraint "applications_reviewed_by_fkey" on table "applications"
```

That is Postgres protecting referential integrity — not a bug.

---

## 1. Seed the staff accounts

Creates the 5 demo staff/admin accounts (HeadAdmin, 2 registrars, 2 admins).
**Safe to re-run** — it deletes and recreates those 5 by email. Students are not
touched.

**File:** [`supabase/seed.sql`](../supabase/seed.sql) — run the whole file.

Demo logins it creates (dev reference only — no plain-text password is stored):

| Email | Password | Role | Status |
|---|---|---|---|
| headadmin@nsdgamarikina.edu.ph | `Head@123` | headadmin | verified |
| registrar@nsdgamarikina.edu.ph | `Registrar@123` | registrar | verified |
| registrar.pending@nsdgamarikina.edu.ph | `Registrar@123` | registrar | pending_profile |
| admin@nsdgamarikina.edu.ph | `Admin@123` | admin | verified |
| admin.pending@nsdgamarikina.edu.ph | `Admin@123` | admin | pending_profile |

> After seeding, log in as HeadAdmin, **change the password**, **enable MFA**,
> then create the real staff accounts from the portal. The demo passwords above
> are for first setup only.

---

## 2. Seed demo students

Creates 100 realistic demo students + their applications + demo sections, for a
believable grading/demo dataset.

**File:** [`supabase/seed-students.sql`](../supabase/seed-students.sql) — run the
whole file.

- Every seeded account's email ends in `@demo.nsdga.test` (a sentinel).
- Every seeded application is tagged `form->>'seed' = true`.
- Login for all 100: password `Student@123`.
- **Safe to re-run:** step 1 of the file first WIPES every `role = 'student'`
  account (and their applications), then re-inserts a clean set. Staff are never
  touched.

> ⚠️ Because it wipes **all** students, do **not** run this once real applicants
> have signed up — it would delete them too.

---

## 3. Delete ONE account

### Before you delete — see the account first

```sql
select u.id, u.email, p.role, p.status, p.disabled
from auth.users u
left join public.profiles p on p.id = u.id
where u.email = 'person@example.com';
```

### 3a. A student (simple — cascades handle the rest)

Deleting the user cascades to their `profiles` row, their `applications`
(via `student_id`), and their `auth.identities`.

```sql
delete from auth.users where email = 'student@example.com';
```

### 3b. A staff member (registrar / admin / headadmin)

A staff user may be referenced by **non-cascading** FKs. Clear those first,
then delete. Do it in one transaction so it's all-or-nothing:

```sql
begin;

-- the user we are removing
with target as (
  select id from auth.users where email = 'staff@example.com'
)
-- 1) detach their non-cascading references
update public.applications
   set reviewed_by = null
 where reviewed_by in (select id from target);

update public.site_content
   set updated_by = null
 where updated_by in (select id from target);

-- 2) now the delete is unblocked (profile + identities cascade automatically)
delete from auth.users
 where id in (select id from target);

commit;
```

> If you'd rather **keep** the account but stop it from logging in, don't delete
> — **disable** it instead (counts toward nothing, fully reversible):
> ```sql
> update public.profiles set disabled = true where email = 'staff@example.com';
> ```

---

## 4. Wipe ALL accounts, keep only HeadAdmin (clean slate)

This is the exact sequence we used to reset to a clean slate before creating the
real accounts. It removes **every** student, registrar, and admin — plus all
applications — and keeps only the HeadAdmin account(s).

### Before you delete — count what will go

```sql
select role, count(*)
from public.profiles
where role <> 'headadmin'
group by role order by role;

select count(*) as applications_to_delete from public.applications;
```

### The wipe (run top to bottom, in order)

```sql
begin;

-- 1) Applications first. applications.reviewed_by does NOT cascade, so a
--    surviving application that references a staff member we're about to delete
--    would block the delete. We're clearing the whole table anyway, so drop it.
delete from public.applications;

-- 2) site_content.updated_by also does NOT cascade — null it out so deleting the
--    editor doesn't get blocked. (Content itself is kept.)
update public.site_content set updated_by = null;

-- 3) Delete every non-headadmin user. profiles + applications(student_id) +
--    identities all cascade off auth.users, so this one delete is enough.
delete from auth.users
 where id in (
   select id from public.profiles where role <> 'headadmin'
 );

commit;
```

### Verify the result

```sql
select email, role, status from public.profiles order by role, email;
-- expect: only your headadmin row(s) remain

select count(*) as remaining_applications from public.applications;  -- expect 0
```

> **Common error if you skip step 1:**
> `ERROR 23503: ... violates foreign key constraint "applications_reviewed_by_fkey"`.
> Fix = delete `applications` first (step 1), then retry the user delete.

---

## 5. Remove a user's MFA (TOTP)

### 5a. The proper way — through the app

The **Head Admin → Manage Student Account** and **Accounts** screens already do
this via the `admin-remove-mfa` Edge Function, which does the real authorization
(who may reset whom) + an emailed OTP step-up, then calls the
`public.remove_user_mfa(uid)` function. **Prefer this** — it's logged in the
Audit Log (`MFA_RESET`). SQL below is the manual fallback only.

The helper function (defined once in
[`supabase/remove-mfa.sql`](../supabase/remove-mfa.sql)) is locked to the service
role, so you **cannot** call `remove_user_mfa()` from the SQL Editor. For a
manual reset, delete the factors directly (see 5b).

### 5b. Manual fallback — direct SQL

Use only if the UI flow is unavailable. First check whether the user even has
MFA enrolled:

```sql
select f.id, f.factor_type, f.status, u.email
from auth.mfa_factors f
join auth.users u on u.id = f.user_id
where u.email = 'person@example.com';
```

Then remove their factors (this forces them back to password-only until they
re-enroll):

```sql
delete from auth.mfa_factors
where user_id = (select id from auth.users where email = 'person@example.com');
```

> This does **not** reset their password and does **not** disable the account —
> it only clears the second factor. A manual delete here is **not** written to
> the Audit Log, so note it down if you run it.

---

## 6. Clean up demo / QA fixtures

Remove the seeded demo data without touching real accounts.

```sql
-- Demo students (sentinel email domain)
delete from auth.users where email like '%@demo.nsdga.test';

-- QA test fixtures (if any remain)
delete from auth.users where email like 'qa.%@demo.nsdga.test';
```

(Their `profiles` and `applications` cascade off `auth.users` — no extra steps.)

---

## 7. Handy inspection queries

```sql
-- All accounts at a glance
select email, name, role, status, disabled
from public.profiles
order by role, status, email;

-- Active staff counts (what Account Limits enforces: verified AND not disabled)
select role, count(*)
from public.profiles
where status = 'verified' and disabled = false
group by role order by role;

-- Who has MFA enrolled
select u.email, p.role, f.factor_type, f.status
from auth.mfa_factors f
join auth.users u on u.id = f.user_id
left join public.profiles p on p.id = u.id
order by p.role, u.email;

-- Applications by status (current school year is whatever's active)
select status, count(*) from public.applications group by status order by status;

-- Any account NOT on an official domain (spot rogue signups)
select email, role, status, created_at
from public.profiles
where email not like '%@nsdgamarikina.edu.ph'
  and email not like '%@demo.nsdga.test'
order by created_at desc;
```

---

## 8. Account recovery & fixes

Day-to-day "a staff/student is stuck" situations. **Prefer the HeadAdmin portal**
(Accounts / Manage Student Account) for these — they're authorized + logged.
SQL below is the manual fallback when the UI can't do it.

### 8a. Re-enable a disabled account

```sql
update public.profiles set disabled = false where email = 'person@example.com';
```

### 8b. Disable (soft-lock) an account instead of deleting

Keeps all history, blocks the portal, and does **not** count toward the active
account limit.

```sql
update public.profiles set disabled = true where email = 'person@example.com';
```

### 8c. Verify an account stuck in onboarding

A staff account stuck at `pending_profile` / `pending_verification` (e.g. they
finished ProfileSetup but weren't verified):

```sql
update public.profiles
   set status = 'verified', verified_at = now()
 where email = 'staff@example.com';
```

> If this errors with **"Active … limit reached"**, you've hit the per-role cap —
> see 8g.

### 8d. Change a user's role

```sql
update public.profiles set role = 'admin'      -- registrar | admin | headadmin | student
 where email = 'person@example.com';
```

### 8e. Promote an account to HeadAdmin

```sql
update public.profiles
   set role = 'headadmin', status = 'verified', verified_at = now()
 where email = 'person@example.com';
```

### 8f. Reset a password — the two ways

- **Preferred (UI):** HeadAdmin → Accounts / Manage Student Account → *Reset
  password*. This sends an emailed OTP step-up, applies the role-aware password
  floor (student 8+, staff 12+), and is logged as `PASSWORD_RESET`.
- **Manual fallback (SQL):** you can set a password directly in the SQL Editor
  with the admin API's crypt. Use only if the UI is down:

  ```sql
  update auth.users
     set encrypted_password = crypt('NewTempPass123', gen_salt('bf')),
         updated_at = now()
   where email = 'person@example.com';
  ```

  > Tell the user to change it immediately after logging in. This manual path is
  > **not** written to the Audit Log — note it down yourself.

### 8g. "Active … limit reached" when verifying/enabling

The per-role active-account cap (`enforce_account_limit`) is blocking you.
Options:

```sql
-- See the current caps
select content from public.site_content where section = 'account_limits';

-- See how many are currently active in that role
select role, count(*) from public.profiles
 where status = 'verified' and disabled = false
 group by role;
```

Then either **disable** an existing active account in that role, or **raise the
cap** in HeadAdmin → Settings → Account Limits (OTP-protected). If you must do it
in SQL (last resort — the UI save is logged, this isn't):

```sql
update public.site_content
   set content = jsonb_set(coalesce(content,'{}'::jsonb), '{registrar}', '20'::jsonb)
 where section = 'account_limits';
```

### 8h. Spot and clean rogue signups

```sql
-- Anything not on an official / demo domain
select email, role, status, created_at from public.profiles
 where email not like '%@nsdgamarikina.edu.ph'
   and email not like '%@demo.nsdga.test'
 order by created_at desc;
```

Delete a confirmed rogue the safe way (see §3b for the staff order; a plain
`delete from auth.users where email = '…';` is enough for a student with no
reviews/content).

---

## 9. Application / enrollment fixes

The `applications.status` lifecycle is:
`draft → submitted → under_review → needs_correction → enrolled`, plus
`rejected`, `withdrawn`, `graduated`, `archived`, `completed`.

### 9a. See a student's application

```sql
select a.status, a.student_no, a.grade_level, a.school_year,
       a.form->>'firstName' as first, a.form->>'lastName' as last,
       a.form->>'section' as section, a.reviewed_at
from public.applications a
join public.profiles p on p.id = a.student_id
where p.email = 'student@demo.nsdga.test';
```

### 9b. Manually move a stuck application

E.g. un-stick one stuck in `under_review`, or send it back for correction:

```sql
update public.applications
   set status = 'needs_correction',
       review_note = 'Please re-upload a clearer Report Card.'
 where student_id = (select id from auth.users where email = 'student@demo.nsdga.test');
```

> Allowed values are the ones in the check constraint above — anything else
> raises `violates check constraint "applications_status_check"`.

### 9c. Clear a mistaken student number / un-enroll

```sql
update public.applications
   set status = 'submitted', student_no = null, reviewed_at = null
 where student_no = '2026-0007';
```

### 9d. Bulk-archive an old school year

```sql
update public.applications
   set status = 'archived'
 where school_year = '2025-2026' and status in ('enrolled','completed');
```

---

## 10. OTP / email-verification problems

`otp_codes` holds one row per user for signup / password-reset / MFA-reset /
account-limit step-up. It's service-role only (no client access). If a user is
stuck ("I never got a code" / "it says a code was already sent"), clear their
stale row so the function issues a fresh one:

```sql
-- See if a code is pending
select user_id, purpose, expires_at, attempts, created_at
from public.otp_codes
where user_id = (select id from auth.users where email = 'person@example.com');

-- Clear it so they can request a new one
delete from public.otp_codes
where user_id = (select id from auth.users where email = 'person@example.com');
```

> If **emails aren't arriving at all**, the problem is usually the Brevo
> integration (API key / sender), not the database — check the Edge Function
> logs (Dashboard → Edge Functions → `send-otp` → Logs), not SQL.

---

## 11. Presence / "online" status

`presence` is a per-user "last seen" heartbeat. A crashed tab can leave someone
showing as online.

```sql
-- Who looks online (seen in the last 2 minutes)
select p.email, p.role, pr.last_seen
from public.presence pr
join public.profiles p on p.id = pr.id
where pr.last_seen > now() - interval '2 minutes'
order by pr.last_seen desc;

-- Force a stuck user offline (push their heartbeat into the past)
update public.presence set last_seen = now() - interval '1 hour'
 where id = (select id from auth.users where email = 'person@example.com');
```

---

## 12. Audit log

All writes go through `log_event()` (identity stamped from the JWT); clients
can't insert rows directly. You normally **read** the audit log in the HeadAdmin
portal. For SQL inspection:

```sql
-- Recent events
select created_at, name, email, role, action, status, reason, device
from public.audit_log
order by created_at desc
limit 50;

-- Failed logins in the last 24h (brute-force check)
select email, count(*) as fails, max(created_at) as last_try
from public.audit_log
where status = 'FAILED' and created_at > now() - interval '24 hours'
group by email order by fails desc;
```

> **Don't** delete audit rows casually — it's the tamper-evidence trail. If the
> table is genuinely huge and you want to trim very old rows, do it deliberately
> and note it: `delete from public.audit_log where created_at < now() - interval '2 years';`

---

## 13. Sections

```sql
-- Sections for the active year and how full they are
select s.grade, s.name, s.capacity,
       (select count(*) from public.applications a
         where a.status = 'enrolled'
           and a.school_year = s.school_year
           and a.form->>'grade'   = s.grade
           and a.form->>'section' = s.name) as enrolled
from public.sections s
where s.school_year = '2026-2027'
order by s.grade, s.name;

-- Remove an empty, mistakenly-created section
delete from public.sections
 where school_year = '2026-2027' and grade = 'Grade 7' and name = 'Typo Section';
```

> If a delete is blocked because students are still assigned, re-assign them
> first (HeadAdmin/Registrar portal) — don't orphan enrolled students.

---

## 14. Common errors → what they mean → fix

| Error you see | Meaning | Fix |
|---|---|---|
| `23503 ... applications_reviewed_by_fkey` | Deleting a user still referenced as a reviewer | Clear `reviewed_by` / delete applications first (§3b, §4) |
| `23503 ... site_content_updated_by_fkey` | Deleting a user who edited site content | `update site_content set updated_by = null …` first (§4) |
| `violates check constraint "applications_status_check"` | Status value not in the allowed list | Use a valid status (§9) |
| `violates check constraint "profiles_role_check"` | Role not in registrar/admin/headadmin/student | Use a valid role (§8d) |
| `Not allowed to change role` / `… status` / `… disabled` | `enforce_profile_update` trigger blocked a non-HeadAdmin write | Run as HeadAdmin, or in SQL Editor (where `auth.uid()` is null it's allowed) |
| `Not allowed to change application status` | `enforce_application_update` blocked a student self-enroll | Only staff/SQL may change status (§9) |
| `Active <role> limit reached` | `enforce_account_limit` cap hit | Disable one, or raise the cap (§8g) |
| `new row violates row-level security policy` | Writing through the API as a role that RLS forbids | Use the HeadAdmin UI, or the SQL Editor (bypasses RLS) |
| `permission denied for table …` | Calling a locked function/table as the wrong role | That path is service-role only (e.g. `remove_user_mfa`, `otp_codes`) — use the Edge Function/UI |

> **Key insight:** the SQL Editor runs as the database owner, so `auth.uid()` is
> `null` and `is_headadmin()` is effectively treated as privileged by the
> triggers — most "Not allowed…" guards **don't** apply there. That's exactly why
> the SQL Editor is your recovery tool when the UI refuses an action.

---

## 15. Locked out / disaster recovery

### 15a. You lost access to the only HeadAdmin account

You can always rebuild one from the Supabase dashboard:

1. **Authentication → Users → Add user** → enter an email + password → tick
   **Auto Confirm User** → create.
2. In **SQL Editor**, promote that new user:

   ```sql
   update public.profiles
      set role = 'headadmin', status = 'verified', verified_at = now(),
          name = 'System Head Administrator'
    where email = 'new-headadmin@nsdgamarikina.edu.ph';
   ```

   (The `handle_new_user` trigger already created the `profiles` row when the
   user was added.) Log in, then re-enable MFA from Settings.

### 15b. A HeadAdmin is locked out by MFA (lost authenticator)

Clear their MFA factors so they fall back to password-only, then they re-enroll:

```sql
delete from auth.mfa_factors
where user_id = (select id from auth.users where email = 'headadmin@nsdgamarikina.edu.ph');
```

### 15c. The secure signup trigger got overwritten

If you re-ran `seed.sql` or `signup.sql`, the `handle_new_user` trigger may have
reverted to defaulting new users to `registrar`. **Re-run
`harden-signup-role.sql`** to force `role='student'` again. Verify:

```sql
select prosrc from pg_proc where proname = 'handle_new_user';
-- the body should hard-code  role = 'student'  (not read it from metadata)
```

---

## 16. Back up before anything destructive

Before a wipe (§4) or a big delete, snapshot the rows you're about to touch so
you can eyeball / restore. Two easy options:

- **Dashboard export:** run a `select …` for the data, then use the result grid's
  **Download CSV** button.
- **Point-in-time / scheduled backups:** Dashboard → **Database → Backups**.
  Confirm a recent backup exists *before* running §4. (Paid plans have PITR; the
  daily backup is the floor.)

```sql
-- Quick snapshot you can copy out before a wipe
select id, email, role, status, disabled, created_at
from public.profiles order by role, email;

select id, student_id, school_year, status, student_no
from public.applications order by created_at;
```

> There is no `undo` in the SQL Editor. The 10 seconds it takes to download a CSV
> is the cheapest insurance you'll ever buy.

---

## 17. Student documents / Storage

Document files (PSA, report cards, etc.) live in the **private** `student-docs`
Storage bucket, under a per-student folder: `{user_id}/{doc}-{timestamp}.{ext}`.
The *metadata* (name/path/status) is in `applications.documents` (jsonb); the
*bytes* are in Storage. Deleting a user cascades the DB rows but **not** the
Storage files — those can be orphaned.

```sql
-- What documents does a student have (metadata)?
select p.email, a.documents
from public.applications a
join public.profiles p on p.id = a.student_id
where p.email = 'student@demo.nsdga.test';

-- List a student's files actually in Storage
select name, created_at, metadata->>'size' as size_bytes
from storage.objects
where bucket_id = 'student-docs'
  and (storage.foldername(name))[1] =
      (select id::text from auth.users where email = 'student@demo.nsdga.test');

-- Delete one student's files from Storage (do this BEFORE deleting the user if
-- you want to avoid orphans; order doesn't matter for correctness, only tidiness)
delete from storage.objects
where bucket_id = 'student-docs'
  and (storage.foldername(name))[1] =
      (select id::text from auth.users where email = 'student@demo.nsdga.test');

-- Find orphaned files (owner folder no longer has an auth user) — cleanup after
-- a wipe. Review the list before deleting.
select o.name
from storage.objects o
where o.bucket_id = 'student-docs'
  and not exists (
    select 1 from auth.users u
    where u.id::text = (storage.foldername(o.name))[1]
  );
```

> Prefer the **Dashboard → Storage → student-docs** UI for browsing/deleting
> files visually. The seed students' documents are *metadata only* (no real file
> in Storage), so their "view file" won't open anything — that's expected.

---

## 18. Chatbot rate-limit reset

The public chatbot is protected by a per-IP fixed-window counter in
`chat_rate_limits` (service-role only). If a legitimate user (or you, while
testing) got temporarily blocked:

```sql
-- See current counters
select ip, window_start, count from public.chat_rate_limits order by window_start desc;

-- Reset everyone (clears all counters)
delete from public.chat_rate_limits;

-- Reset just one IP
delete from public.chat_rate_limits where ip = '203.0.113.5';
```

> This only affects rate limiting. If the chatbot returns "credit balance too
> low", that's the **Anthropic account** (top up credits / check spend limit) —
> not the database.

---

## 19. Data-integrity / orphan checks

Run these occasionally (or after a messy manual edit) to catch inconsistencies.

```sql
-- Auth users with NO profile row (trigger failed at signup)
select u.id, u.email, u.created_at
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- Profiles with NO auth user (shouldn't happen — FK cascade prevents it)
select p.id, p.email
from public.profiles p
left join auth.users u on u.id = p.id
where u.id is null;

-- Students (role=student) who have NO application at all
select p.email, p.created_at
from public.profiles p
where p.role = 'student'
  and not exists (select 1 from public.applications a where a.student_id = p.id);

-- Enrolled applications missing a student number
select a.id, p.email, a.grade_level
from public.applications a
join public.profiles p on p.id = a.student_id
where a.status = 'enrolled' and (a.student_no is null or a.student_no = '');

-- Duplicate student numbers (should be unique in practice)
select student_no, count(*) from public.applications
where student_no is not null group by student_no having count(*) > 1;
```

A fix for a missing profile row (the signup trigger didn't fire):

```sql
insert into public.profiles (id, email, name, role, status, verified_at)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'name', u.email),
       'student', 'verified', now()
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
```

---

## 20. Inspect the schema itself (what exists)

When something behaves oddly, confirm which triggers / policies / functions are
actually live (not just what's in the .sql files).

```sql
-- All triggers on a table
select tgname, tgrelid::regclass as table, tgenabled
from pg_trigger
where tgrelid = 'public.profiles'::regclass and not tgisinternal;

-- All RLS policies on a table
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'profiles';

-- The live source of a function (e.g. confirm handle_new_user forces 'student')
select prosrc from pg_proc where proname = 'handle_new_user';

-- Is RLS even enabled on a table?
select relname, relrowsecurity
from pg_class
where relname in ('profiles','applications','audit_log','otp_codes',
                  'chat_rate_limits','site_content','presence','sections');

-- Every SECURITY DEFINER function in public (these bypass RLS — know them)
select proname, prosecdef
from pg_proc
where pronamespace = 'public'::regnamespace and prosecdef = true
order by proname;
```

---

## 21. What is NOT in the database (don't look for it in SQL)

Some things feel like "settings" but live elsewhere — editing them is a code or
dashboard change, not SQL:

| Thing | Where it actually lives | How to change |
|---|---|---|
| **Active school year** (`2026-2027`) | Code constant `CURRENT_SCHOOL_YEAR` in `src/lib/student.js` | Edit the file, commit, push (Vercel redeploys) |
| **Account-limit caps** | `site_content('account_limits')` jsonb | HeadAdmin → Settings → Account Limits (OTP) — §8g for SQL |
| **Secrets** (Anthropic key, Brevo key, Turnstile secret) | Supabase → Edge Functions → Secrets | Dashboard only — never in SQL or git |
| **Edge Function code** | `supabase/functions/*` → deployed | `supabase functions deploy <name>` (you deploy manually) |
| **Email delivery** (OTP, enrollment emails) | Brevo integration | Check Edge Function logs, not the DB |
| **CAPTCHA** | Cloudflare Turnstile | Dashboard / env — fail-closed server-side |
| **Chatbot credits/spend** | Anthropic console | Top up / set spend limit there |

> **Timezone note:** `now()` / timestamps are stored in **UTC**. The portal
> displays them in the viewer's local time, so a row that says `14:00Z` in SQL
> shows as `10:00 PM` in Manila (UTC+8). Don't be alarmed by the offset.

---

## Appendix — the setup SQL files (run once, in order)

These build the schema + functions. They're run once (or when changed), not
part of day-to-day operations. Order matters where a file depends on an earlier
one.

| # | File | What it creates |
|---|---|---|
| 1 | `schema.sql` | Core tables (`profiles`), RLS, `handle_new_user`, `enforce_profile_update` |
| 2 | `students.sql` | `applications` table + student RLS |
| 3 | `sections.sql` … `sections4.sql` | Sections + section workflow |
| 4 | `student-docs.sql`, `lock-documents.sql` | Document metadata + locking |
| 5 | `lifecycle.sql`, `lifecycle2.sql`, `readmit.sql` | Enrollment lifecycle transitions |
| 6 | `presence.sql`, `activity-history.sql` | Online presence + audit/activity |
| 7 | `billing.sql` | Billing/finance read model |
| 8 | `remove-mfa.sql` | `remove_user_mfa()` (service-role only) |
| 9 | `section-limit.sql` | `enforce_section_limit` trigger |
| 10 | `account-limits.sql` | `enforce_account_limit` trigger (per-role active caps) |
| 11 | `indexes.sql` | Performance indexes |

**Security hardening (run after the above — security review F-01…F-11):**

| File | Hardens |
|---|---|
| `harden-audit-security.sql` | `log_event()` SECURITY DEFINER + revoke direct audit inserts (F-01) |
| `harden-site-content.sql` | Explicit `site_content` table + RLS + `is_admin_or_head()` (F-03) |
| `chatbot-ratelimit.sql` | `chat_rate_limits` + `chat_rate_check()` per-IP limit (F-04) |
| `harden-functions.sql` | `is_headadmin`/`is_staff` `search_path=''` + resubmit throttle (F-06, F-08) |
| `harden-signup-role.sql` | `handle_new_user` forces `role='student'` — closes privilege-escalation (F-11) |
| `harden-production.sql`, `harden_audit.sql`, `harden-student-portal.sql` | Additional production RLS tightening |

> **Note:** `signup.sql` and the early `seed.sql` copy of `handle_new_user`
> default new users to `registrar`/`pending_profile`. The **authoritative**
> version is `harden-signup-role.sql`, which forces `role='student'`. If you
> ever re-run `seed.sql`, re-run `harden-signup-role.sql` afterward so the
> trigger is back to the secure version.
