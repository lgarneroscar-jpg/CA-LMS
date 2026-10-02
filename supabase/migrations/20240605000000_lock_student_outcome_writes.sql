-- S6: a student may write their own work, never their own outcomes.
--
-- Outcome columns (completion, scores, XP, rank, role, cohort, milestones) are
-- written only by server actions using the service role, which derive the
-- student id from the session. Policy and privilege changes only; no data is
-- modified.

-- ---------------------------------------------------------------------------
-- student_progress: read-only for students
-- ---------------------------------------------------------------------------

-- "Students manage own progress" was FOR ALL, which let a student set
-- is_complete / quiz_score / xp_earned on their own rows via the REST API.
DROP POLICY IF EXISTS "Students manage own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Students read own progress" ON public.student_progress;

CREATE POLICY "Students read own progress"
ON public.student_progress FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Privileges as well as policies: without write privileges a crafted request
-- fails with "permission denied" no matter what policies exist or are added.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.student_progress FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles: students update only their self-description
-- ---------------------------------------------------------------------------

-- "Users update own profile" stays (row scope: id = auth.uid()); these grants
-- restrict which columns it can touch. Everything else -- xp, rank, role,
-- institution_id, is_demo, streaks, badges, completion and activity stamps --
-- is service-role only.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (
  full_name,
  bio,
  linkedin_url,
  profile_picture_url,
  grad_year,
  default_answer_visibility
) ON public.profiles TO authenticated;

-- ---------------------------------------------------------------------------
-- quiz_answers: already has no write policies; remove the privileges too
-- ---------------------------------------------------------------------------

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.quiz_answers FROM anon, authenticated;
