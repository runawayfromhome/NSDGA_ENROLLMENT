# NSDGA Enrollment Entity-Relationship Diagram

This diagram represents the database structure defined by the Supabase
canonical SQL files in [`supabase/`](../supabase/). It includes
the Supabase-managed `auth.users` and `storage.objects` entities because
application records and uploaded documents depend on them.

```mermaid
erDiagram
    AUTH_USERS ||--o| PROFILES : "has profile"
    AUTH_USERS ||--o{ APPLICATIONS : "submits"
    AUTH_USERS ||--o{ APPLICATIONS : "reviews"
    AUTH_USERS ||--o| OTP_CODES : "has verification code"
    AUTH_USERS ||--o| PRESENCE : "has presence"
    AUTH_USERS ||--o{ STORAGE_OBJECTS : "owns document folder"

    AUTH_USERS {
        uuid id PK
        text email
        timestamptz created_at
    }

    PROFILES {
        uuid id PK, FK
        text email
        text name
        text role
        text status
        boolean disabled
        jsonb profile
        text return_note
        timestamptz created_at
        timestamptz submitted_at
        timestamptz verified_at
    }

    APPLICATIONS {
        uuid id PK
        uuid student_id FK
        text school_year
        text grade_level
        text student_type
        text status
        jsonb form
        jsonb documents
        jsonb billing
        text review_note
        text student_no
        uuid reviewed_by FK
        timestamptz created_at
        timestamptz submitted_at
        timestamptz reviewed_at
    }

    OTP_CODES {
        uuid user_id PK, FK
        text code_hash
        text purpose
        timestamptz expires_at
        int attempts
        timestamptz created_at
    }

    PRESENCE {
        uuid id PK, FK
        timestamptz last_seen
    }

    SECTIONS {
        uuid id PK
        text school_year
        text grade
        text name
        text strand
        text adviser
        int capacity
        text status
        timestamptz created_at
    }

    AUDIT_LOG {
        uuid id PK
        timestamptz created_at
        text email
        text name
        text role
        text action
        text status
        text reason
        text ip
        text device
    }

    STORAGE_OBJECTS {
        uuid id PK
        text bucket_id
        text name
        uuid owner_id
        timestamptz created_at
    }
```

## Relationship notes

- `profiles.id`, `applications.student_id`, `applications.reviewed_by`,
  `otp_codes.user_id`, and `presence.id` reference `auth.users.id`.
- `applications.reviewed_by` is nullable: an application may not have been
  reviewed yet.
- `sections` currently has no database foreign key to `applications`.
  A student's section assignment is stored in the application's `form` JSONB
  data.
- Uploaded student documents are stored in the private `student-docs` bucket.
  The first path segment of `storage.objects.name` is the student's
  `auth.users.id`; this is an RLS-enforced ownership convention, not a
  database foreign key.
- `audit_log` intentionally has no user foreign key. It preserves login and
  security events even when the related account is later removed.
- `profiles.profile`, `applications.form`, `applications.documents`, and
  `applications.billing` are JSONB fields whose internal keys are application
  data rather than separate relational entities.

## Table sources

| Entity | Migration/source |
| --- | --- |
| `profiles`, `audit_log` | [`schema.sql`](../supabase/schema.sql) |
| `applications`, `billing`, `otp_codes` | [`students.sql`](../supabase/students.sql) |
| `sections` | [`sections.sql`](../supabase/sections.sql) |
| `presence` | [`presence.sql`](../supabase/presence.sql) |
| Application lifecycle and SQL setup order | [`SUPABASE-SQL-ORDER.md`](../SUPABASE-SQL-ORDER.md) |
