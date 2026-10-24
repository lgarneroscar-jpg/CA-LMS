-- =============================================================================
-- Baseline row-level security — generated from the live project 2026-10-21
--
-- WHY THIS EXISTS
--
-- The reconstructed 20240525000000_initial_schema.sql creates several tables
-- without enabling RLS and without their policies, because it was rebuilt from
-- generated types and inference rather than from live (the agent that wrote it
-- had no SQL access to the project). Its own footer lists the gap:
-- institutions, profiles, modules, quiz_questions, student_progress,
-- exercise_responses, diagnostic_responses, flags, institution_unlocked_weeks.
--
-- A database rebuilt from the repo without this file has NO row-level security
-- on student profiles, institutions, progress or written work. Anyone holding
-- the anon key reads everything. That is strictly worse than the 38-line stub
-- it replaced: the stub failed loudly, this fails silently and looks complete.
--
-- This file is the authority for RLS state. Every statement was generated from
-- pg_policies on the live project, not written by hand, so it reproduces what
-- is actually running rather than what anyone believes is running.
--
-- ORDER: must run AFTER the tables exist and AFTER the functions the policies
-- call — current_user_role(), current_user_institution_id() (base schema) and
-- institution_of_user() (20240608000000), and BEFORE 20240618000000.
--
-- The 20240617500000 number is deliberate. 20240618000000 rewrites auth.uid()
-- as (select auth.uid()) across 22 policies, and drops the redundant
-- exercise_answers SELECT policy. If this file ran after it, it would recreate
-- those policies unwrapped and resurrect the dropped one, silently undoing
-- both. Running first, it establishes the policies and 20240618 then corrects
-- them, which is the same order live went through.
--
-- IDEMPOTENT: every policy is dropped and recreated, so re-running is safe.
--
-- NOT YET APPLIED TO LIVE — and it does not need to be. Live already has all
-- 21 tables RLS-enabled with these 47 policies; this file exists so a rebuild
-- matches. Applying it to live is a no-op that recreates each policy identically.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Enable RLS on every table in public (21 tables, matching live)
-- -----------------------------------------------------------------------------

ALTER TABLE public.institutions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_responses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_answers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_responses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flags                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_unlocked_weeks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_events                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capri_instruments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capri_items                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capri_administrations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capri_responses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capri_answers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capri_scores                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preview_request_attempts    ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- 2. Policies, generated from live
--
-- NOTE: preview_request_attempts intentionally has NO policies. RLS is enabled
-- and nothing is granted to anon or authenticated, so only the service role
-- reaches it. That is the design, not an omission.
-- -----------------------------------------------------------------------------

-- institutions ---------------------------------------------------------------

DROP POLICY IF EXISTS "Institutional admins see own institution" ON public.institutions;
CREATE POLICY "Institutional admins see own institution" ON public.institutions AS PERMISSIVE FOR SELECT TO public
  USING (((current_user_role() = 'institutional_admin'::text) AND (id = current_user_institution_id())));

DROP POLICY IF EXISTS "Students see own institution" ON public.institutions;
CREATE POLICY "Students see own institution" ON public.institutions AS PERMISSIVE FOR SELECT TO public
  USING (((current_user_role() = 'student'::text) AND (id = current_user_institution_id())));

DROP POLICY IF EXISTS "Super admins see all institutions" ON public.institutions;
CREATE POLICY "Super admins see all institutions" ON public.institutions AS PERMISSIVE FOR SELECT TO public
  USING ((current_user_role() = 'super_admin'::text));

DROP POLICY IF EXISTS "Super admins manage institutions" ON public.institutions;
CREATE POLICY "Super admins manage institutions" ON public.institutions AS PERMISSIVE FOR ALL TO public
  USING ((current_user_role() = 'super_admin'::text))
  WITH CHECK ((current_user_role() = 'super_admin'::text));


-- profiles -------------------------------------------------------------------

DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO public
  USING ((id = auth.uid()));

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO public
  USING ((id = auth.uid()))
  WITH CHECK ((id = auth.uid()));

DROP POLICY IF EXISTS "Institutional admins read institution profiles" ON public.profiles;
CREATE POLICY "Institutional admins read institution profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO public
  USING (((current_user_role() = 'institutional_admin'::text) AND (institution_id = current_user_institution_id())));

DROP POLICY IF EXISTS "Super admins read all profiles" ON public.profiles;
CREATE POLICY "Super admins read all profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO public
  USING ((current_user_role() = 'super_admin'::text));

DROP POLICY IF EXISTS "Super admins manage profiles" ON public.profiles;
CREATE POLICY "Super admins manage profiles" ON public.profiles AS PERMISSIVE FOR ALL TO public
  USING ((current_user_role() = 'super_admin'::text))
  WITH CHECK ((current_user_role() = 'super_admin'::text));


-- modules --------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users read modules" ON public.modules;
CREATE POLICY "Authenticated users read modules" ON public.modules AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Super admins manage modules" ON public.modules;
CREATE POLICY "Super admins manage modules" ON public.modules AS PERMISSIVE FOR ALL TO public
  USING ((current_user_role() = 'super_admin'::text))
  WITH CHECK ((current_user_role() = 'super_admin'::text));


-- quiz_questions -------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users read quiz questions" ON public.quiz_questions;
CREATE POLICY "Authenticated users read quiz questions" ON public.quiz_questions AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Super admins manage quiz questions" ON public.quiz_questions;
CREATE POLICY "Super admins manage quiz questions" ON public.quiz_questions AS PERMISSIVE FOR ALL TO public
  USING ((current_user_role() = 'super_admin'::text))
  WITH CHECK ((current_user_role() = 'super_admin'::text));


-- quiz_answers ---------------------------------------------------------------

DROP POLICY IF EXISTS "Read quiz answers in scope" ON public.quiz_answers;
CREATE POLICY "Read quiz answers in scope" ON public.quiz_answers AS PERMISSIVE FOR SELECT TO authenticated
  USING (((auth.uid() = student_id) OR (current_user_role() = 'super_admin'::text) OR ((current_user_role() = 'institutional_admin'::text) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = quiz_answers.student_id) AND (p.institution_id = current_user_institution_id())))))));


-- student_progress -----------------------------------------------------------

DROP POLICY IF EXISTS "Students read own progress" ON public.student_progress;
CREATE POLICY "Students read own progress" ON public.student_progress AS PERMISSIVE FOR SELECT TO authenticated
  USING ((auth.uid() = student_id));

DROP POLICY IF EXISTS "Admins read institution progress" ON public.student_progress;
CREATE POLICY "Admins read institution progress" ON public.student_progress AS PERMISSIVE FOR SELECT TO public
  USING (((current_user_role() = ANY (ARRAY['institutional_admin'::text, 'super_admin'::text])) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = student_progress.student_id) AND ((current_user_role() = 'super_admin'::text) OR (p.institution_id = current_user_institution_id())))))));


-- exercise_responses ---------------------------------------------------------

DROP POLICY IF EXISTS "Students manage own exercise responses" ON public.exercise_responses;
CREATE POLICY "Students manage own exercise responses" ON public.exercise_responses AS PERMISSIVE FOR ALL TO public
  USING ((student_id = auth.uid()))
  WITH CHECK ((student_id = auth.uid()));

DROP POLICY IF EXISTS "Admins read institution exercise responses" ON public.exercise_responses;
CREATE POLICY "Admins read institution exercise responses" ON public.exercise_responses AS PERMISSIVE FOR SELECT TO public
  USING (((current_user_role() = ANY (ARRAY['institutional_admin'::text, 'super_admin'::text])) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = exercise_responses.student_id) AND ((current_user_role() = 'super_admin'::text) OR (p.institution_id = current_user_institution_id())))))));


-- exercise_answers -----------------------------------------------------------
-- NOTE: "Users read own or public exercise answers" is the narrowed remnant of
-- the original leaking policy. It is reproduced here because it is still on
-- live; 20240618000000, which runs after this file, is what drops it. Leave it
-- here so the chain mirrors the real sequence.

DROP POLICY IF EXISTS "Users read own or public cohort exercise answers" ON public.exercise_answers;
CREATE POLICY "Users read own or public cohort exercise answers" ON public.exercise_answers AS PERMISSIVE FOR SELECT TO public
  USING (((auth.uid() = user_id) OR ((is_public = true) AND (institution_of_user(user_id) = current_user_institution_id()))));

DROP POLICY IF EXISTS "Users read own or public exercise answers" ON public.exercise_answers;
CREATE POLICY "Users read own or public exercise answers" ON public.exercise_answers AS PERMISSIVE FOR SELECT TO authenticated
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users insert own exercise answers" ON public.exercise_answers;
CREATE POLICY "Users insert own exercise answers" ON public.exercise_answers AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users update own exercise answers" ON public.exercise_answers;
CREATE POLICY "Users update own exercise answers" ON public.exercise_answers AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users delete own exercise answers" ON public.exercise_answers;
CREATE POLICY "Users delete own exercise answers" ON public.exercise_answers AS PERMISSIVE FOR DELETE TO authenticated
  USING ((auth.uid() = user_id));


-- diagnostic_responses -------------------------------------------------------

DROP POLICY IF EXISTS "Students manage own diagnostic responses" ON public.diagnostic_responses;
CREATE POLICY "Students manage own diagnostic responses" ON public.diagnostic_responses AS PERMISSIVE FOR ALL TO public
  USING ((student_id = auth.uid()))
  WITH CHECK ((student_id = auth.uid()));

DROP POLICY IF EXISTS "Admins read institution diagnostic responses" ON public.diagnostic_responses;
CREATE POLICY "Admins read institution diagnostic responses" ON public.diagnostic_responses AS PERMISSIVE FOR SELECT TO public
  USING (((current_user_role() = ANY (ARRAY['institutional_admin'::text, 'super_admin'::text])) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = diagnostic_responses.student_id) AND ((current_user_role() = 'super_admin'::text) OR (p.institution_id = current_user_institution_id())))))));


-- notifications --------------------------------------------------------------

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications AS PERMISSIVE FOR SELECT TO authenticated
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users insert own notifications" ON public.notifications;
CREATE POLICY "Users insert own notifications" ON public.notifications AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Super admins manage notifications" ON public.notifications;
CREATE POLICY "Super admins manage notifications" ON public.notifications AS PERMISSIVE FOR ALL TO public
  USING ((current_user_role() = 'super_admin'::text))
  WITH CHECK ((current_user_role() = 'super_admin'::text));


-- flags ----------------------------------------------------------------------

DROP POLICY IF EXISTS "Students cannot access flags" ON public.flags;
CREATE POLICY "Students cannot access flags" ON public.flags AS PERMISSIVE FOR SELECT TO public
  USING (false);

DROP POLICY IF EXISTS "Admins manage flags in scope" ON public.flags;
CREATE POLICY "Admins manage flags in scope" ON public.flags AS PERMISSIVE FOR ALL TO public
  USING (((current_user_role() = 'super_admin'::text) OR ((current_user_role() = 'institutional_admin'::text) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = flags.student_id) AND (p.institution_id = current_user_institution_id())))))))
  WITH CHECK (((current_user_role() = 'super_admin'::text) OR ((current_user_role() = 'institutional_admin'::text) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = flags.student_id) AND (p.institution_id = current_user_institution_id())))))));


-- institution_unlocked_weeks -------------------------------------------------

DROP POLICY IF EXISTS "Students read institution unlocked weeks" ON public.institution_unlocked_weeks;
CREATE POLICY "Students read institution unlocked weeks" ON public.institution_unlocked_weeks AS PERMISSIVE FOR SELECT TO public
  USING (((current_user_role() = 'student'::text) AND (institution_id = current_user_institution_id())));

DROP POLICY IF EXISTS "Institutional admins read institution unlocked weeks" ON public.institution_unlocked_weeks;
CREATE POLICY "Institutional admins read institution unlocked weeks" ON public.institution_unlocked_weeks AS PERMISSIVE FOR SELECT TO public
  USING (((current_user_role() = 'institutional_admin'::text) AND (institution_id = current_user_institution_id())));

DROP POLICY IF EXISTS "Super admins manage institution unlocked weeks" ON public.institution_unlocked_weeks;
CREATE POLICY "Super admins manage institution unlocked weeks" ON public.institution_unlocked_weeks AS PERMISSIVE FOR ALL TO public
  USING ((current_user_role() = 'super_admin'::text))
  WITH CHECK ((current_user_role() = 'super_admin'::text));


-- login_events ---------------------------------------------------------------

DROP POLICY IF EXISTS "Users read own login events" ON public.login_events;
CREATE POLICY "Users read own login events" ON public.login_events AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users insert own login events" ON public.login_events;
CREATE POLICY "Users insert own login events" ON public.login_events AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Admins read login events in scope" ON public.login_events;
CREATE POLICY "Admins read login events in scope" ON public.login_events AS PERMISSIVE FOR SELECT TO public
  USING (((current_user_role() = 'super_admin'::text) OR ((current_user_role() = 'institutional_admin'::text) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = login_events.user_id) AND (p.institution_id = current_user_institution_id())))))));


-- reports --------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins manage reports in scope" ON public.reports;
CREATE POLICY "Admins manage reports in scope" ON public.reports AS PERMISSIVE FOR ALL TO public
  USING (((current_user_role() = 'super_admin'::text) OR ((current_user_role() = 'institutional_admin'::text) AND (institution_id = current_user_institution_id()))))
  WITH CHECK (((current_user_role() = 'super_admin'::text) OR ((current_user_role() = 'institutional_admin'::text) AND (institution_id = current_user_institution_id()))));


-- capri_instruments / capri_items --------------------------------------------

DROP POLICY IF EXISTS "Authenticated read capri instruments" ON public.capri_instruments;
CREATE POLICY "Authenticated read capri instruments" ON public.capri_instruments AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated read capri items" ON public.capri_items;
CREATE POLICY "Authenticated read capri items" ON public.capri_items AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_active = true));


-- capri_administrations ------------------------------------------------------

DROP POLICY IF EXISTS "Members read own institution administrations" ON public.capri_administrations;
CREATE POLICY "Members read own institution administrations" ON public.capri_administrations AS PERMISSIVE FOR SELECT TO authenticated
  USING (((current_user_role() = 'super_admin'::text) OR (institution_id = current_user_institution_id())));


-- capri_responses ------------------------------------------------------------

DROP POLICY IF EXISTS "Students open own capri responses" ON public.capri_responses;
CREATE POLICY "Students open own capri responses" ON public.capri_responses AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((auth.uid() = student_id) AND (submitted_at IS NULL) AND (duration_seconds IS NULL)));

DROP POLICY IF EXISTS "Students read own capri responses" ON public.capri_responses;
CREATE POLICY "Students read own capri responses" ON public.capri_responses AS PERMISSIVE FOR SELECT TO authenticated
  USING (((auth.uid() = student_id) OR (current_user_role() = 'super_admin'::text) OR ((current_user_role() = 'institutional_admin'::text) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = capri_responses.student_id) AND (p.institution_id = current_user_institution_id())))))));


-- capri_answers --------------------------------------------------------------

DROP POLICY IF EXISTS "Students read own capri answers" ON public.capri_answers;
CREATE POLICY "Students read own capri answers" ON public.capri_answers AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM capri_responses r
  WHERE ((r.id = capri_answers.response_id) AND (r.student_id = auth.uid())))));

DROP POLICY IF EXISTS "Students insert own capri answers" ON public.capri_answers;
CREATE POLICY "Students insert own capri answers" ON public.capri_answers AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1
   FROM capri_responses r
  WHERE ((r.id = capri_answers.response_id) AND (r.student_id = auth.uid()) AND (r.submitted_at IS NULL)))));

DROP POLICY IF EXISTS "Students update own capri answers" ON public.capri_answers;
CREATE POLICY "Students update own capri answers" ON public.capri_answers AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM capri_responses r
  WHERE ((r.id = capri_answers.response_id) AND (r.student_id = auth.uid()) AND (r.submitted_at IS NULL)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM capri_responses r
  WHERE ((r.id = capri_answers.response_id) AND (r.student_id = auth.uid()) AND (r.submitted_at IS NULL)))));


-- capri_scores ---------------------------------------------------------------

DROP POLICY IF EXISTS "Students read own capri scores" ON public.capri_scores;
CREATE POLICY "Students read own capri scores" ON public.capri_scores AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM capri_responses r
  WHERE ((r.id = capri_scores.response_id) AND (r.student_id = auth.uid())))));


-- -----------------------------------------------------------------------------
-- 3. Verification — run against a rebuilt database. Both must match live.
-- -----------------------------------------------------------------------------
--
-- Expect 21 and 21:
--   SELECT count(*) FILTER (WHERE c.relrowsecurity) AS rls_on, count(*) AS tables
--   FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname = 'public' AND c.relkind = 'r';
--
-- Expect 47 before 20240618 is applied, 46 after (it drops the duplicate):
--   SELECT count(*) FROM pg_policies WHERE schemaname = 'public';
