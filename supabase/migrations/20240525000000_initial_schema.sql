-- Corporate Academy Learning Center — initial schema
--
-- The previous file stopped after institutions and profiles ("See full
-- migration in Supabase dashboard migration history: initial_schema"). The
-- original statements in supabase_migrations.schema_migrations could not be
-- read from here: the dashboard is signed out, and the service-role key cannot
-- run SQL. This file is reconstructed so the later migrations apply in order.
--
-- Sources, and what is still unverified against live:
--   * Column names and nullability follow types/database.ts, which was
--     generated from the live project. A column that is optional on Insert is
--     given a default; those defaults are inferred, not read from pg_attrdef.
--   * Foreign-key ON DELETE actions follow the sibling tables in later
--     migrations (CASCADE for student-owned rows). Live may differ.
--   * Unique keys that no migration creates, but the app upserts on, are
--     included and marked below.
--   * current_user_role(), current_user_institution_id(), handle_new_user()
--     and the auth.users trigger are not in any other file. 20240525100000
--     grants the first two, so they have to exist here. Their bodies are the
--     ones the later policies call, not a pg_get_functiondef dump. The trigger
--     name on_auth_user_created is the conventional one; the live name was
--     not readable.
--   * is_fully_unlocked is on institutions in the generated types and in the
--     app, and no migration adds it.
--   * RLS policies, grants and revokes that were never copied into a later
--     migration are not invented here. Later files enable RLS and create the
--     policies they own. Anything that exists only on live is listed at the
--     bottom of this file.
--   * Tables, columns, indexes and policies that a later migration creates
--     are left to that migration (login_events, reports, capri_*,
--     exercise_answers, quiz_answers, preview_request_attempts, stream_url,
--     recording_url, profile columns added after this file, and so on).

-- uuid-ossp is part of the original stub. A stock Postgres image may not
-- ship it; gen_random_uuid() (used below) is built in from Postgres 13, so
-- the extension is created only when the server provides it. Supabase does.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'uuid-ossp') THEN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  END IF;
END $$;

CREATE TABLE institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#1B2A4A',
  admin_can_manage_students boolean NOT NULL DEFAULT false,
  drip_type text NOT NULL DEFAULT 'weekly' CHECK (drip_type IN ('weekly', 'async')),
  reporting_cadence text NOT NULL DEFAULT '4weeks' CHECK (reporting_cadence IN ('2weeks', '4weeks', '6weeks')),
  is_pilot boolean NOT NULL DEFAULT false,
  -- Inferred: present on live, absent from every later migration.
  is_fully_unlocked boolean NOT NULL DEFAULT false,
  cohort_start_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id uuid REFERENCES institutions(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'institutional_admin', 'student')),
  full_name text,
  linkedin_url text,
  profile_picture_url text,
  grad_year int,
  bio text CHECK (char_length(bio) <= 150),
  xp int NOT NULL DEFAULT 0,
  streak_days int NOT NULL DEFAULT 0,
  last_active_date date,
  rank int,
  onboarding_complete boolean NOT NULL DEFAULT false,
  diagnostic_complete boolean NOT NULL DEFAULT false,
  -- Used by 20240525300000 and never added by a later migration.
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- module_code uniqueness is added by 20240526100000, not here.
-- stream_url and recording_url are added by that same migration.
CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code text NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  pillar integer NOT NULL,
  unlock_week integer NOT NULL DEFAULT 1,
  order_index integer NOT NULL DEFAULT 0,
  description text,
  video_url text,
  workbook_content jsonb,
  exercises jsonb,
  is_live_session boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer text NOT NULL,
  order_index integer NOT NULL DEFAULT 0
);

-- Attendance columns are added by 20240602300000.
-- Unique (student_id, module_id) is inferred from the app's upsert conflict
-- target; no migration creates it.
CREATE TABLE public.student_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  video_watched boolean NOT NULL DEFAULT false,
  exercises_submitted boolean NOT NULL DEFAULT false,
  quiz_completed boolean NOT NULL DEFAULT false,
  quiz_score integer,
  is_complete boolean NOT NULL DEFAULT false,
  xp_earned integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, module_id)
);

-- Unique (student_id, module_id, exercise_key) is inferred from the app's
-- upsert conflict target; no migration creates it.
CREATE TABLE public.exercise_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  exercise_key text NOT NULL,
  response text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, module_id, exercise_key)
);

CREATE TABLE public.diagnostic_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_key text NOT NULL,
  response text,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

-- The unique index on student_id is created by 20240527000000.
CREATE TABLE public.flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  flagged_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique (institution_id, week_number) is inferred from the cohort-controls
-- upsert conflict target; no migration creates it.
CREATE TABLE public.institution_unlocked_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  week_number integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, week_number)
);

-- Bodies reconstructed from how later policies call them, not from live.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_institution_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Replaced by 20240608000000 and again by the later handle_new_user files.
-- This body does not read sign-up metadata. The historical body did; it was
-- not recoverable, and shipping it here would reopen the hole those later
-- migrations close.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    'student',
    COALESCE(
      NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''),
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger name not read from live. Supabase's usual name.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Not reproduced, because they are not in any migration and could not be
-- read from live:
--   * RLS policies and ENABLE ROW LEVEL SECURITY on institutions, profiles,
--     modules, quiz_questions, student_progress, exercise_responses,
--     diagnostic_responses, flags, institution_unlocked_weeks (notifications
--     RLS is in 20240528100000; the other policies that do exist are in the
--     later files that create them)
--   * GRANT / REVOKE on those tables (platform default privileges, not SQL
--     in this directory, except where a later migration states them)
--   * The original handle_new_user body and the live trigger name
--   * Column defaults and ON DELETE actions, as marked above
--   * storage schema (platform-owned; 20240528000000 policies it)
--   * Any index that exists on live but is not created by a migration
