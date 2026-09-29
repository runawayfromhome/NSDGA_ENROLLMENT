# NSDGA Enrollment Security Audit

## Executive Summary

The application has a solid Supabase/RLS foundation, but its current posture is **High risk** if all repository SQL and Edge Functions are deployed as-is. The most serious issues are optional MFA, insufficient server-side role/status enforcement, public service-role-backed endpoints without rate limiting, production demo credentials, and vulnerable transitive dependencies.

## Technology Stack

### Frontend

- **Framework:** React 19
- **Build tool and development server:** Vite 8
- **Routing:** React Router 7
- **Styling:** Tailwind CSS 4 and DaisyUI
- **Icons:** React Icons
- **Language:** JavaScript and JSX
- **Application responsibilities:** Public school pages, student portal, registrar portal, admin portal, HeadAdmin portal, forms, dashboards, document workflows, billing records, and client-side session handling.

### Backend and Platform Services

- **Backend platform:** Supabase
- **Authentication:** Supabase Auth with email/password authentication, password recovery, session refresh, and optional TOTP MFA
- **Database:** Supabase PostgreSQL
- **Server-side API logic:** Supabase Edge Functions running on Deno
- **File storage:** Supabase Storage
- **Transactional email:** Brevo, called by the `notify` Edge Function
- **Hosting and deployment:** Vercel, with SPA routing configured through `vercel.json`

### Database and Security Controls

- **Primary tables:** `profiles`, `applications`, `audit_log`, `presence`, and `sections`
- **Security model:** PostgreSQL Row-Level Security policies
- **Database authorization helpers:** `is_headadmin()` and `is_staff()` security-definer functions
- **Database enforcement:** PostgreSQL triggers protect profile roles, account status, student numbers, application status, and billing fields
- **Private documents:** Student documents use a private storage bucket and short-lived signed URLs
- **Public content:** Site content and public images are managed through Supabase tables and storage

### Edge Functions

- **`create-applicant`:** Public applicant account and application creation
- **`create-staff`:** HeadAdmin-controlled staff account creation using the service role
- **`notify`:** Staff-triggered transactional email delivery through Brevo
- **`seed-test-data`:** Development/test data creation and destructive cleanup utility

### Dependency and Project Tooling

- **Package manager:** npm
- **Dependency manifest:** `package.json`
- **Dependency lockfile:** `package-lock.json`
- **Linting:** ESLint 10 with React and React Hooks plugins
- **Build command:** `npm run build`
- **Lint command:** `npm run lint`

### High-Level Request Flow

1. The React/Vite frontend authenticates users through Supabase Auth.
2. The frontend uses the Supabase anonymous client key to call PostgreSQL tables, storage, and Edge Functions.
3. PostgreSQL RLS policies and triggers authorize direct data access.
4. Edge Functions perform operations that require service-role access or external integrations.
5. Supabase Storage holds uploaded documents and images.
6. Vercel serves the frontend application and routes client-side paths back to the SPA entry point.

## Critical & High Severity Findings

| Location (File/Module) | Vulnerability Type | Description | Plain-Text Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| `supabase/schema.sql` | Privilege escalation | The new-user trigger initially trusts client-supplied role metadata. If the hardening logic from the seed script is not deployed, a public signup could request a privileged role. The HeadAdmin helper also checks role without requiring verified status. | Always assign the lowest-privilege role server-side and require verified, enabled accounts for privileged helpers. |
| `supabase/students.sql` and Edge Functions | Broken access control | Staff checks require a staff role and verification, but do not check the disabled flag. Disabled staff can retain direct database and function access while their client UI appears blocked. | Include enabled-account checks in every RLS helper and privileged function authorization decision. |
| `src/auth/authStore.js` and `src/contexts/SessionProvider.jsx` | Authentication weakness | MFA is currently optional for all roles, and a browser session flag can bypass required MFA enrollment. Administrative accounts can therefore operate with password-only authentication. | Enforce MFA server-side for administrative roles and remove the browser-controlled bypass before production. |
| `supabase/functions/create-applicant/index.ts` | Abuse and resource exhaustion | This public endpoint creates confirmed accounts using the service role, with no rate limiting, CAPTCHA, request-size limit, duplicate-abuse controls, or meaningful field validation. | Add edge rate limits, bot protection, strict schema validation, abuse monitoring, and bounded request sizes. |
| `supabase/functions/notify/index.ts` | Privilege abuse and email injection | Any staff role can send arbitrary HTML to an arbitrary direct recipient. User-controlled names and notes are interpolated into email HTML without context-aware escaping. | Resolve recipients only from authorized records, restrict templates and recipients, escape all dynamic content, and audit every send. |
| `supabase/seed.sql` | Credential exposure | The seed script creates predictable demo passwords and stores plaintext passwords in a profile column. This is dangerous if the script or resulting data reaches production. | Remove demo credentials and plaintext password storage before deployment; rotate any accounts created from this script. |
| `supabase/functions/seed-test-data/index.ts` | Destructive administrative endpoint | The function can delete all student accounts and records. It is documented as test-only but remains deployable and uses a hardcoded test password. | Remove it from production entirely, or isolate it in a separate non-production project with independent credentials. |
| `supabase/students.sql` | Excessive authorization | The shared staff helper grants registrar, admin, and HeadAdmin broad read/write access to applications, sections, documents, lifecycle fields, and billing. UI route restrictions are not a sufficient security boundary. | Define permissions by role and operation in database policies or controlled server functions. |
| `package-lock.json` and `package.json` | Dependency vulnerabilities | Production dependency audit reports high-severity vulnerabilities in `nanoid` and React Router, plus a moderate PostCSS issue. | Update affected direct or transitive packages, regenerate the lockfile, and add dependency scanning to CI. |

## Medium Severity Findings

| Location (File/Module) | Vulnerability Type | Description | Plain-Text Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| `supabase/schema.sql` and `supabase/harden_audit.sql` | Audit-log integrity | The base schema permits anonymous arbitrary audit inserts. The separate hardening script restricts inserts but still allows authenticated users to submit fabricated actions and results for their own email. | Enforce audit creation through trusted server-side actions and make audit records append-only and tamper-evident. |
| `src/lib/registrar.js` | Race condition | Student numbers are calculated by reading the current maximum and adding one. Concurrent enrollments can receive duplicate numbers, and the database does not visibly enforce uniqueness. | Generate identifiers transactionally and add a database uniqueness constraint. |
| `src/lib/student.js` and `src/components/pages/StudentPortal/Documents.jsx` | Unsafe file upload | File size and type checks are primarily client-side. An attacker can bypass them and upload oversized or malicious content while controlling the filename extension and MIME type. | Enforce size, MIME, extension, malware, and content-signature validation at the storage or server boundary. |
| `supabase/functions/create-applicant/index.ts` and other functions | Information disclosure | Public handlers return provider/database error messages and stringify unexpected exceptions. These may reveal account existence, schema details, or operational information. | Return generic public errors and retain detailed diagnostics only in protected server logs. |
| Supabase Edge Functions | CORS misconfiguration | Privileged functions use wildcard origins, including staff-account creation, notifications, and test-data operations. | Restrict origins to the deployed application and avoid broad cross-origin access for privileged endpoints. |
| `vercel.json` | Missing security headers | The deployment configuration only defines a rewrite. HSTS, Content Security Policy, clickjacking protection, and MIME-sniffing protection are not evident. | Add security headers at the hosting or edge layer and validate them in deployment checks. |
| `supabase/functions/create-applicant/index.ts` and authentication flows | Missing abuse controls | Public application creation and authentication-related flows have no application-level throttling or suspicious-activity controls visible in the repository. | Add rate limits, progressive delays, monitoring, and alerting for repeated failures and automated submissions. |
| `src/lib/registrar.js` | HTML content injection | Review notes and applicant data are inserted into notification HTML. This can produce malformed or deceptive email content even if it does not execute in the application browser. | Use fixed templates with escaped values and prohibit arbitrary HTML supplied by staff. |

## Low Severity / Best Practice Observations

- `.env.local` is ignored by `.gitignore`, and the frontend exposes only the expected public Supabase URL and anonymous key. Keep service-role and email-provider secrets exclusively in Edge Function secrets.
- No Dockerfile or Kubernetes manifests were found, so container and cluster hardening could not be assessed.
- Failed-login logging is fire-and-forget and may fail silently after audit hardening, reducing forensic visibility.
- Audit records contain personal information such as names and email addresses; define retention, access, and export controls.
- CSV exports contain student and financial information and should be treated as sensitive local data.
- Storage filenames and folder paths should be normalized server-side, even though the current folder policy limits access by user ID.
- The MFA QR rendering path uses raw HTML insertion; it currently appears to consume provider-generated QR markup, but this should remain tightly constrained and never accept arbitrary user content.

## Strengths

- Student documents are stored in a private bucket and accessed through short-lived signed URLs.
- Row-level policies generally restrict student records to the owning student and staff records to authorized staff roles.
- Student-side protections prevent direct changes to billing, student numbers, and most enrollment status transitions.
- Service-role credentials are not present in frontend source files.
- Login responses generally avoid returning raw authentication failure details to users.
- React’s normal rendering path escapes displayed user content, and no broad application use of raw HTML rendering was found.
- Passwords are delegated to Supabase Auth rather than stored in application tables, apart from the unsafe development-only seed column.

## Audit Scope and Limitations

This was a repository-based, read-only audit. Supabase project settings, deployed function configuration, live RLS state, provider dashboards, production logs, and infrastructure outside the repository were not independently verified.

The dependency check reported four production dependency issues: three high severity and one moderate severity. The audit command used the committed lockfile and omitted development dependencies.
