-- ============================================================================
-- PRODUCTION HARDENING — run once in the Supabase SQL Editor before go-live.
-- Removes the dev-only plain-text password column. Safe if it doesn't exist.
-- ============================================================================
alter table public.profiles drop column if exists demo_password;

-- Reminder (do these in the dashboard, not here):
--   * Delete the 'seed-test-data' Edge Function (if still deployed).
--   * To FORCE MFA for staff, set MFA_REQUIRED_ROLES = ['admin','headadmin']
--     in src/auth/authStore.js — but ONLY after every staff member has an
--     authenticator enrolled, or they will be locked out at MFA setup.
