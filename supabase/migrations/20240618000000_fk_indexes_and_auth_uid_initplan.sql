-- Foreign-key indexes the linter flagged, and a meaning-preserving rewrite of
-- auth.uid() inside the listed RLS policies.
--
-- (select auth.uid()) is evaluated once per query. auth.uid() alone is
-- evaluated once per row. The replacement is textual and only on policies
-- whose expression still contains a bare auth.uid() call, so a policy that
-- does not use it is left untouched and a second apply finds nothing to do.
--
-- The redundant exercise_answers SELECT policy was dropped in
-- 20240608000000. That drop could not be re-read from live (no SQL access
-- from this session), so it is repeated here. DROP POLICY IF EXISTS is a
-- no-op when 20240608 already removed it.

CREATE INDEX IF NOT EXISTS capri_administrations_instrument_version_idx
  ON public.capri_administrations (instrument_version);

-- The item foreign key is (instrument_version, item_id).
CREATE INDEX IF NOT EXISTS capri_answers_item_fk_idx
  ON public.capri_answers (instrument_version, item_id);

CREATE INDEX IF NOT EXISTS exercise_responses_module_id_idx
  ON public.exercise_responses (module_id);

CREATE INDEX IF NOT EXISTS flags_flagged_by_idx
  ON public.flags (flagged_by);

CREATE INDEX IF NOT EXISTS flags_student_id_idx
  ON public.flags (student_id);

CREATE INDEX IF NOT EXISTS quiz_answers_question_id_idx
  ON public.quiz_answers (question_id);

CREATE INDEX IF NOT EXISTS quiz_questions_module_id_idx
  ON public.quiz_questions (module_id);

CREATE INDEX IF NOT EXISTS student_progress_attendance_confirmed_by_idx
  ON public.student_progress (attendance_confirmed_by);

DROP POLICY IF EXISTS "Users read own or public exercise answers"
  ON public.exercise_answers;

DO $body$
DECLARE
  pol record;
  new_using text;
  new_check text;
  role_list text;
  permissive text;
BEGIN
  FOR pol IN
    SELECT *
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'exercise_answers',
        'capri_answers',
        'capri_responses',
        'capri_scores',
        'profiles',
        'student_progress',
        'login_events',
        'notifications',
        'quiz_answers',
        'exercise_responses',
        'diagnostic_responses'
      ])
      AND (
        COALESCE(qual, '') ~* 'auth\.uid\(\)'
        OR COALESCE(with_check, '') ~* 'auth\.uid\(\)'
      )
  LOOP
    new_using := CASE
      WHEN pol.qual IS NULL THEN NULL
      ELSE regexp_replace(pol.qual, '(?<!select )auth\.uid\(\)', '(select auth.uid())', 'gi')
    END;
    new_check := CASE
      WHEN pol.with_check IS NULL THEN NULL
      ELSE regexp_replace(pol.with_check, '(?<!select )auth\.uid\(\)', '(select auth.uid())', 'gi')
    END;

    IF new_using IS NOT DISTINCT FROM pol.qual
       AND new_check IS NOT DISTINCT FROM pol.with_check THEN
      CONTINUE;
    END IF;

    permissive := CASE
      WHEN pol.permissive = 'PERMISSIVE' THEN 'PERMISSIVE'
      ELSE 'RESTRICTIVE'
    END;

    SELECT string_agg(quote_ident(r::text), ', ')
      INTO role_list
    FROM unnest(pol.roles) AS r;

    IF role_list IS NULL OR role_list = '' THEN
      role_list := 'public';
    END IF;

    EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s %s %s',
      pol.policyname,
      pol.tablename,
      permissive,
      pol.cmd,
      role_list,
      CASE WHEN new_using IS NULL THEN '' ELSE format('USING (%s)', new_using) END,
      CASE WHEN new_check IS NULL THEN '' ELSE format('WITH CHECK (%s)', new_check) END
    );

    RAISE NOTICE 'rewrote %.% : using % -> % ; check % -> %',
      pol.tablename, pol.policyname, pol.qual, new_using, pol.with_check, new_check;
  END LOOP;
END
$body$;
