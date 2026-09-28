# NSDGA Enrollment Portal — Manual Test Checklist (v2, detailed)

**Tester:** ______________________  **Date:** ____________  **Build/Commit:** ____________
**Environment:** ☐ Local (localhost:5173)  ☐ Production (Vercel)  **Device:** ☐ Desktop  ☐ Mobile

**Paano gamitin:** Tsekan (`[x]`) kapag PASADO. Isulat sa **Notes** ang anumang mali. Legend: ✅ pass · ❌ fail · ⚠️ minor.

> **Bago magsimula — mga test account na kailangan:**
> - 1 bagong applicant (walang account pa)
> - 1 applicant na naka-**submitted** (pending review)
> - 1 student na naka-**enrolled**
> - 1 student na **completed** (para sa re-enrollment)
> - 1 Registrar, 1 Admin, 1 Head Admin
> - Isang authenticator app (Google Authenticator / Authy) para sa MFA tests.

---

## A. Landing / Public Pages (walang login)

- [ ] **Home** (`/Home`) bumukas; kumpleto ang nav, logo, larawan (walang sirang image).
- [ ] **Browser tab** — icon = NSDGA seal; title = "NSDGA Enrollment Portal".
- [ ] **SHS Online / SHS On-Campus** pages bumukas.
- [ ] **Kindergarten** page bumukas.
- [ ] **Elementary On-Campus / Online** pages bumukas.
- [ ] **JHS On-Campus / Online** pages bumukas.
- [ ] **Calendar** — nakikita ang published events (galing Admin).
- [ ] **About** page bumukas.
- [ ] **Footer / Contact** — tama ang email, mobile, office hours, FB link.
- [ ] **Enrollment status** — kapag CLOSED, may closed message; kapag OPEN, pwede mag-apply.
- [ ] **Announcements** — lumalabas ang inilagay ng Admin.
- [ ] **Unknown URL** (hal. `/xyz`) → babalik sa Home.
- [ ] **Mobile:** maayos ang nav (hamburger), walang horizontal scroll.

**Notes:** ______________________________________________________________

---

## B. Signup / Apply Wizard (account-first, 6 steps)

- [ ] **Admission CLOSED** → hindi makakapag-apply; may closed message.
- [ ] **Step 1 — Account validations:**
  - [ ] Kulang na pangalan → error.
  - [ ] Walang LRN at di naka-check ang "No LRN yet" → error.
  - [ ] LRN na di 12-digit → error.
  - [ ] Maling email format → error.
  - [ ] **Password policy (student):** wala pang 8 char, o walang letra/numero → error, at kitang-kita ang checklist (✓).
  - [ ] Di magkatugma ang password/confirm → error.
  - [ ] Di naka-agree sa Terms → error.
  - [ ] Tamang lahat → **nagawa ang account + naka-sign in** (tuloy sa Step 2).
  - [ ] Duplicate email → malinaw na error.
- [ ] **Step 2 — Personal + Guardian** — required fields enforced.
- [ ] **Step 3 — Grade & Type** — SHS (G11/12) **kailangan ng strand**; Grade 1 walang GWA/Form 137 required.
- [ ] **Step 4 — Academic** — required (naka-adjust sa Grade 1).
- [ ] **Step 5 — Documents** — upload OK; tama ang required docs kada grade; >5MB tinatanggihan; JPG/PNG/PDF lang.
- [ ] **Step 6 — Review** — tama ang buod.
- [ ] **Submit → OTP** — may 6-digit code sa email.
- [ ] **Verify OTP:** maling code → error; expired → error+resend; **resend throttle 30s**; tamang code → **submitted**.
- [ ] **Draft resume** — logout mid-wizard, login → bumalik kung saan tumigil.
- [ ] **Autosave:** mag-type, **i-close ang tab / putulin ang net**, buksan ulit → **nabalik ang tina-type** (pero HINDI ang password).
- [ ] **Offline banner** — putulin ang internet → lumabas ang banner (English).

**Notes:** ______________________________________________________________

---

## C. Student — Login & Account Access

- [ ] Tamang email/password → pumasok.
- [ ] Maling password → "Invalid email or password."
- [ ] **Staff account sa Student login** → tinanggihan.
- [ ] **Disabled** account → naka-block.
- [ ] **Deprovisioned** (withdrawn/graduated/archived) → "account is inactive."
- [ ] **Forgot Password:** email → OTP → bagong password (maling/expired code → error); nakapag-login na gamit ang bago.
- [ ] **Password policy (student)** sa Forgot-password (CreateNewPass) at Settings → change password.
- [ ] **Applicant access gating (hindi pa enrolled):**
  - [ ] Sidebar = **"Applicant Portal"** (2 items).
  - [ ] Ma-access lang ang **Application Status** at **Enrollment Form**.
  - [ ] Pumunta sa `/StudentPortal/Dashboard` o `/Documents` → **redirect** sa Application Status.
- [ ] **Application Status** — tama ang status + review note; tama ang progress tracker.
- [ ] **Needs Correction:** i-click ang **"Update & Resubmit"** → **bumukas ang Enrollment Form** (HINDI mag-glitch/bounce sa login).
- [ ] Sa Enrollment Form: **ma-edit + maka-re-upload** ng docs → **Save & Resubmit**.
- [ ] Pagkatapos mag-resubmit → status ipinapakita bilang **"Under Review"** (hindi "Submitted").

**Notes:** ______________________________________________________________

---

## D. Student — 2FA (Two-Factor Authentication) — BAGO

- [ ] **Settings → Two-Factor Authentication** card nakikita; status **OFF**.
- [ ] **Turn On 2FA** → may QR + secret key.
- [ ] I-scan sa authenticator app → i-type ang 6-digit code → **"Verify & Turn On"** → status **ON**.
- [ ] **Mag-logout, mag-login ulit** → may **"Two-Factor Verification"** step; maling code → error; tamang code → pumasok.
- [ ] **Turn Off** → may confirm → status **OFF**; sa susunod na login, walang code step na.

**Notes:** ______________________________________________________________

---

## E. Student — Enrolled Portal (pagkatapos i-enroll)

- [ ] Sidebar = **"Student Portal"** (kumpletong menu).
- [ ] **Dashboard** — tama ang Current Status, Student Number, Grade/Program.
- [ ] **Announcements** lumalabas.
- [ ] **Tuition Status card** — status + OR number + voucher note; **walang halaga ng pera**.
- [ ] **My Class** — lumalabas ang section + classmates **kapag na-approve ng Admin**.
- [ ] **Documents / Profile / Notifications** — bumukas nang tama.
- [ ] **Mobile:** maayos lahat (cards, walang overflow).

**Notes:** ______________________________________________________________

---

## F. Student — Re-enrollment (completed → next year)

- [ ] Bilang **completed** student + **bukas** ang season → lumabas ang re-enroll prompt.
- [ ] **Grade 10 → 11:** kailangang **pumili ng strand** bago mag-re-enroll.
- [ ] **Grade 11 → 12:** dala na ang strand (walang bagong pili).
- [ ] Pagka-click ng Re-enroll → **nanatili sa full portal** + "**Re-enrollment under review**" banner (HINDI bumalik sa applicant view).
- [ ] Season **closed** → may "opens when the school announces…" na paalala.
- [ ] **Returnee number** — pagka-enroll ulit ng registrar, **pareho** ang student number.

**Notes:** ______________________________________________________________

---

## G. Registrar Portal

- [ ] Login (verified) → Dashboard; **MFA reminder banner** lumalabas kung OFF ang 2FA.
- [ ] **Applications:** search (name/LRN/grade); filters kasama **"Resubmitted (re-review)"**; buksan ang detalye.
- [ ] **Application detail:** Mark Under Review; **Return for Correction** (may email); **Reject** (may email); **Approve & Enroll** (may Student No.; returnee = dating no.).
- [ ] **Documents:** filters kasama **"Enrolled - Incomplete"**; View / Verify / Reject ng doc.
- [ ] **Student Records:** filters Enrolled / **Completed** / Withdrawn / Graduated / Archived / All; search.
  - [ ] **Bulk archive:** piliin ang completed leftover → Archive; **hindi kasama** ang mga nag-re-enroll na.
- [ ] **Student Profile (Lifecycle):** Mark Year Completed; Graduate; Withdraw; Archive; **Reactivate**; **Re-admit** (bagong grade).
  - [ ] Pagka-**Mark Completed**, **hindi nawawala** sa Student Records (nasa Completed filter).
- [ ] **Sections:**
  - [ ] Gumawa — **bawal parehong pangalan** sa iisang grade.
  - [ ] **Cap 45** — di makakalampas.
  - [ ] **SHS (G11/12):** kailangan ng **strand**; STEM section → STEM students lang sa pool.
  - [ ] Assign students — **first-come, first-served**.
  - [ ] **Edit/rename** → babalik sa DRAFT; **Submit to Admin** → PENDING.
- [ ] **Settings → Change Password** — **staff policy (12 + complexity)** enforced.
- [ ] **Settings → Two-Factor Authentication** — pwedeng i-enable/disable.
- [ ] **My Profile** bumukas; **Logout** OK.

**Notes:** ______________________________________________________________

---

## H. Admin Portal

- [ ] Login (verified) → Dashboard; **MFA reminder** kung OFF ang 2FA.
- [ ] **Section Approvals:** DRAFT (di ma-approve); PENDING → **Approve** (nailabas ang roster); APPROVED → **Unapprove**; **strand** badge sa SHS; **Print class list** + **Print grade master list**.
- [ ] **Finance Status:** listahan ng enrolled (walang pera, status lang); **Edit** status/OR/remarks; voucher tag; **Export** CSV; **Import** CSV (match by Student No.); search/year/status filters.
- [ ] **Content editors:** Contact; School Events (→ lumabas sa Calendar); Executive Board; Academic Sched.
- [ ] **Edit Enrollment:** open/close; announcements; **Active School Year**; **"Next year →"** button (may confirm).
- [ ] **Settings → Change Password (staff policy)** + **2FA enable/disable**.
- [ ] **Logout** OK.

**Notes:** ______________________________________________________________

---

## I. Head Admin Portal

- [ ] Login → Accounts; **MFA reminder** kung OFF ang 2FA.
- [ ] **Accounts list** — staff + role badges + online status.
- [ ] **Create Staff:** **bawal mahinang password** (staff policy enforced); pagkatapos gawin →
  - [ ] Mag-login gamit ang bagong staff → **dumaan sa Profile Setup** (HINDI diretso dashboard).
  - [ ] Sa Profile Setup, **staff password policy** (12 + complexity) enforced (may checklist).
  - [ ] Balik sa Head Admin → account = **pending verification**, may **Verify** button.
- [ ] **Role change with OTP:** pumili ng bagong role → **Send code** → maling code → error → tamang code → napalitan.
- [ ] **Reset Password (BAGO):** Manage staff → **Reset Password** → mag-type ng malakas na password (may checklist) → **Reset password** → OTP sa email → **Confirm reset**.
  - [ ] I-test: mag-login ang staff gamit ang bagong password.
  - [ ] **Sariling account:** walang Reset Password section (gamit ang Settings).
- [ ] **Promote to Head Admin** (2+ headadmin allowed).
- [ ] **Enable / Disable** account; **Verify** pending.
- [ ] **Self-guards:** di mababago ang sariling role o ma-disable ang sarili.
- [ ] **Audit Log:** naka-log ang login, enroll, role change, **PASSWORD_RESET**, bulk archive, atbp.; may petsa/oras.
- [ ] **Reports / System Usage** — tama ang datos.
- [ ] **Settings → Change Password + 2FA**.
- [ ] **Mobile:** hindi natatakpan ng hamburger ang title; maayos ang tables (cards).

**Notes:** ______________________________________________________________

---

## J. Password Policy (i-verify sa bawat lugar) — BAGO

- [ ] **Student min 8 + letra & numero** → signup, forgot-password, student Settings.
- [ ] **Staff min 12 + upper/lower/number/special** → Create Staff, staff Profile Setup, staff Change Password, Head Admin Reset Password.
- [ ] **Live checklist** (✓) tumutugma sa tina-type sa lahat ng lugar.
- [ ] Hindi tinatanggap ang mahinang password (di lang UI — di talaga makaka-save).

**Notes:** ______________________________________________________________

---

## K. Cross-Cutting / Security

- [ ] **Offline banner** (English) — putulin ang net sa kahit anong page → lumalabas; bumalik → nawala.
- [ ] **Mobile responsive** — Student, Registrar, Admin, Head Admin (tables → cards, walang overflow).
- [ ] **Wrong-portal login** — student sa staff login (o kabaliktaran) → tinanggihan.
- [ ] **Route guards** — mag-login sa isang role, subukang buksan ang URL ng ibang role → redirect/hindi pinayagan.
- [ ] **Session persistence** — i-refresh → naka-login pa rin.
- [ ] **Logout** — di na ma-access ang protected pages.
- [ ] **Private documents** — signed URL lang, may expiry; di ma-access ang docs ng iba.
- [ ] **MFA reminder** — nawawala kapag na-enable na ang 2FA.

**Notes:** ______________________________________________________________

---

## Summary

| Area | Pass | Fail | Notes |
|---|---|---|---|
| A. Public pages | | | |
| B. Signup / Apply | | | |
| C. Student login/access | | | |
| D. Student 2FA | | | |
| E. Enrolled portal | | | |
| F. Re-enrollment | | | |
| G. Registrar | | | |
| H. Admin | | | |
| I. Head Admin | | | |
| J. Password policy | | | |
| K. Cross-cutting | | | |

**Overall:** ☐ All pass  ☐ Minor issues  ☐ Blocking issues

**Bugs/issues found:**
1. ______________________________________________________________
2. ______________________________________________________________
3. ______________________________________________________________
4. ______________________________________________________________
5. ______________________________________________________________

---
*Reminder bago mag-production: i-drop ang `demo_password`, tanggalin ang seed-test-data function, i-run lahat ng SQL migrations (kasama `sections3.sql`), i-deploy lahat ng edge functions (kasama `admin-set-password`, `create-staff`), at gumamit ng dedicated production Supabase project + DB backups.*
