-- Reconcile drift: phase4_gamification_admin never landed in full on the live
-- database. Four profile columns the application reads do not exist there, which
-- makes /certificate 404 for every student (the select errors) and silently
-- zeroes the XP breakdown. These are additive and idempotent.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS program_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS streak_milestones_awarded jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS earned_badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_active_week integer;

CREATE INDEX IF NOT EXISTS profiles_program_completed_at_idx
  ON public.profiles (program_completed_at)
  WHERE program_completed_at IS NOT NULL;
