# NSDGA Online Enrollment — Defense Q&A Bank (100+)

> Every question has a **model answer** you can say out loud (2–5 sentences).
> File/function citations are included so you can point to the code. The **15
> hardest** questions are marked **⚠️ — practice these first.** Read
> `DEFENSE_REVIEWER.md` alongside this.
>
> **Honesty rule:** a few answers (especially Category B) depend on your written
> paper, not the code. Those are flagged "**confirm with your paper**" — fill in
> your real methodology; don't invent code that isn't there.

---

## A. Project background, problem, objectives, scope & limitations

**A1. What is your system in one sentence?**
It is a web-based online admission and enrollment portal for Nuestra Señora de
Guia Academy of Marikina that lets applicants apply and track their status online,
and lets the registrar review, verify documents, and enroll them. It is built with
React + Vite on the front end and Supabase for the database, authentication,
storage, and serverless functions.

**A2. What problem does it solve?**
The old enrollment was on-site and paper-based: slow for parents and hard for the
registrar to track each applicant's status or keep a clean year-to-year history.
Our system moves admission online, gives the registrar one place to review and
decide, and keeps a secure per-year record under one Student Number.

**A3. Who are the users?**
There are four roles: **Student/Applicant**, **Registrar**, **Admin** (website
content, section approvals, finance export, student-account recovery), and
**HeadAdmin** (staff accounts, audit log, reports). The two main sides are Student
and Registrar; the roles are defined in `src/auth/authStore.js` (`ROLES`).

**A4. What are your main objectives?**
To let applicants apply and track status online any time; to give the registrar a
single review-and-enroll workflow with document checking; to keep a secure per-year
student record for easy re-enrollment; and to enforce that a student can only see
and change their own data.

**A5. What is the scope of the system?**
Online application, document upload, email-OTP verification, registrar review and
enrollment, document verification, sectioning with admin approval, student
lifecycle (complete/graduate/withdraw/archive/reactivate/re-admit), re-enrollment,
website content management, finance **export**, account management, an audit log,
reports, and an FAQ chatbot.

**A6. What are the limitations?**
No online payment — finance is a CSV export only (`src/lib/billing.js`);
Kindergarten admission stays face-to-face (`ALL_GRADES` excludes Kinder in
`src/lib/grades.js`); Form 137 is never uploaded because it's transmitted
school-to-school; and it depends on an internet connection and third-party free
tiers (email, chatbot).

**A7. Why does finance only export a CSV instead of handling payments?**
The school's finance office already does assessment and collection in its own
system, so duplicating payments would add risk and PCI concerns for no benefit.
Our Admin **Finance Export** (`src/lib/billing.js`) hands them a clean CSV of the
enrolled list for the active year, which is exactly what they need.

**A8. Who is your client / where did the requirements come from?**
The requirements came from NSDGA's admission and enrollment process — the real
roles, document requirements, and the apply→review→enroll→section lifecycle the
system implements. *(Confirm the specific interviews/respondents from your paper.)*

**A9. What makes your project significant?**
It replaces a manual, paper process with a secure online one, cuts queue time for
parents, and gives staff accurate, searchable records. The security design —
database-level Row-Level Security so students can only ever touch their own data —
is unusually strong for a school system.

**A10. Is the system deployed / usable now?**
Yes — the front end auto-deploys to Vercel on every push to `main`, and the backend
runs on Supabase. Some go-live hardening (real CAPTCHA key, purging demo data,
forcing staff MFA) is still pending and tracked in `security-report.md`.

---

## B. Methodology / SDLC, requirements, testing, evaluation

> ⚠️ Category B leans on your **written paper**. The answers below are the common,
> defensible choices — **confirm each against what your paper actually says.**

**B1. ⚠️ What software development methodology (SDLC model) did you use, and why?**
We used an **Agile / iterative** approach: we built the system in increments
(apply, then review/enroll, then sectioning, then admin tools), demoing and
refining each before moving on. This fit a changing feature set and a small team,
and it let us fix issues — like the security findings — as we went. *(Confirm the
exact model named in your paper; if it says Modified Waterfall/RAD, say that
instead and give the same reasoning.)*

**B2. Why Agile over Waterfall?**
Our requirements evolved as we understood the registrar's real workflow, so an
iterative model let us adjust each cycle instead of locking everything up front.
Waterfall would have been riskier because a late requirement change would be
expensive. *(Confirm with your paper.)*

**B3. How did you gather requirements?**
Through the school's existing admission process and its documents and roles, which
we translated into the apply→review→enroll→section flow. *(State your real methods
— interviews with the registrar, observation, document analysis — from your paper.)*

**B4. ⚠️ How did you evaluate the system? Did you use ISO 25010?**
*(Confirm with your paper.)* The standard capstone approach is to evaluate against
**ISO/IEC 25010** software-quality characteristics — functional suitability,
performance, usability, reliability, security, maintainability, portability — using
a respondent survey. If you did this, say which characteristics scored highest and
cite your results; if you didn't, say "we validated functionally and with a
security test; a formal ISO 25010 survey is our evaluation instrument" and show it.

**B5. ⚠️ What is a Likert scale and how did you use it?**
A Likert scale measures agreement on a 1–5 range (e.g. 1 = Strongly Disagree to
5 = Strongly Agree). We used it in our evaluation survey to turn user opinions on
each ISO 25010 characteristic into a weighted mean we could interpret.
*(Confirm your scale and the mean/interpretation from your paper.)*

**B6. Who were your respondents and how many?**
*(Answer from your paper — e.g. registrar staff, students/parents, IT evaluators,
and the sample size.)* Be ready to justify why that group is appropriate (they are
the actual users of each side).

**B7. How did you test the system functionally?**
We used a manual test plan — `MANUAL-TEST-CHECKLIST.md` and the
`NSDGA-Test-Cases*.csv` files — covering login, apply, review, enroll, and
sectioning, plus a structured QA engagement recorded in `QA-REPORT.md` (route
protection + session: 8/8 pass).

**B8. ⚠️ Did you do any automated testing?**
Yes, for the most critical part: `tests/security/rls.test.mjs` is an automated
probe that logs in as real users and asserts the student↔staff data boundary —
**18/18 pass** (a student can't read another's data, can't escalate, anon reads
nothing, staff access is correct). We did **not** write component unit tests; that
is an honest next step.

**B9. How did you handle bugs you found?**
We fixed them as we went and recorded the security ones formally. Examples: a
privilege-escalation hole where self-signup could request an admin role
(**F-11**), a forgeable audit log (**F-01**), and a CAPTCHA that could fall back to
always-pass (**F-02**) — all fixed and documented in `security-report.md`.

**B10. What were your biggest development challenges?**
Getting the security model right (making sure students truly can't touch other
students' data), handling concurrency (two registrars enrolling the same applicant),
and keeping re-enrollment history clean. We solved them with RLS + triggers,
status-gated updates (`ACTIONABLE` in `registrar.js`), and one application row per
year.

**B11. How did you manage the project / collaborate?**
*(From your paper — e.g. Git/GitHub for version control, task splitting by
feature.)* The repo history on GitHub shows incremental, feature-based commits.

**B12. How do you know the system meets its objectives?**
Each objective maps to a working feature: applying online (the Apply wizard),
single-place review and enroll (`ApplicationDetails` + `enrollApplication`), secure
per-year records (the `applications` table + RLS), and the student-only boundary
(proven by `rls.test.mjs`). *(Add your ISO 25010 survey results from the paper.)*

---

## C. Features & user flows — Student side

**C1. Walk us through applying as a new student.**
The applicant opens the Apply wizard and creates an account, which calls the
`create-applicant` Edge Function (CAPTCHA + validation) to make a **student**
account and a **draft** application, then signs them in (`createApplicantAccount`
in `src/lib/student.js`). They fill the remaining steps (saved via
`saveApplicationDraft`), upload documents, then verify an emailed 6-digit code,
which flips the application to **submitted**.

**C2. What documents must a student submit?**
A 2x2 picture, Report Card (Form 138), PSA Birth Certificate, and Good Moral
Certificate — defined in `REQUIRED_DOCS` (`src/lib/student.js`). Form 137 is
intentionally excluded because it is a confidential record transmitted
school-to-school, not uploaded by the applicant.

**C3. How does the student know their application status?**
Their dashboard/Application Status page reads `getMyApplication()` and shows the
lifecycle label (`STATUS_LABEL` in `student.js`): Submitted → Under Review →
Enrolled, or Needs Correction / Not Accepted. If documents were rejected, they see
a re-upload alert.

**C4. What happens when the registrar returns an application for correction?**
The status becomes `needs_correction` and the Enrollment Form becomes editable. The
student fixes it and resubmits via `resubmitApplication()`, which sets the status
back to `submitted` and flags it as resubmitted so the registrar can tell it apart
from a brand-new one.

**C5. Can a student enroll themselves or set their own Student Number?**
No. A database trigger (`enforce_application_update`) blocks a student from changing
their application status (except `needs_correction → submitted`) or setting a
`student_no`. Only a registrar can enroll, via `enrollApplication()` in
`registrar.js`.

**C6. How does re-enrollment work for a returning student?**
`reEnroll()` (`student.js`) creates a **new** application row for the next grade and
next school year (using `nextGrade` / `nextSchoolYear` in `grades.js`); moving into
Grade 11 requires choosing a strand. The student keeps the **same Student Number**,
so history is preserved.

**C7. When does a student get access to the full portal?**
Only after the registrar enrolls them. `SessionProvider.jsx` computes
`isEnrolled` from their application status; before that, `ProtectedRoute` with
`requireEnrolled` sends them to the applicant dashboard only.

**C8. How are uploaded documents kept private?**
They go to a **private** bucket under a per-user folder
`student-docs/{user_id}/{docKey}.{ext}` (`uploadStudentDoc` in `student.js`). To
view one, the app creates a **5-minute signed URL** (`signedDocUrl`); there is no
public link.

**C9. Can a student see another student's data or documents?**
No. Row-Level Security filters every read to their own rows, and storage policies
let a student read only their own folder. This is proven automatically by
`tests/security/rls.test.mjs`.

**C10. How does the student reset a forgotten password?**
They request a code (`send-reset-otp` Edge Function emails it), enter it
(`reset-password` verifies), then set a new password (`resetPasswordWithOtp` in
`student.js`). The server's reply is the same whether or not the email exists, so it
doesn't reveal which emails are registered.

---

## D. Features & user flows — Registrar side

**D1. Walk us through reviewing and enrolling an applicant.**
The registrar opens `ApplicationDetails`, reads the form, and opens each document
through a signed URL. They mark each document Verify/Reject (`setDocumentStatus`),
then decide: Mark Under Review, Return for Correction, Reject, or **Approve &
Enroll** (`enrollApplication`), which assigns the next Student Number and emails the
student.

**D2. ⚠️ What stops two registrars from enrolling the same applicant at once?**
Every decisive update is **status-gated**: it only applies if the row is still in an
actionable status (`.in('status', ACTIONABLE)` in `registrar.js`). If a second
registrar acts on the same applicant, their update hits **0 rows** and we return
"This application was already handled by another registrar," instead of silently
overwriting the first decision.

**D3. How are Student Numbers generated and kept unique?**
`nextStudentNo()` finds the highest number for the school year and adds one (e.g.
`2026-0001`). A returning student reuses their original number. A **UNIQUE index**
on `student_no` plus a retry loop on a Postgres `23505` duplicate error guarantees
no two students get the same number even under a race (`enrollApplication`).

**D4. How does the registrar build class sections?**
In the Sections page they `createSection` (Senior High needs a strand; cap is 45),
assign enrolled students with `assignToSection` (the 45 cap is enforced), then
`submitSection` to send it to the Admin for approval. Editing a section's roster or
name sends it back to `draft` so it must be re-approved.

**D5. ⚠️ How do classmates become visible to students without exposing other students' data?**
When the **Admin approves** a section (`approveSection` in `registrar.js`), the
system writes `sectionApproved` and a `classmates` name list into **each student's
own `applications.form`**. So every student reads their class from their **own** row
— they never need read access to anyone else's record.

**D6. What lifecycle actions can the registrar perform on a student?**
Mark the year completed (`markCompleted`), withdraw/graduate/archive
(`setLifecycle`), bulk-archive leftovers (`bulkArchive`), reactivate
(`reactivateStudent`), and re-admit a returnee at a new grade (`readmitStudent`) —
all in `registrar.js`. Records are kept, not deleted.

**D7. What happens to a withdrawn or archived student's login?**
Their login is revoked — `signInStudent` (`student.js`) checks the latest
application status and blocks login if it is `withdrawn`, `graduated`, or
`archived`. It's fully reversible: reactivate or re-admit restores access.

**D8. How does the registrar notify a student of a decision?**
Decisions call the `notify` Edge Function (`notifyStudent` in `registrar.js`), which
sends a branded email via Brevo. Email failures are fire-and-forget — they never
block the database change, which is what actually matters.

**D9. Can a registrar read or edit any student's application?**
Yes — RLS lets **verified staff** read and update all applications, and the enforce
trigger lets staff (not students) change status and assign a Student Number. A
registrar still **cannot** read all `profiles` rows (no user enumeration) — that
policy is self-or-HeadAdmin only.

**D10. How does the registrar see their own activity?**
The History page calls `listMyActivity()` (`registrar.js`), which reads the audit
log filtered to their own email and hides login/logout rows, showing only the
actions they performed.

---

## E. Technical — React concepts actually used

**E1. What is a React component? Give an example from your code.**
A component is a reusable, self-contained piece of UI that returns JSX. For example
`src/components/ImageCarousel.jsx` is a component that takes a list of images and
renders a carousel; pages like `ApplicationDetails.jsx` are larger components built
from smaller ones.

**E2. What are props?**
Props are read-only inputs passed from a parent component to a child. For example
`ImageCarousel` receives `images`, `alt`, and `heightClass` as props, and
`ProtectedRoute` receives `allow`, `requireVerified`, and `children`.

**E3. What is state, and which hook manages it?**
State is data a component owns that can change and trigger a re-render. We use the
`useState` hook — e.g. `const [session, setSession] = useState(null)` in
`SessionProvider.jsx`, or the open/close state of the nav dropdown in `NavBar.jsx`.

**E4. What does useEffect do? Show a real use.**
`useEffect` runs side effects after render, such as data fetching or subscriptions.
In `SessionProvider.jsx` we use it to load the Supabase session on mount, subscribe
to auth changes, and run the presence heartbeat; in pages we use it to fetch data
like `getMyApplication()`.

**E5. ⚠️ What is the Context API and why did you use it?**
Context shares data across many components without passing props down every level.
We use it for the logged-in session: `SessionProvider` holds the session and
exposes it through `useSession()`, so any page can read who is logged in, their
role, and whether they're enrolled, without prop-drilling.

**E6. How does routing work in your app?**
We use React Router 7. All routes are declared in `src/App.jsx` with `<Routes>` and
`<Route>`, and navigation uses `<NavLink>`. Pages are **lazy-loaded** with
`lazy(() => import(...))` so each page's code is only downloaded when visited.

**E7. What is a protected route and how did you implement it?**
A protected route blocks pages based on login and role. `src/auth/ProtectedRoute.jsx`
reads the session; if there's no session it redirects to login, if the role isn't in
`allow` it redirects to that role's home, and it can also require a verified or
enrolled account. It wraps protected pages in `App.jsx`.

**E8. What are React hooks? Which ones did you use?**
Hooks are functions that let function components use state and lifecycle features.
We use `useState`, `useEffect`, `useCallback`, `useMemo`, and `useRef` (all visible
in `SessionProvider.jsx`), plus React Router's `useLocation`/`useNavigate` and our
own custom hook `useSession()`.

**E9. ⚠️ Why do some components need `key` props in lists, and where do you do it?**
`key` gives each list item a stable identity so React can update the DOM
efficiently and correctly. We set keys when mapping arrays, e.g. the strand/event
cards use `key={item.id}` and the carousel dots use the index as a key.

**E10. What is conditional rendering? Example?**
It's showing different UI based on a condition. For example `ProtectedRoute` returns
a loading screen while the session loads, a redirect if not allowed, or the page if
allowed; and pages show an empty-state message when a list is empty.

**E11. What is "lifting state up" or a provider pattern — did you use it?**
Yes — rather than each page tracking the user, we **lifted** the session into one
provider (`SessionProvider`) at the top of the tree and share it via context, so
there's a single source of truth for authentication state.

**E12. What is a controlled component?**
A form input whose value is driven by React state. Our forms (login, apply,
editors) bind inputs to state with `value={...}` and `onChange`, so React always
holds the current value — for example the admin event editor's title/description
inputs.

---

## F. Vite, build, deployment, environment, hosting

**F1. What is Vite and why use it over Create-React-App?**
Vite is a modern build tool and dev server. It gives near-instant startup and hot
reload in development and an optimized production build, and it's actively
maintained, whereas Create-React-App is effectively deprecated. Scripts are in
`package.json` (`vite`, `vite build`).

**F2. How do you build and run the project?**
`npm run dev` starts the local dev server; `npm run build` produces the optimized
static site in `dist/`; `npm run preview` serves that build locally. These are
defined in `package.json`.

**F3. ⚠️ How do you handle environment variables and secrets?**
Client env vars are in `.env.local` and must be prefixed `VITE_` to be exposed —
we only expose `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, which are **safe to
expose** because RLS guards the data (`src/lib/supabase.js`). Real secrets
(`service_role`, Anthropic, Brevo keys) are **never** in the front end — they live
only as Edge Function secrets on the server.

**F4. Where and how is the app hosted/deployed?**
The React build is hosted on **Vercel**, which **auto-deploys on every `git push`
to `main`**. The backend lives on Supabase; SQL migrations and Edge Functions are
deployed manually in the Supabase dashboard (documented in `docs/SQL_RUNBOOK.md`).

**F5. What is an SPA and are there downsides?**
A Single-Page Application loads once and then swaps views with JavaScript, which
feels fast. Downsides are a larger initial JS payload and weaker SEO; we mitigate
the payload with **route-based code-splitting** (lazy routes in `App.jsx`), and SEO
isn't important for a login-gated school portal.

**F6. How is the production bundle optimized?**
Vite minifies and tree-shakes the code, and React Router lazy-loading splits each
page into its own chunk so users only download the page they visit. That keeps the
first load small.

---

## G. Database & backend

**G1. ⚠️ What database do you use and what is Row-Level Security (RLS)?**
We use **PostgreSQL** on Supabase. **RLS** is a Postgres feature where the database
itself attaches a rule to every query so a user can only touch rows they're allowed
to. For `applications`, a student's query is rewritten to `where student_id =
auth.uid()`, so even if they tamper with the request they get only their own data.

**G2. Describe your main tables and their relationships.**
`profiles` (one per account, holds role/status), `applications` (one per applicant
**per school year**, holds the form/documents/status/student_no), `sections` (class
sections per grade/year), plus `audit_log`, `otp_codes`, `presence`,
`site_content`, and `chat_rate_limits`. A user **has one** profile and **submits
many** applications; see the ERD in `DEFENSE_REVIEWER.md`.

**G3. ⚠️ Why store the form and documents as JSON (`jsonb`) instead of many columns?**
Because the admission form has many optional fields that can change year to year.
Storing `form` and `documents` as `jsonb` lets us add or adjust fields **without a
database migration** each time, while the important fields (`status`, `student_id`,
`student_no`, `school_year`) stay as real columns we can index and query.

**G4. How do you keep a student's history across years?**
Each school year is a **separate row** in `applications` for the same
`student_id`, and the student keeps one `student_no`. So re-enrollment just adds a
new row (`reEnroll` / `readmitStudent`), and the full history reads back by
`student_id`.

**G5. How do you prevent duplicate student numbers and duplicate learners?**
Student numbers are protected by a **UNIQUE index** plus a retry on collision
(`enrollApplication`). Duplicate learners are blocked at signup — `create-applicant`
rejects an **LRN** that already exists in any application.

**G6. How is data integrity enforced beyond RLS?**
With database **triggers** that run `SECURITY DEFINER` functions:
`enforce_profile_update` (no role/status change by non-HeadAdmins),
`enforce_application_update/insert` (students can't change status/student_no/
billing), `handle_new_user` (new accounts forced to `student`), and
`enforce_section_limit` / `enforce_account_limit` (caps).

**G7. How does the UI talk to the database?**
Through the `supabase-js` client, but **only via helper functions** in
`src/lib/*.js` and `authStore.js` (e.g. `listApplications`, `enrollApplication`).
Components never write raw queries, so the backend contract lives in one place.

**G8. What are Edge Functions and when do you use them?**
They are small serverless functions (Deno/TypeScript) that run on Supabase with the
powerful `service_role` key. We use them for anything the browser must not do
directly: creating accounts (`create-applicant`, `create-staff`), sending email
(`notify`, `send-otp`), the chatbot, and OTP-verified admin actions.

**G9. Can records be deleted by a user?**
No. There is **no DELETE policy** on `applications` or `profiles`, so clients can't
destroy records. Deprovisioning (withdraw/graduate/archive) only changes a status —
the data stays for history and is reversible.

**G10. What happens if an email or the chatbot service fails?**
Email is fire-and-forget: `notifyStudent` failures never block the registrar's
decision because the database change is the source of truth. The chatbot is
rate-limited per IP and fails safely; it never touches student records.

---

## H. Security & data privacy

**H1. ⚠️ Why is it safe to put the Supabase anon key in the browser?**
Because the anon key is only an **API key, not a permission** — it lets the browser
reach the database, but **RLS decides what each logged-in user may see or change**.
The powerful `service_role` key that bypasses RLS is never in the browser; it lives
only in Edge Functions (`src/lib/supabase.js`, `security-report.md` §5).

**H2. ⚠️ How do you prevent one student from seeing another's data (IDOR)?**
RLS rewrites every student query to `where student_id = auth.uid()`, so changing an
ID in a request simply returns nothing. This is enforced in the database, not the
UI, and is proven automatically by `tests/security/rls.test.mjs` (18/18 pass).

**H3. ⚠️ How do you prevent privilege escalation (a student making themselves admin)?**
Two defenses: the `handle_new_user` trigger **forces every new account to
`role = 'student'`** regardless of what the client sends, and
`enforce_profile_update` **rejects any role/status/disabled change** by a
non-HeadAdmin. We actually found and fixed this exact hole — finding **F-11** in
`security-report.md`.

**H4. How do you protect sensitive staff actions like creating accounts or changing roles?**
They run only inside Edge Functions that re-check the caller's role from the JWT and
require **MFA plus an emailed one-time code** (step-up) before applying the change —
`create-staff`, `admin-role-change`, `admin-set-password`, `admin-remove-mfa`,
`admin-account-limits` (wrappers in `authStore.js`).

**H5. What is MFA and is it enforced?**
MFA (Multi-Factor Authentication) adds a time-based 6-digit code from an
authenticator app on top of the password. It is fully built (`enrollMfa`,
`verifyMfaLogin` in `authStore.js`) and used for step-up, but the **hard
requirement is currently off** (`MFA_REQUIRED_ROLES = []`); forcing it for staff is
on our go-live checklist.

**H6. How do you validate input, and why both client and server?**
The forms validate for quick feedback, but the browser can be bypassed with dev
tools, so we **re-validate on the server** in `create-applicant` (Gmail-only email,
password ≥8 with letter + number, phone `09XXXXXXXXX`, 12-digit LRN,
duplicate-LRN). Server-side is the one that actually protects the system.

**H7. How do you stop bots from mass-creating accounts?**
The public signup goes through a Cloudflare **Turnstile CAPTCHA** verified
server-side in `create-applicant`, and it **fails closed** — if the secret isn't
set, no signup is allowed (finding **F-02**, fixed).

**H8. How is your audit log trustworthy — can it be forged?**
No. All audit writes go through one `SECURITY DEFINER` function, `log_event()`,
which stamps the email/role **from the JWT**, not from client input, and direct
table inserts are revoked. We fixed the earlier forgeable version (finding **F-01**,
`supabase/harden-audit-security.sql`).

**H9. ⚠️ How does your system relate to the Data Privacy Act of 2012 (RA 10173)?**
We collect personal and sensitive personal information (name, LRN, birth
certificate, photo), so RA 10173 applies. We support its security requirement with
RLS (each student sees only their own data), a private document bucket with signed
URLs, server-side secrets, an audit log, and HTTPS/at-rest encryption via Supabase;
records are archived rather than deleted. Honestly, a formal **consent notice and a
retention policy** are not yet in the app — that's our next compliance step.

**H10. Is there any risk of XSS or code injection?**
The front end has no XSS sinks — no `dangerouslySetInnerHTML` or `innerHTML`; the
one place that builds HTML (printing class lists, `src/lib/print.js`) escapes every
value. Database access is through the parameterized Supabase client and RLS, so
there's no raw SQL string concatenation from the client.

---

## I. "Show us in the code" / live-demo questions

**I1. ⚠️ Show where login happens and what it checks.**
`signIn()` in `src/auth/authStore.js` (and `signInStudent()` in `src/lib/student.js`
for students). It calls `supabase.auth.signInWithPassword`, then checks the profile
exists, isn't disabled, matches the portal's role, and (for students) isn't
deprovisioned; it records SUCCESS/FAILED to the audit log and handles the MFA step.

**I2. Show where a new applicant account is created.**
`supabase/functions/create-applicant/index.ts`. It verifies the CAPTCHA, validates
the input, creates a confirmed **student** account with the service role, and
inserts a **draft** application atomically (deleting the user if the insert fails).

**I3. Show where enrollment assigns a Student Number.**
`enrollApplication()` in `src/lib/registrar.js`. It computes the number with
`nextStudentNo()` (or reuses a returnee's), updates the row to `enrolled` only if
it's still actionable, retries on a unique-number collision, and emails the student.

**I4. Show the route guard.**
`src/auth/ProtectedRoute.jsx`. It reads `useSession()`, waits for loading, then
redirects based on login, the `allow` roles list, `requireVerified`, and
`requireEnrolled`. It wraps protected pages in `src/App.jsx`.

**I5. Show how the logged-in session is loaded and shared.**
`src/contexts/SessionProvider.jsx`. On mount it reads the Supabase session, fetches
the user's profile, computes `isEnrolled`/MFA flags, and exposes everything through
`useSession()`; it also runs the presence heartbeat.

**I6. Show where documents are uploaded and viewed.**
`uploadStudentDoc()` and `signedDocUrl()` in `src/lib/student.js`. Upload writes to
`student-docs/{user_id}/{docKey}.{ext}` with upsert; viewing creates a 5-minute
signed URL. The registrar verifies them in `setDocumentStatus()` (`registrar.js`).

**I7. Show where classmates get written to each student.**
`approveSection()` in `src/lib/registrar.js`. It collects the section's members,
builds a sorted name roster, marks the section `approved`, then writes
`sectionApproved` + `classmates` into each member's own `applications.form`.

**I8. Explain the `enrollApplication` concurrency guard line by line.**
It reads the application, computes/reuses a student number, then updates with
`.eq('id', id).in('status', ACTIONABLE)`. If that returns 0 rows, another registrar
already handled it, so we return "already handled." If Postgres returns `23505`
(duplicate number), we null the number and retry. This makes it safe under two
registrars acting at once.

**I9. Show where the active school year comes from.**
It's stored in `site_content` (section `enrollment`) and read via `getActiveSchoolYear()`
in `src/lib/content.js`; the Admin edits it in the Enrollment & Announcements page.
(There is also a hard-coded fallback `CURRENT_SCHOOL_YEAR` in `student.js`.)

**I10. Show how roles are defined and where they're used.**
`ROLES`, `ROLE_HOME`, and `STATUS` in `src/auth/authStore.js`. They drive the login
redirect, the `allow` lists in `ProtectedRoute` (`App.jsx`), and the role checks in
the Edge Functions.

---

## J. Tricky / pressure questions

**J1. ⚠️ What is the weakest part of your system?**
Honestly, two things: MFA isn't force-enforced yet (`MFA_REQUIRED_ROLES = []`), and
we rely on manual backend deployment and some pending go-live hardening (real
CAPTCHA key, purging demo data). Both are tracked in `security-report.md`, and the
core security — RLS + triggers — is already solid.

**J2. ⚠️ What happens if the server (Supabase) goes down?**
The app can't read or write data while Supabase is down, because it's our single
backend — that's the trade-off of a managed BaaS. Supabase runs managed, redundant
infrastructure with its own uptime guarantees, and no data is lost; when it's back,
the app works normally. For a school's enrollment window, that reliability is
acceptable.

**J3. ⚠️ How scalable is this? What if 10,000 students apply at once?**
Postgres and Supabase handle far more than a single school's load, and our reads
are indexed and RLS-scoped. The honest limit in our code is that some list queries
are **capped at 5,000 rows rather than paginated** (`listApplications` in
`registrar.js`); adding real pagination is our next scaling step, but for NSDGA's
size the current design is comfortable.

**J4. Why Supabase instead of building your own backend server?**
Because it gave us a production-grade database, authentication, file storage, and
serverless functions in one managed service, so a small team could focus on
features and security instead of running and patching a server. We could have used
Node/Express + PostgreSQL, but that's more infrastructure to secure ourselves.

**J5. Why not use an existing enrollment system or Google Forms?**
Google Forms can't enforce per-student data privacy, assign student numbers, manage
sections, or give the registrar a review workflow — it just collects responses. A
generic off-the-shelf system wouldn't match NSDGA's specific lifecycle (returnees
keeping a number, strand-based SHS sections, admin section approval). Ours is built
around their real process.

**J6. ⚠️ How is your system different from existing registrar systems?**
Our security is **database-enforced**, not UI-enforced — RLS means a tampered
request still can't read another student's data. We also push the section/classmate
list onto each student's own record so no student ever needs read access to others,
and we keep a clean per-year history under one student number for easy re-enrollment.

**J7. A student opens dev tools and changes a request to another student's ID — what happens?**
Nothing useful to them — RLS rewrites the query to their own `auth.uid()`, so they
get an empty result, not someone else's data. The security isn't in the JavaScript
they can edit; it's in the database. This is exactly what `rls.test.mjs` verifies.

**J8. What would you improve if you had more time?**
Force MFA for staff, add true pagination, write component unit tests, add a
privacy-consent notice and retention policy, and automate backend deployment. These
are concrete, already-identified next steps, not unknowns.

**J9. How do you handle two registrars editing the same thing?**
For enrollment decisions we use status-gated updates so the second write hits 0 rows
and is reported as "already handled" (`ACTIONABLE` in `registrar.js`). For sections,
editing a roster reverts the section to `draft` so it must be re-approved, keeping
the released roster consistent.

**J10. ⚠️ Is it secure to let the public call your Edge Functions (CORS is `*`)?**
Yes, because security isn't done with CORS — it's done with **auth**. The public
functions (`create-applicant`, `chatbot`) can only ever do low-privilege, rate- and
CAPTCHA-limited work, and every privileged function re-checks the caller's role from
the JWT (and MFA/OTP). CORS `*` just means any origin can call the API; what they're
allowed to *do* is still enforced server-side (`security-report.md` §5).

**J11. What if someone steals a student's password?**
They'd still only reach that one student's own data (RLS), and the account can be
disabled or have its password reset by staff via OTP-verified recovery. For staff
accounts, MFA (when enforced) stops a stolen password alone from logging in, and the
audit log plus brute-force alerts (`mfaAlerts`) surface suspicious attempts.

**J12. How do you know your security actually works — did you test it?**
Yes. Besides a code review (`security-report.md`), we have an automated probe,
`tests/security/rls.test.mjs`, that logs in as two different students, a registrar,
an admin, and anonymous, and asserts the boundary holds — **18/18 pass**, including
blocked IDOR and blocked escalation.

**J13. Why React and not a simpler tool like plain HTML/PHP?**
React's component model let us build four role-based portals with shared logic
(session, guards, data layer) cleanly, and it pairs naturally with Supabase's
JavaScript client. A plain HTML/PHP approach would duplicate a lot of UI and
server code and wouldn't give the same single-page responsiveness.

**J14. What personal data do you collect and is that proportional?**
Only what admission requires: name, contact, address, LRN, birth certificate,
report card, good moral, and a photo (`REQUIRED_DOCS`, the apply form). That's the
proportionality principle of RA 10173 — we don't collect anything beyond what the
enrollment decision needs.

**J15. If we delete a student by mistake, can you recover it?**
There is no delete for clients — the system **archives** instead of deleting
(`setLifecycle`/`bulkArchive`), and archived students are fully restorable via
reactivate or re-admit. So an accidental "removal" is reversible by design.

**J16. Why is finance just an export and not integrated?**
Payments carry heavy compliance (PCI) and the school already collects through its
own finance office, so integrating payments would add risk with no real benefit.
Our CSV export (`src/lib/billing.js`) gives finance exactly the enrolled list they
need, filtered by school year and public/private origin.

---

### Appendix — the 15 hardest (practice these first) ⚠️
B1 (SDLC), B4 (ISO 25010), B5 (Likert), B8 (automated testing),
D2 (concurrency), D5 (classmates without exposure),
E5 (Context API), E9 (keys),
F3 (env vars/secrets),
G1 (RLS), G3 (why jsonb),
H1 (anon key safe), H2 (IDOR), H3 (privilege escalation), H9 (Data Privacy Act),
I1 (login), I8 (concurrency guard),
J1 (weakest part), J2 (server down), J3 (scalability), J6 (vs existing systems),
J10 (CORS `*`).

*(These exceed 15 because several ties are equally likely to be pressed — prioritize
the security ones: G1, H1, H2, H3, and the concurrency pair D2/I8.)*
