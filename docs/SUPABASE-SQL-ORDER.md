# Supabase SQL setup order

## Single-file setup

If you prefer to use one query in the Supabase SQL Editor, run
[`supabase/all-migrations.sql`](../supabase/all-migrations.sql). It contains
the timestamped migrations below in dependency order.

The timestamped files in `supabase/migrations/` remain the source for Supabase
CLI migration history. Do not run both the bundle and the timestamped files
against the same database.

The bundle contains schema and security migrations only. Demo seed scripts are
kept separately under `supabase/seed/`, require session-supplied passwords,
and are never run by `supabase db push`. The production hardening step is
included in the bundle.

After applying the migrations, deploy the failed-login logging function with:

```powershell
supabase functions deploy log-event
```

## Individual files

The SQL files directly under `supabase/` document the individual deployment
steps. Run them in dependency order; do not run deleted migration copies or
historical one-purpose scripts.

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

Development-only data scripts are documented in
[`supabase/seed/README.md`](../supabase/seed/README.md).
