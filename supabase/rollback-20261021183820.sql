-- NSDGA Enrollment - destructive rollback for 20261021183820_hello.sql
--
-- WARNING: Run this only before applying the replacement migration.
-- This permanently deletes application, profile, audit, presence, section,
-- site-content, rate-limit, and OTP data, plus all objects in student-docs.
-- It does not delete auth.users because those accounts may predate this
-- migration and are owned by Supabase Auth.
--
-- Run with:
--   supabase db execute --linked --file "supabase\rollback-20261021183820.sql"
--
-- The script is idempotent and may be safely rerun if a previous attempt
-- stopped partway through.

begin;

-- Remove the Auth trigger before dropping the trigger function.
drop trigger if exists on_auth_user_created on auth.users;

-- Remove application triggers and functions first.
drop trigger if exists trg_enforce_application_insert on public.applications;
drop trigger if exists trg_enforce_application on public.applications;
drop function if exists public.enforce_application_insert() cascade;
drop function if exists public.enforce_application_update() cascade;
drop function if exists public.is_staff() cascade;

-- Remove section and profile triggers/functions.
drop trigger if exists trg_enforce_section_limit on public.sections;
drop trigger if exists trg_enforce_account_limit on public.profiles;
drop trigger if exists trg_enforce_profile_update on public.profiles;
drop function if exists public.enforce_section_limit() cascade;
drop function if exists public.enforce_account_limit() cascade;
drop function if exists public.enforce_profile_update() cascade;
drop function if exists public.is_headadmin() cascade;
drop function if exists public.is_admin_or_head() cascade;
drop function if exists public.handle_new_user() cascade;

-- Remove security and administrative helper functions. Both log_event
-- signatures are removed because the migration history contained both forms.
drop function if exists public.log_event(text, text, text, text, text, text) cascade;
drop function if exists public.log_event(text, text, text, text, text) cascade;
drop function if exists public.chat_rate_check(text, integer, integer) cascade;
drop function if exists public.remove_user_mfa(uuid) cascade;

-- Remove the private student-docs bucket and its objects.
drop policy if exists "student_docs_insert" on storage.objects;
drop policy if exists "student_docs_select" on storage.objects;
drop policy if exists "student_docs_update" on storage.objects;
delete from storage.objects where bucket_id = 'student-docs';
delete from storage.buckets where id = 'student-docs';

-- Drop application-owned tables. CASCADE removes their policies, indexes,
-- grants, and dependent constraints.
drop table if exists public.otp_codes cascade;
drop table if exists public.applications cascade;
drop table if exists public.sections cascade;
drop table if exists public.presence cascade;
drop table if exists public.site_content cascade;
drop table if exists public.chat_rate_limits cascade;
drop table if exists public.audit_log_rate_limits cascade;
drop table if exists public.audit_log cascade;
drop table if exists public.profiles cascade;

commit;

-- pgcrypto is intentionally not dropped. Supabase projects commonly use this
-- extension for other application objects, and the replacement migration can
-- safely reuse it with CREATE EXTENSION IF NOT EXISTS.
