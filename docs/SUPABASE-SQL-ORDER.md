# Supabase SQL setup order

The SQL files directly under `supabase/` are the deployment source of truth.
Run them in dependency order; do not run deleted migration copies or historical
one-purpose scripts.

1. `schema.sql` — profiles, audit log, auth trigger, profile security, and
   trusted audit logging.
2. `students.sql` — applications, lifecycle statuses, billing, OTP records,
   application indexes, and application security.
3. `sections.sql` — sections, status/strand columns, indexes, and section limits.
4. `presence.sql` — presence table and policies.
5. `student-docs.sql` — private storage bucket and document policies.
6. `harden-site-content.sql` — site content table and policies.
7. `account-limits.sql` — profile account-limit trigger; requires
   `harden-site-content.sql`.
8. `activity-history.sql` — self-service audit-log read policy.
9. `chatbot-ratelimit.sql` — chatbot rate-limit table and function.
10. `remove-mfa.sql` — service-role-only MFA recovery function.
11. `harden-production.sql` — production cleanup; run after development seed
    data is no longer needed.

Development-only data scripts:

- `seed.sql` creates demo staff accounts and must not be used in production.
- `seed-students.sql` creates test students and must not be used in production.
