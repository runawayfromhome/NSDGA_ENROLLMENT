-- ============================================================================
-- New applicant signup flow: account-first drafts + email OTP verification.
-- Run once in the Supabase SQL Editor. (Needs the applications table + is_staff.)
-- ============================================================================

-- 1) Add a 'draft' status. The account is created at Step 1 and the application
--    stays 'draft' while the applicant fills the wizard; OTP verification flips
--    it to 'submitted'. Records are still never deleted.
alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check
  check (status in (
    'draft','submitted','under_review','needs_correction','enrolled',
    'rejected','withdrawn','graduated','archived','completed'
  ));

-- 2) One-time passcodes for email verification. Managed ONLY by the Edge
--    Functions (service role) — no client access at all.
create table if not exists public.otp_codes (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  code_hash  text not null,
  purpose    text not null default 'signup',
  expires_at timestamptz not null,
  attempts   int  not null default 0,
  created_at timestamptz not null default now()
);

alter table public.otp_codes enable row level security;
-- No policies + revoked grants ⇒ neither anon nor authenticated can read/write it.
revoke all on public.otp_codes from anon, authenticated;
