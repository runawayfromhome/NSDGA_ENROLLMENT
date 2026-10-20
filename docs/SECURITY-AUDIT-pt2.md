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
- **Authentication:** Supabase Auth with email/password authentication, password recovery, and optional TOTP MFA
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

## High-Level Request Flow

1. The React/Vite frontend authenticates users through Supabase Auth.
2. The React client uses the Supabase anonymous key to call PostgreSQL tables, storage, and Edge Functions.
3. PostgreSQL RLS policies and triggers authorize direct data access.
4. Edge Functions perform operations that require service-role access or external integrations.
5. Supabase Storage holds uploaded documents and images.
6. Vercel serves the frontend application and routes client-side paths back to the SPA entry point.

## Critical & High Severity Findings

| Location | Vulnerability Type | Description | Recommended Mitigation |
| :--- | :--- | :--- | :--- |
| `src/auth/authStore.js`, `src/contexts/SessionProvider.jsx` | Weak MFA enforcement | MFA is optional for every role, and a browser-controlled session flag can bypass the MFA enrollment gate. | Require MFA for administrative roles using server-side enforcement and remove the bypass before production. |
| `supabase/students.sql`, `supabase/functions/*.ts` | Broken access control | Staff authorization checks do not consistently reject disabled accounts. | Require `disabled = false` in every RLS helper and Edge Function authorization check. |
| `supabase/functions/create-applicant/index.ts` | Public abuse exposure | A public service-role-backed endpoint creates confirmed accounts without rate limiting, CAPTCHA, request-size limits, or strict schema validation. | Add edge rate limiting, bot protection, bounded payloads, strict validation, duplicate controls, and monitoring. |
| `supabase/functions/notify/index.ts` | Email injection and privilege abuse | Staff can provide arbitrary recipients and HTML content. Dynamic user data is interpolated without HTML escaping. | Use fixed server-side templates, resolve recipients only from authorized records, escape dynamic values, and audit sends. |
| `supabase/functions/seed-test-data/index.ts` | Destructive production endpoint | The deployed function can delete all student accounts and records. | Remove it from production or isolate it in a separate non-production Supabase project. |
| `supabase/seed.sql` | Credential exposure | Demo accounts use predictable passwords. | Remove demo credentials before production and rotate any accounts created from the seed. |
| `supabase/students.sql` | Excessive authorization | The common staff role grants broad access across applications, documents, lifecycle data, and billing. | Split policies by role and operation, or route sensitive mutations through controlled server functions. |
| `package.json`, `package-lock.json` | Dependency risk | The existing audit reports vulnerable production transitive dependencies. | Run `npm audit --omit=dev`, update affected packages, regenerate the lockfile, and add CI scanning. |

## Medium Severity Findings

| Location | Vulnerability Type | Description | Recommended Mitigation |
| :--- | :--- | :--- | :--- |
| `supabase/schema.sql` | Audit-log integrity | Audit creation is centralized in `log_event()` and direct client inserts are revoked. | Keep audit creation server-side, append-only, and tamper-evident. |
| `src/lib/registrar.js` | Race condition | Student numbers are generated by reading the current maximum and adding one. Concurrent enrollments can collide. | Use a database sequence or transactional RPC and enforce a unique constraint. |
| `src/lib/student.js`, `supabase/student-docs.sql` | Unsafe file uploads | Extension, MIME type, and size are primarily client-controlled. | Enforce limits server-side, validate content signatures, normalize names, and scan uploads where practical. |
| `supabase/functions/*.ts` | Information disclosure | Functions return provider/database errors and stringified exceptions directly to callers. | Return generic public errors and log detailed diagnostics privately. |
| `supabase/functions/*.ts` | CORS and method exposure | Functions use wildcard CORS and do not explicitly reject methods other than `POST`. | Restrict allowed origins and accept only required HTTP methods. |
| `vercel.json` | Missing security headers | HSTS, CSP, clickjacking protection, MIME-sniffing protection, and referrer policy are not configured. | Add and test security headers at the Vercel edge layer. |
| `src/components/MfaSettings.jsx`, `src/components/pages/StaffProfile/MfaSetup.jsx` | Raw HTML sink | QR markup is rendered with `dangerouslySetInnerHTML`. | Prefer a trusted image/data URL or sanitize and tightly validate the provider output. |
| JSON form fields | Mass assignment | Client-provided JSON objects such as `form`, `profile`, `documents`, and `billing` are stored without per-field allowlists or schema validation. | Validate each object with a strict schema and explicitly permit fields. |

## Controls That Appear Present

- Supabase Auth handles password hashing.
- Service-role credentials are not present in frontend source files.
- Student applications and storage objects have ownership-based RLS.
- Student documents are stored in a private bucket.
- Application redirects found in source use fixed internal paths.
- Database access uses Supabase query builders rather than client-side raw SQL.
- A lockfile is committed.
- Normal React rendering escapes displayed content.

## Items Requiring Deployment Verification

- JWT issuer, audience, algorithm, and expiry configuration.
- Supabase Auth rate limits and password-reset settings.
- MFA enforcement at the Supabase project level.
- Realtime authorization and subscription limits.
- Actual deployed migration state and policy ordering.
- Storage bucket configuration in production.
- Vercel preview deployment protection and environment-variable scope.
- Current dependency advisories from `npm audit`.

## Recommended Remediation Order

1. Remove or isolate `seed-test-data` and delete plaintext demo-password storage.
2. Enforce disabled-account checks in `is_staff()`, `is_headadmin()`, RLS policies, and Edge Functions.
3. Require MFA for HeadAdmin and Admin accounts; remove the browser bypass.
4. Lock down `notify` to fixed templates and authorized student recipients.
5. Add schemas, payload limits, rate limiting, and generic errors to every Edge Function.
6. Add transactional student-number generation and a unique database constraint.
7. Enforce upload validation beyond the client.
8. Add Vercel security headers and dependency scanning in CI.

## Audit Scope and Limitations

This is a repository-based audit. Supabase project settings, deployed function configuration, live RLS state, provider dashboards, production logs, and infrastructure outside the repository require independent verification.
