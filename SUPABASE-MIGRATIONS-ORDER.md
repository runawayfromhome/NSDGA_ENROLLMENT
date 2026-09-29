# Supabase Migration Order

Run or push the migrations in this dependency order.

## Recommended Order

1. `20260924005805_schema.sql`
   - Creates `profiles`, `audit_log`, the initial auth trigger, RLS policies, and `is_headadmin()`.

2. `20260924010124_students.sql`
   - Defines the student profile trigger, `is_staff()`, and creates `applications`.

3. `20260924005741_lifecycle2.sql`
   - Adds the supported application lifecycle statuses, including `completed`.

4. `20260924005814_sections.sql`
   - Creates the `sections` table and its RLS policy.

5. `20260924005824_sections2.sql`
   - Adds the section `status` column.

6. `20260924005747_presence.sql`
   - Creates the `presence` table and access policies.

7. `20260924005757_readmit.sql`
   - Allows verified staff to create applications for returning students.

8. `20260924010114_student-docs.sql`
   - Creates the private student document bucket and storage policies.

9. `20260921080858_billing.sql`
   - Adds billing data to `applications` and protects billing fields from student edits.

10. `20260924005652_harden_audit.sql`
    - Removes anonymous audit inserts and restricts audit inserts to the authenticated user's email.

## Do Not Run

### `20260924005735_lifecycle.sql`

Do not run this together with `20260924005741_lifecycle2.sql`. The second file replaces it and also includes the `completed` status.

### `20260924005835_seed.sql`

Development/test use only. Do not push to production because it:

- Creates predictable demo passwords.
- Stores plaintext passwords in `demo_password`.
- Deletes and recreates demo accounts.
- Directly inserts records into Supabase Auth tables.

### Root-Level SQL Files

The SQL files directly under `supabase/` are reference/source scripts. Do not push both those files and the migration copies. Use the migration files as the deployment source of truth.

## Important Timestamp Warning

Supabase applies migration files by filename timestamp. The current filenames do not reflect the dependency order. In particular, `20260921080858_billing.sql` sorts before the migration that creates `public.applications`.

For a fresh database, rename migrations so their timestamps follow the order above, or apply them manually in this dependency order.

## Dependency Chain

`schema` -> `students/applications` -> `lifecycle, sections, presence, readmit, student-docs, billing` -> `audit hardening`

## Current Error Explanation

The error that says `relation "public.applications" does not exist` occurs because the billing migration runs before `20260924010124_students.sql`, which creates the `applications` table.
