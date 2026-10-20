# NSDGA Enrollment Portal — Manual QA Test Checklist

**System:** Online admission & enrollment portal for Nuestra Señora de Guia Academy of Marikina.
**Stack:** React 19 + Vite + React Router 7 · Tailwind v4 / daisyUI · Supabase (Auth, Postgres + RLS, Storage, Edge Functions) · Brevo email · Vercel.
**Roles:** Applicant/Student · Registrar · Admin · Head Admin.
**Target browsers/devices:** Chrome, Firefox, Edge, Safari (desktop) · Chrome/Safari (mobile) · tablet.

**How to use:** Status legend — `P` = Pass, `F` = Fail, `B` = Blocked (leave blank until run). Fill the **Status** and **Notes** columns as you test. Priorities: **H** = High (blocks release), **M** = Medium, **L** = Low.

---

## Inventory (pages & features under test)

**Public:** Home, About, Contact popup, enrollment/announcement content.
**Student/Applicant:** Login, Forgot Password (email OTP), Apply wizard (6 steps: Account → Personal → Grade & Type → Academic → Documents → Review), Verify OTP, Application Status, Enrollment Form (edit/resubmit), Dashboard, Documents, Profile, Settings (MFA + change password), Create New Password, AI chatbot widget.
**Registrar:** Login, Dashboard, Applications (review), Application Details (under-review / needs-correction / reject / enroll), Sections (create/edit/submit/assign), Student Records (filters), Student Profile (history), Settings.
**Admin:** Login, Dashboard, Edit Enrollment (period + announcements + active S.Y.), Edit Contact, Edit School Events, Edit Executive Board, Edit Academic Schedule, SHS Courses (strands), Section Approvals, Finance Status (billing), Student MFA (recovery), Profile, Settings.
**Head Admin:** Login, Dashboard, Accounts (create staff, role change, set password, verify, disable, remove MFA), Audit Log, System (usage), Profile, Settings.
**Cross-cutting:** MFA-before-changes gate, offline banner, Apply draft autosave, role-based protected routes, Suspense/lazy loading.

---

## 1. Authentication (AUTH)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| AUTH-001 | Applicant sign-up creates account + draft | Enrollment OPEN | Apply → fill Account step with valid unique email/password → Create Account | Account created, signed in, advances to Personal step; a draft application exists | H | | |
| AUTH-002 | Sign-up email OTP verification | Draft submitted at Review step | Submit → check email → enter 6-digit code on Verify OTP | Code accepted; application becomes "Submitted" | H | | |
| AUTH-003 | Wrong/expired OTP rejected | OTP sent | Enter wrong code 5×; wait >10 min and try | Clear error; blocks after 5 attempts / after expiry; can request new code | H | | |
| AUTH-004 | OTP resend throttle | OTP sent | Tap resend twice quickly | Second request throttled (~30s) with a message | M | | |
| AUTH-005 | Student login (happy path) | Verified student exists | Login with correct email/password | Lands on Application Status (applicant) or Dashboard (enrolled) | H | | |
| AUTH-006 | Login wrong password | Student exists | Enter wrong password | "Invalid email or password"; no account lockout leak | H | | |
| AUTH-007 | Staff cannot log in on Student portal | Registrar account | Use staff creds on Student Login | Rejected: "This is the Student portal…"; signed out | H | | |
| AUTH-008 | Registrar / Admin / Head Admin login | Each staff account | Log in on each portal's Login page | Lands on respective dashboard | H | | |
| AUTH-009 | Wrong-portal staff login | Admin account | Log in on Registrar Login | Rejected / redirected appropriately | M | | |
| AUTH-010 | Forgot password via email OTP | Student exists | Forgot Password → enter email → enter code → set new password | Password reset; can log in with new password | H | | |
| AUTH-011 | Forgot password hides account existence | — | Request reset for a non-existent email | Generic success (no "user not found" leak) | M | | |
| AUTH-012 | Password reset link page | Reset email link | Open Create New Password via reset link → set new password | New password set; redirected to login | M | | |
| AUTH-013 | Logout | Logged in (any role) | Click Logout | Session cleared; redirected to that portal's Login | H | | |
| AUTH-014 | Session persists after refresh | Logged in | Hard-refresh (F5) | Still logged in; same page/state | H | | |
| AUTH-015 | Session restored in new tab | Logged in | Open app in a new tab | Logged-in session shared | M | | |
| AUTH-016 | Expired/invalid session | Logged in | Clear/expire the auth token, then navigate | Redirected to login; no crash | M | | |
| AUTH-017 | Disabled account cannot log in | Account with disabled=true | Attempt login | "This account has been disabled…"; signed out | H | | |
| AUTH-018 | Deprovisioned student blocked | Student withdrawn/graduated/archived | Attempt login | "This student account is inactive…"; signed out | H | | |
| AUTH-019 | Pending-profile staff onboarding | New staff (pending_profile) | First login | Routed to Profile Setup before full access | M | | |

## 2. Protected Routes & Authorization (RBAC)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| RBAC-001 | Logged-out access to protected page | Logged out | Visit `/StudentPortal/Dashboard` directly | Redirected to Student Login | H | | |
| RBAC-002 | Logged-out access to staff page | Logged out | Visit `/AdminPortal/EditStrands`, `/RegistrarPortal/Sections`, `/HeadAdminPortal/Accounts` | Redirected to the matching Login | H | | |
| RBAC-003 | Student cannot reach staff routes | Logged-in student | Visit `/RegistrarPortal/Applications`, `/AdminPortal/Dashboard` | Blocked/redirected (not rendered) | H | | |
| RBAC-004 | Registrar cannot reach Admin-only pages | Registrar | Visit `/AdminPortal/EditEnrollment`, `/HeadAdminPortal/Accounts` | Blocked/redirected | H | | |
| RBAC-005 | Admin cannot reach Head-Admin pages | Admin | Visit `/HeadAdminPortal/Accounts`, `/HeadAdminPortal/AuditLog` | Blocked/redirected | H | | |
| RBAC-006 | requireEnrolled gate | Applicant (not yet enrolled) | Visit `/StudentPortal/Dashboard` / `/StudentPortal/Documents` | Redirected to Application Status (portal locked until enrolled) | H | | |
| RBAC-007 | requireVerified gate | Unverified staff | Visit a verified-only staff page | Blocked until verified | M | | |
| RBAC-008 | Continuing student during re-enrollment | Enrolled student re-enrolling (in review) | Access full portal | Keeps portal access with a re-enrollment banner | M | | |

## 3. Row-Level Security & Data Isolation (RLS)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| RLS-001 | Student sees only own application | 2 students with applications | As student A, inspect network/data | Only A's application returned; B's never present | H | | |
| RLS-002 | Student cannot read others via API | Student token | Query `applications` for another student_id (devtools) | RLS returns nothing / denied | H | | |
| RLS-003 | ID tampering in Student Profile (registrar) | Registrar | Change the student id in a staff URL to another student | Staff may view (allowed); but a STUDENT doing the same is denied | H | | |
| RLS-004 | Student cannot self-enroll | Student token | Attempt to set own status='enrolled' or student_no via API | Blocked by enforce trigger ("Not allowed…") | H | | |
| RLS-005 | Student cannot change own billing | Student token | Attempt to update `billing` via API | Blocked by enforce trigger | H | | |
| RLS-006 | Sections table staff-only | Student token | Attempt to read/insert `sections` | Denied by RLS | H | | |
| RLS-007 | site_content public read / staff write | Student or logged-out | Read content (ok); attempt to write | Read allowed; write denied unless Admin/HeadAdmin | M | | |
| RLS-008 | Self-signup cannot escalate role | New sign-up | Inspect created profile | Role is always 'student' (never staff) regardless of client payload | H | | |
| RLS-009 | Storage docs are private | Student A | Try to open student B's document path / public URL | No access; only signed URLs for own files work | H | | |
| RLS-010 | Anonymous probe | Logged out | Run the RLS probe (scripts/rls-test.mjs) | All checks pass (no data leak) | M | | |

## 4. MFA / Two-Factor (MFA)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| MFA-001 | Enable MFA (enroll + activate) | Logged in, MFA off | Settings → enable MFA → scan QR → enter code | MFA activated; QR renders as image (no raw markup) | H | | |
| MFA-002 | MFA step-up on login | MFA enabled | Log out → log in | Prompted for authenticator code before access | H | | |
| MFA-003 | Wrong MFA code | MFA enabled | Enter wrong 6-digit at login | Rejected; ret/retry allowed | H | | |
| MFA-004 | Disable MFA | MFA enabled | Settings → disable MFA | MFA removed; next login has no step-up | M | | |
| MFA-005 | No duplicate MFA card | Staff Settings | Open Settings | Only one MFA card shown ("Two-Factor Authentication (MFA)") | L | | |
| MFA-006 | MFA-before-changes gate (Registrar/Admin) | Staff with MFA OFF | Open a mutation page (e.g. Sections, Edit Enrollment, SHS Courses) | Red "Changes are locked" banner; action buttons disabled | H | | |
| MFA-007 | Gate clears after enabling MFA | Staff just enabled MFA | Reopen the mutation page | Banner gone; actions enabled | H | | |
| MFA-008 | Head Admin server-side gate | HeadAdmin with MFA off | Attempt an account action | Server rejects ("Enable MFA… before making changes") | H | | |
| MFA-009 | MFA reset by Admin (student) | Admin w/ MFA; locked-out student | Student MFA → pick student → request code (email) → enter code → confirm | Student's MFA removed; audit logged (MFA_RESET) | H | | |
| MFA-010 | MFA reset authz matrix | Admin / HeadAdmin | Admin tries to reset a staff MFA; HeadAdmin tries a student | Admin→student only; HeadAdmin→registrar/admin only; else denied | H | | |
| MFA-011 | Cannot reset own MFA here | Admin | Try to target self in Student MFA | Blocked ("can't reset your own MFA here") | M | | |

## 5. Apply Wizard & Application CRUD (APPLY)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| APPLY-001 | Full happy-path application | Enrollment OPEN | Complete all 6 steps with valid data → submit → verify OTP | Application "Submitted"; visible on Application Status | H | | |
| APPLY-002 | Apply blocked when enrollment CLOSED | Admin set enrollment closed | Open Apply | "Admission is currently closed" with the closed message | H | | |
| APPLY-003 | Resume draft after sign-in | Signed-in applicant with draft | Reopen Apply | Wizard resumes at saved step with saved data | M | | |
| APPLY-004 | Local draft autosave | Mid-wizard | Type data → refresh/close tab → reopen | Typed data restored (password never stored); expires after 12h | M | | |
| APPLY-005 | SHS strand required | Grade 11/12 selected | Leave strand empty → next | Validation: "Please choose a Senior High strand" | H | | |
| APPLY-006 | SHS strands come from Admin list | Admin edited SHS Courses | Grade 11 → open strand dropdown | Shows current Admin list (HT/IT/CP/TECHPRO), not hardcoded | H | | |
| APPLY-007 | Grade-1 (no LRN) path | New Grade 1 applicant | Tick "no LRN yet" | LRN optional; only Grade-1 required docs enforced | M | | |
| APPLY-008 | Edit & resubmit after correction | Application in needs_correction | Enrollment Form → fix → Save Changes | Status back to "Under Review"; flagged as resubmitted | H | | |
| APPLY-009 | Save Draft keeps status | Enrollment Form | Edit → Save Draft | Saved without changing status | M | | |
| APPLY-010 | Re-read after refresh | Submitted application | Refresh Application Status | Correct status/data persists | H | | |
| APPLY-011 | Duplicate email at sign-up | Email already used | Create account with same email | Clear error; no duplicate account | H | | |

## 6. Form Validation (VAL)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| VAL-001 | Required fields | Apply/any form | Submit with blanks | Inline errors; submit blocked | H | | |
| VAL-002 | Email format | Account step | Enter "abc", "a@b", trailing spaces | Rejected until valid; trimmed | H | | |
| VAL-003 | Phone limiter (09 + 11 digits) | Account/Personal | Type letters, +63, >11 digits | Only digits kept; max 11; must match 09XXXXXXXXX | H | | |
| VAL-004 | LRN digits only, max 12 | Personal step | Type letters / >12 digits | Digits only, capped at 12 | M | | |
| VAL-005 | GWA range 0–100 | Academic step | Enter 999, letters, multiple dots | Cleaned to one decimal, 0–100 | M | | |
| VAL-006 | Max lengths on names/address/email | Any text field | Paste very long string | Capped at field max | L | | |
| VAL-007 | Whitespace-only blocked | Required text field | Enter only spaces | Treated as empty / rejected | M | | |
| VAL-008 | Student password policy | Sign-up | Try "1234567" / "abcdefgh" | Needs 8+ with letter & number | H | | |
| VAL-009 | Staff password policy | Create staff / change pw | Try a weak password | Needs 12+ with upper/lower/number/special | H | | |
| VAL-010 | Password confirm match | Sign-up / reset | Mismatch confirm | Blocked with error | M | | |
| VAL-011 | Double-click submit | Any submit button | Click submit twice fast | Button disabled while submitting; no duplicate record | H | | |
| VAL-012 | Special chars / emoji in names | Personal step | Enter ñ, ' , -, emoji | Stored/displayed correctly; no crash | M | | |
| VAL-013 | Unique section name per grade | Registrar, Sections | Create two sections same name/grade/year | Second rejected ("already exists") | H | | |
| VAL-014 | Section 45-student cap | Section near cap | Assign beyond 45 | Blocked with "room for N more" | H | | |
| VAL-015 | Duplicate SHS course | Admin, SHS Courses | Add two identical course names | Rejected ("must be unique") | M | | |

## 7. Registrar — Review & Enrollment (REG)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| REG-001 | Applications list loads | Registrar, apps exist | Open Applications | List with correct status badges; newest first | H | | |
| REG-002 | Open application details | — | Click an application | Full form + documents shown | H | | |
| REG-003 | Set Under Review | Submitted app | Mark under review | Status updates; student sees "Under Review" | M | | |
| REG-004 | Return for correction (+ email) | Submitted/under review | Return with note | Status needs_correction; note saved; student emailed | H | | |
| REG-005 | Reject (+ email) | Any reviewable app | Reject with note | Status rejected; student emailed | H | | |
| REG-006 | Enroll → issues student number | Reviewable app | Enroll | Status enrolled; unique student_no assigned; student emailed | H | | |
| REG-007 | Returnee keeps same number | Returning student | Enroll re-enrollment record | Reuses original student_no | M | | |
| REG-008 | Concurrent-enroll race | Two registrars | Enroll same/parallel apps | No duplicate student_no (unique index + retry) | M | | |
| REG-009 | Verify/reject a document | App with uploaded docs | Mark doc verified / needs re-upload | Status reflected; student can re-upload if rejected | M | | |
| REG-010 | Action buttons locked without MFA | Registrar, MFA off | Open Application Details | Mutations disabled with lock banner | H | | |

## 8. Sections (SEC)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| SEC-001 | Create section (non-SHS) | Registrar, MFA on | Create Grade 7 section | Created as draft; unique name enforced | H | | |
| SEC-002 | Create SHS section with strand | Registrar | Create Grade 11 section, pick strand | Strand required & saved; strand list from Admin | H | | |
| SEC-003 | Assign students (FCFS) | Enrolled students in grade | Assign to a section | Earliest-enrolled first; roster updates | M | | |
| SEC-004 | Strand-specific pool | SHS strand section | Open assignment pool | Only matching-strand (or unstranded) students shown | M | | |
| SEC-005 | Submit section to Admin | Draft section | Submit | Status pending | M | | |
| SEC-006 | Edit sends back to draft | Approved/pending section | Rename or change roster | Returns to draft; needs re-approval; roster flags cleared | M | | |
| SEC-007 | Admin approve section | Pending section | Section Approvals → approve | Status approved; classmates roster written to members | H | | |
| SEC-008 | Admin un-approve | Approved section | Un-approve | Back to pending; roster flag cleared on members | M | | |
| SEC-009 | Delete section | Draft section | Delete | Removed; members unassigned | L | | |

## 9. Student Records & Lifecycle (REC)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| REC-001 | Records list + filters | Enrolled/completed students | Open Student Records; filter by status | Correct filtered list; completed students remain visible | H | | |
| REC-002 | Student profile & history | Student with records | Open a student | Yearly records newest-first | M | | |
| REC-003 | Mark year completed | Enrolled student | Mark completed | Status completed; stays in records; re-enroll eligible | M | | |
| REC-004 | Deprovision (withdraw/graduate/archive) | Enrolled student | Set lifecycle | Login revoked; record + number kept (reversible) | M | | |
| REC-005 | Reactivate | Deprovisioned student | Reactivate | Back to enrolled; login restored | M | | |
| REC-006 | Bulk archive leftovers | Several completed | Bulk archive | All archived; audit logged | L | | |
| REC-007 | Re-enrollment flow (G10→11 strand) | Completed Grade 10 | Re-enroll | New record next grade/SY; strand required for Grade 11 | M | | |

## 10. Admin — Content Management (ADM)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| ADM-001 | Enrollment period toggle | Admin, MFA on | Edit Enrollment → toggle open/closed, dates → Save | Public Apply reflects open/closed + window | H | | |
| ADM-002 | Advance active school year | Admin | "Next year →" → Save | New applicants/sections filed under new S.Y. | M | | |
| ADM-003 | Announcements CRUD | Admin | Add/edit/delete announcement → Save | Shows in student portal; sorted newest first | M | | |
| ADM-004 | Edit contact info | Admin | Edit Contact → Save | Footer/Contact popup updated | M | | |
| ADM-005 | School events CRUD + image | Admin | Add event with image → publish | Public events updated; image uploads to site-images | M | | |
| ADM-006 | Executive board / schedule | Admin | Edit → Save | Public pages updated | L | | |
| ADM-007 | SHS Courses add/edit/delete | Admin, MFA on | SHS Courses → add/edit/remove → Save | List drives Apply/re-enroll/sections dropdowns | H | | |
| ADM-008 | SHS Courses reset to defaults | Admin | Reset to DepEd defaults → Save | List restored to defaults | L | | |
| ADM-009 | Content pages locked without MFA | Admin, MFA off | Open any Edit page | Save disabled + lock banner | H | | |
| ADM-010 | Finance Status (billing) read/update | Admin | Billing → update a record's payment status | Saved; student sees it read-only | M | | |

## 11. Head Admin — Accounts & Audit (HACC)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| HACC-001 | Create staff account | HeadAdmin, MFA on | New Account → fill → create | Account created as pending_profile with real role | H | | |
| HACC-002 | Role change (OTP step-up) | HeadAdmin | Change a user's role → OTP | Role updated after OTP; audit logged | H | | |
| HACC-003 | Reset a user's password (OTP) | HeadAdmin | Reset password → OTP → new pw | Password set (server policy enforced); audit logged | H | | |
| HACC-004 | Verify / disable account | HeadAdmin | Verify or disable a user | Status/disabled updated; disabled user can't log in | H | | |
| HACC-005 | Remove MFA (staff recovery) | HeadAdmin, target registrar/admin | Remove MFA → OTP → confirm | Target MFA cleared; audit logged | H | | |
| HACC-006 | Account actions locked without MFA | HeadAdmin, MFA off | Attempt any account action | Blocked (server-side) with message | H | | |
| HACC-007 | Audit log records actions | After several actions | Open Audit Log | Entries present (ENROLL, ROLE change, MFA_RESET, etc.) | M | | |
| HACC-008 | System usage page | HeadAdmin | Open System | Account/application/storage counts shown | L | | |

## 12. AI Chatbot (CHAT)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| CHAT-001 | Widget appears on applicant pages | Apply + Application Status | Open pages | Floating "Need help?" bubble visible | M | | |
| CHAT-002 | Open/close panel | — | Click bubble; click ✕ | Panel opens with greeting + suggestions; closes | M | | |
| CHAT-003 | Ask an in-scope FAQ | Chatbot deployed + credits | Ask "Anong requirements?" | Grounded, relevant answer | M | | |
| CHAT-004 | Current strands answer | Admin changed strands | Ask about SHS strands | Reflects current Admin list (via page context) | M | | |
| CHAT-005 | Off-topic handling | — | Ask unrelated question | Politely declines; points to Registrar | L | | |
| CHAT-006 | Graceful error | Credits missing / network off | Send a message | Friendly error message (no raw stack / silent fail) | M | | |
| CHAT-007 | No secrets exposed | — | Inspect network for chatbot call | Only anon key; Anthropic key never in browser | H | | |

## 13. Storage / File Uploads (STOR)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| STOR-001 | Upload each document type | Applicant at Documents | Upload PSA, Report Card, etc. | Saved; status "Uploaded" | H | | |
| STOR-002 | View own document (signed URL) | Uploaded doc | Click view | Opens via short-lived signed URL | M | | |
| STOR-003 | Re-upload after rejection | Doc marked needs re-upload | Upload a new file | Replaces; status back to uploaded | M | | |
| STOR-004 | File type restriction | Documents | Upload disallowed type (e.g. .exe) | Rejected / handled gracefully | M | | |
| STOR-005 | Large file handling | Documents | Upload very large file | Rejected or handled with clear message | M | | |
| STOR-006 | Cannot access another student's file | Student A | Try student B's file path / public URL | Denied (private bucket) | H | | |
| STOR-007 | Admin event image upload | Admin, School Events | Upload image | Lands in public site-images; URL works | L | | |

## 14. Error Handling & Network (ERR)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| ERR-001 | Offline banner | Logged in | Toggle offline (devtools) | Global banner "No internet connection…" appears | M | | |
| ERR-002 | Submit while offline | Offline | Try to save a form | Clear failure; no data loss; retry after reconnect | M | | |
| ERR-003 | Slow network | Throttle to Slow 3G | Load lists / submit | Loading states shown; no frozen UI | M | | |
| ERR-004 | Supabase/API error surfaced | Force an API error | Trigger a failing call | User-friendly message (not a raw error object) | M | | |
| ERR-005 | Edge Function down | e.g. chatbot/notify unavailable | Trigger it | Graceful message; core action still completes where possible | M | | |
| ERR-006 | Failed upload | Interrupt an upload | Upload then cancel/drop | Error shown; can retry | M | | |

## 15. UI / UX (UIUX)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| UIUX-001 | Sidebar navigation (each portal) | Logged in | Click every menu item | Correct page loads; active item highlighted | M | | |
| UIUX-002 | Loading skeletons | Any list/detail | Open while loading | Skeleton/placeholder, not blank/jank | M | | |
| UIUX-003 | Buttons disabled while submitting | Any submit | Submit | Button shows busy + disabled | M | | |
| UIUX-004 | Toasts / inline alerts | Save/success/error | Perform actions | "Saved ✓" / errors shown clearly | L | | |
| UIUX-005 | 404 / unknown route | — | Visit `/does-not-exist` | Friendly not-found or sensible redirect | M | | |
| UIUX-006 | Student MFA pagination | Admin, 100 students | Student MFA → Load more | Shows 20, loads next 20, counter correct | M | | |
| UIUX-007 | Student MFA grade filter | Admin | Filter by Grade 1–12 | Lists all grades; filters list; search combines | M | | |
| UIUX-008 | Favicon & title | Any page | Check browser tab | NSDGA seal + "NSDGA Enrollment Portal" | L | | |
| UIUX-009 | Back/forward navigation | Multi-page flow | Browser back/forward | State consistent; no broken view | L | | |

## 16. Responsive Design (RESP)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| RESP-001 | Mobile (375px) | — | View Login, Apply, dashboards | Usable; no horizontal scroll; sidebar collapses to menu | H | | |
| RESP-002 | Tablet (768px) | — | View key pages | Layout adapts correctly | M | | |
| RESP-003 | Desktop (1280px+) | — | View key pages | Full layout; sidebar fixed | M | | |
| RESP-004 | Chatbot on mobile | Applicant page, mobile | Open chatbot | Full-screen/!fit panel; input reachable | M | | |
| RESP-005 | Tables/lists on mobile | Records/Applications | View on mobile | Readable; scroll contained, not page-wide | M | | |
| RESP-006 | Modals on mobile | Any modal (Remove MFA) | Open on mobile | Fits screen; closable | M | | |

## 17. Cross-Browser (BROW)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| BROW-001 | Chrome | — | Smoke-test core flows | Works | H | | |
| BROW-002 | Firefox | — | Smoke-test core flows | Works | M | | |
| BROW-003 | Edge | — | Smoke-test core flows | Works | M | | |
| BROW-004 | Safari (desktop) | — | Smoke-test core flows | Works (check date inputs, MFA) | M | | |
| BROW-005 | Mobile Chrome/Safari | — | Smoke-test core flows | Works | M | | |

## 18. Accessibility (A11Y)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| A11Y-001 | Keyboard navigation | Any form | Tab through fields + submit with Enter | Logical order; all reachable | M | | |
| A11Y-002 | Visible focus states | — | Tab around | Clear focus ring on controls | M | | |
| A11Y-003 | Labels on inputs | Forms | Inspect inputs | Each field has a label / accessible name | M | | |
| A11Y-004 | Buttons have names | Icon buttons (chatbot, close) | Inspect | aria-label present | L | | |
| A11Y-005 | Color contrast | Maroon on white, grey text | Check key text | Meets ~AA contrast | L | | |
| A11Y-006 | Modal focus/escape | Any modal | Open modal | Focus trapped; Esc/overlay closes | L | | |

## 19. Security (SEC-X)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| SECX-001 | No secret keys in frontend | — | View source / bundle / network | Only Supabase anon (publishable) key; no service_role or Anthropic key | H | | |
| SECX-002 | Script injection in inputs | Any text field | Enter `<script>alert(1)</script>` | Stored/displayed as text; no execution | H | | |
| SECX-003 | No sensitive data in console/network | — | Inspect responses | No passwords/OTP/other users' PII leaked | H | | |
| SECX-004 | Direct API object access | Student token | Query other tables/ids | Denied by RLS | H | | |
| SECX-005 | Security headers / CSP | — | Check response headers (Vercel) | CSP, X-Frame-Options DENY, nosniff, HSTS present | M | | |
| SECX-006 | OTP brute-force limits | OTP flows | Many wrong attempts | Locked after 5; expiry enforced | H | | |
| SECX-007 | npm audit | Repo | Run `npm audit` | 0 (or triaged) vulnerabilities | M | | |
| SECX-008 | QR rendered safely | MFA enroll | Inspect QR render | Rendered as image, not dangerouslySetInnerHTML | M | | |

## 20. Performance (PERF)

| ID | Scenario | Preconditions | Steps | Expected | Priority | Status | Notes |
|----|----------|---------------|-------|----------|----------|--------|-------|
| PERF-001 | Initial load | Cold cache | Load site | Reasonable load; route code-splitting works (lazy chunks) | M | | |
| PERF-002 | Large list (100+ students) | Seeded data | Open Student Records / Student MFA | Renders without freeze; pagination helps | M | | |
| PERF-003 | Image sizes | Pages with images | Inspect | Images not oversized for their display | L | | |
| PERF-004 | Repeated navigation | — | Navigate around | No obvious memory leak / slowdown | L | | |

---

## 21. Smoke Test (run before every deployment)

The 15 most critical checks. If any **fails, do not deploy.**

| ID | Check | Expected | Status | Notes |
|----|-------|----------|--------|-------|
| SMK-01 | Site loads; Home + public pages render | No blank screen / console errors | | |
| SMK-02 | Student sign-up + OTP verify | Account created, application submitted | | |
| SMK-03 | Student login + session persists on refresh | Stays logged in | | |
| SMK-04 | Applicant sees ONLY their own application | No other student's data | | |
| SMK-05 | Registrar login → Applications list loads | Correct data + statuses | | |
| SMK-06 | Registrar enrolls an applicant | Status enrolled + student number issued | | |
| SMK-07 | Enrolled student portal unlocks (Dashboard) | Access granted post-enroll | | |
| SMK-08 | Admin toggles enrollment open/closed | Apply reflects the change | | |
| SMK-09 | SHS strand dropdown shows current Admin list | HT/IT/CP/TECHPRO (or configured) | | |
| SMK-10 | Create + submit + approve a section | Flows draft→pending→approved | | |
| SMK-11 | MFA login step-up works | Prompts + accepts valid code | | |
| SMK-12 | MFA-off gate locks staff mutations | Lock banner + disabled actions | | |
| SMK-13 | Logged-out user blocked from protected routes | Redirected to login | | |
| SMK-14 | Document upload + view (own) | Uploads; signed-URL view works | | |
| SMK-15 | No secret keys / no cross-user data in network tab | Only anon key; RLS holds | | |

---

*Legend — Status: P = Pass · F = Fail · B = Blocked. Priority: H/M/L. Fill Status + Notes as you run each case.*
