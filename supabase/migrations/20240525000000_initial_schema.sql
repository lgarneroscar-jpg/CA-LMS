-- Corporate Academy Learning Center — initial schema
-- Applied to remote project via Supabase MCP (initial_schema migration)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#1B2A4A',
  admin_can_manage_students boolean NOT NULL DEFAULT false,
  drip_type text NOT NULL DEFAULT 'weekly' CHECK (drip_type IN ('weekly', 'async')),
  reporting_cadence text NOT NULL DEFAULT '4weeks' CHECK (reporting_cadence IN ('2weeks', '4weeks', '6weeks')),
  is_pilot boolean NOT NULL DEFAULT false,
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
  created_at timestamptz NOT NULL DEFAULT now()
);

-- See full migration in Supabase dashboard migration history: initial_schema
