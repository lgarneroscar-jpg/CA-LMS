-- Server-side quiz grading + per-answer capture (S5).
--
-- 1. quiz_answers: one row per answered question per attempt. Retakes are kept;
--    student_progress.quiz_score still holds only the latest attempt's score.
-- 2. The quiz answer key (quiz_questions.correct_answer) is no longer readable
--    by client roles. Grading reads it with the service role inside submitQuiz.
--
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  chosen_option text NOT NULL,
  is_correct boolean NOT NULL,
  attempt_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quiz_answers_module_question_idx
  ON public.quiz_answers (module_id, question_id);
CREATE INDEX IF NOT EXISTS quiz_answers_student_module_idx
  ON public.quiz_answers (student_id, module_id);

ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- Read: students see their own; super admins see all; institutional admins see
-- students in their institution.
DROP POLICY IF EXISTS "Read quiz answers in scope" ON public.quiz_answers;
CREATE POLICY "Read quiz answers in scope"
ON public.quiz_answers FOR SELECT
TO authenticated
USING (
  auth.uid() = student_id
  OR public.current_user_role() = 'super_admin'
  OR (
    public.current_user_role() = 'institutional_admin'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = quiz_answers.student_id
        AND p.institution_id = public.current_user_institution_id()
    )
  )
);

-- No INSERT / UPDATE / DELETE policies, deliberately. Rows are written only by
-- submitQuiz using the service role, after server-side grading. A student-facing
-- INSERT policy would let anyone post fabricated answers straight to the API.

-- Hide the answer key from client roles. Column-level privileges: drop the
-- table-wide SELECT, then grant every column except correct_answer.
REVOKE SELECT ON public.quiz_questions FROM anon, authenticated;
GRANT SELECT (id, module_id, question, options, order_index)
  ON public.quiz_questions TO authenticated;
