-- profiles.last_login
--
-- This column was added directly in Supabase during the R1 admin-reporting pass
-- but never recorded as a migration, so the repo and the database disagreed.
-- lib/cohort-analytics.ts selects it; before it existed, that select failed and
-- the error was destructured away, silently returning an empty cohort roster.
--
-- Idempotent so it is safe to run against the existing production database.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.last_login IS
  'Timestamp of the user''s most recent sign-in. Written on auth; read by admin reporting.';
