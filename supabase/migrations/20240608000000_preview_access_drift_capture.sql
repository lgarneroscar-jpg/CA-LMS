-- =============================================================================
-- Preview access + privacy hardening — drift capture
--
-- These objects were applied directly to the live project on 2026-10-14 and did
-- not exist in supabase/migrations/. This file reproduces them exactly as they
-- are deployed (introspected via pg_get_functiondef / pg_get_triggerdef /
-- pg_get_indexdef / pg_policies). Idempotent: safe against production, where the
-- objects already exist, and against a fresh branch database.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Columns
-- -----------------------------------------------------------------------------

ALTER TABLE public.institutions
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE public.exercise_answers
  ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id);


-- -----------------------------------------------------------------------------
-- 2. Functions
-- -----------------------------------------------------------------------------

-- SECURITY FIX. `role` was previously:
--     COALESCE(NEW.raw_user_meta_data->>'role', 'student')
-- raw_user_meta_data is populated from the client's own
-- signUp({ options: { data } }) call, so any self-registering user could set
-- role = 'super_admin'. 17 RLS policies key off that value, including ALL on
-- profiles and institutions and read access to every student's written work.
-- Role is now fixed at creation; elevation is a deliberate admin action.
--
-- NOTE: institution_id is still taken from metadata and is still caller-
-- controlled. Outstanding work: move invited-user profile creation to an
-- explicit server-side path and stop deriving institution here.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, role, institution_id, full_name)
  VALUES (
    NEW.id,
    'student',
    (NEW.raw_user_meta_data->>'institution_id')::uuid,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$function$;


-- Resolves an arbitrary user's institution. SECURITY DEFINER is required: this
-- is called from an RLS policy on exercise_answers, and profiles' own RLS would
-- otherwise filter the lookup to the caller's own row and return NULL.
CREATE OR REPLACE FUNCTION public.institution_of_user(uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT institution_id FROM profiles WHERE id = uid;
$function$;


-- Sharing can never be switched on inside a demo/preview institution, so two
-- prospects in the same preview cohort can never read each other's writing.
CREATE OR REPLACE FUNCTION public.force_private_in_demo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.institutions i ON i.id = p.institution_id
    WHERE p.id = NEW.user_id AND i.is_demo
  ) THEN
    NEW.is_public := false;
  END IF;
  RETURN NEW;
END;
$function$;


-- Membership of a demo institution forces profiles.is_demo. One-directional on
-- purpose: a demo profile inside a real institution stays possible (useful for
-- test accounts in a live cohort).
CREATE OR REPLACE FUNCTION public.sync_profile_is_demo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.is_demo := COALESCE(NEW.is_demo, false)
    OR COALESCE((SELECT i.is_demo FROM public.institutions i WHERE i.id = NEW.institution_id), false);
  RETURN NEW;
END;
$function$;


-- -----------------------------------------------------------------------------
-- 3. Index
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_exercise_answers_inst_public
  ON public.exercise_answers USING btree (institution_id)
  WHERE is_public;


-- -----------------------------------------------------------------------------
-- 4. Triggers
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_force_private_in_demo ON public.exercise_answers;
CREATE TRIGGER trg_force_private_in_demo
  BEFORE INSERT OR UPDATE ON public.exercise_answers
  FOR EACH ROW EXECUTE FUNCTION public.force_private_in_demo();

DROP TRIGGER IF EXISTS trg_sync_profile_is_demo ON public.profiles;
CREATE TRIGGER trg_sync_profile_is_demo
  BEFORE INSERT OR UPDATE OF institution_id ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_is_demo();


-- -----------------------------------------------------------------------------
-- 5. Policies
--
-- The previous SELECT policy was:
--     ((auth.uid() = user_id) OR (is_public = true))
-- with no institution scoping — any answer marked public was readable by every
-- authenticated user on the platform, across all institutions. The product
-- promises answers are "visible inside a cohort only when the student marks
-- them public"; this enforces the cohort half.
--
-- On production the old policy could not be dropped by the tooling in use, so it
-- was narrowed in place to `auth.uid() = user_id`. It is fully covered by the
-- new policy and is dropped here.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users read own or public exercise answers" ON public.exercise_answers;

DROP POLICY IF EXISTS "Users read own or public cohort exercise answers" ON public.exercise_answers;
CREATE POLICY "Users read own or public cohort exercise answers"
  ON public.exercise_answers FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      is_public = true
      AND public.institution_of_user(user_id) = public.current_user_institution_id()
    )
  );


-- -----------------------------------------------------------------------------
-- 6. Data backfills
--
-- Already applied in production; included so a rebuilt database reaches the same
-- state. Institution flagging matches on name because that is how it was done on
-- 2026-10-14. Going forward seeds should set is_demo directly — and note that
-- renaming "Demo University" makes this block match nothing, which is fine. It
-- is historical.
-- -----------------------------------------------------------------------------

UPDATE public.exercise_answers ea
SET institution_id = p.institution_id
FROM public.profiles p
WHERE p.id = ea.user_id
  AND ea.institution_id IS DISTINCT FROM p.institution_id;

UPDATE public.institutions
SET is_demo = true
WHERE name IN ('Demo University', 'Demo Preview')
  AND NOT is_demo;

UPDATE public.profiles p
SET is_demo = true
FROM public.institutions i
WHERE i.id = p.institution_id
  AND i.is_demo
  AND NOT p.is_demo;

UPDATE public.exercise_answers ea
SET is_public = false
FROM public.profiles p
JOIN public.institutions i ON i.id = p.institution_id
WHERE p.id = ea.user_id
  AND i.is_demo
  AND ea.is_public;


-- -----------------------------------------------------------------------------
-- 7. Post-apply verification — all four should return 0
-- -----------------------------------------------------------------------------
--
-- SELECT count(*) FROM public.exercise_answers WHERE institution_id IS NULL;
--
-- SELECT count(*) FROM public.exercise_answers ea
--   JOIN public.profiles p ON p.id = ea.user_id
--   JOIN public.institutions i ON i.id = p.institution_id
--  WHERE i.is_demo AND ea.is_public;
--
-- SELECT count(*) FROM public.profiles p
--   JOIN public.institutions i ON i.id = p.institution_id
--  WHERE i.is_demo AND NOT p.is_demo;
--
-- SELECT count(*) FROM pg_policies
--  WHERE schemaname='public' AND tablename='exercise_answers' AND cmd='SELECT'
--    AND policyname <> 'Users read own or public cohort exercise answers';
