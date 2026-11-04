-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  name text,
  role text NOT NULL DEFAULT 'registrar'::text CHECK (role = ANY (ARRAY['registrar'::text, 'admin'::text, 'headadmin'::text, 'student'::text])),
  status text NOT NULL DEFAULT 'pending_profile'::text CHECK (status = ANY (ARRAY['pending_profile'::text, 'pending_verification'::text, 'verified'::text])),
  disabled boolean NOT NULL DEFAULT false,
  profile jsonb,
  return_note text DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  submitted_at timestamp with time zone,
  verified_at timestamp with time zone,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  email text,
  name text,
  role text,
  action text,
  status text,
  reason text,
  ip text,
  device text,
  CONSTRAINT audit_log_pkey PRIMARY KEY (id)
);
CREATE TABLE public.site_content (
  section text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT site_content_pkey PRIMARY KEY (section),
  CONSTRAINT site_content_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  school_year text,
  grade_level text,
  student_type text,
  status text NOT NULL DEFAULT 'submitted'::text CHECK (status = ANY (ARRAY['draft'::text, 'submitted'::text, 'under_review'::text, 'needs_correction'::text, 'enrolled'::text, 'rejected'::text, 'withdrawn'::text, 'graduated'::text, 'archived'::text, 'completed'::text])),
  form jsonb,
  documents jsonb,
  review_note text DEFAULT ''::text,
  student_no text,
  reviewed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  billing jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id),
  CONSTRAINT applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)
);
CREATE TABLE public.sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_year text NOT NULL,
  grade text NOT NULL,
  name text NOT NULL,
  adviser text DEFAULT ''::text,
  capacity integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  strand text,
  status text NOT NULL DEFAULT 'pending'::text,
  CONSTRAINT sections_pkey PRIMARY KEY (id)
);
CREATE TABLE public.presence (
  id uuid NOT NULL,
  last_seen timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT presence_pkey PRIMARY KEY (id),
  CONSTRAINT presence_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.otp_codes (
  user_id uuid NOT NULL,
  code_hash text NOT NULL,
  purpose text NOT NULL DEFAULT 'signup'::text,
  expires_at timestamp with time zone NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT otp_codes_pkey PRIMARY KEY (user_id),
  CONSTRAINT otp_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.chat_rate_limits (
  ip text NOT NULL,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0,
  CONSTRAINT chat_rate_limits_pkey PRIMARY KEY (ip)
);