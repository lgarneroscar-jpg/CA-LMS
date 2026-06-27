-- Phase 4: gamification, admin analytics, reports

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active_week int,
  ADD COLUMN IF NOT EXISTS last_login timestamptz,
  ADD COLUMN IF NOT EXISTS program_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS earned_badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS streak_milestones_awarded jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reports_institution_id_idx ON public.reports(institution_id);

CREATE TABLE IF NOT EXISTS public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  logged_in_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_events_user_id_idx ON public.login_events(user_id);
CREATE INDEX IF NOT EXISTS login_events_logged_in_at_idx ON public.login_events(logged_in_at);

-- Recalculate cohort ranks (composite: XP + on-time rate + quiz average)
CREATE OR REPLACE FUNCTION public.recalculate_cohort_ranks(p_institution_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH content_modules AS (
    SELECT id, unlock_week FROM modules WHERE is_live_session = false
  ),
  quiz_counts AS (
    SELECT module_id, count(*)::int AS total
    FROM quiz_questions
    GROUP BY module_id
  ),
  student_metrics AS (
    SELECT
      p.id AS student_id,
      p.xp,
      COALESCE(
        AVG(
          CASE
            WHEN sp.is_complete AND qc.total > 0
            THEN sp.quiz_score::numeric / qc.total
            ELSE NULL
          END
        ),
        0
      ) AS quiz_avg,
      COALESCE(
        AVG(
          CASE
            WHEN sp.is_complete AND sp.completed_at IS NOT NULL
            THEN
              CASE
                WHEN i.cohort_start_date IS NULL THEN 0
                WHEN m.unlock_week = (
                  FLOOR(
                    GREATEST(
                      0,
                      (sp.completed_at::date - i.cohort_start_date)
                    ) / 7
                  ) + 1
                ) THEN 1
                ELSE 0
              END
            ELSE NULL
          END
        ),
        0
      ) AS on_time_rate
    FROM profiles p
    LEFT JOIN institutions i ON i.id = p.institution_id
    LEFT JOIN student_progress sp ON sp.student_id = p.id
    LEFT JOIN content_modules m ON m.id = sp.module_id
    LEFT JOIN quiz_counts qc ON qc.module_id = sp.module_id
    WHERE p.institution_id = p_institution_id
      AND p.role = 'student'
    GROUP BY p.id, p.xp
  ),
  ranked AS (
    SELECT
      student_id,
      row_number() OVER (
        ORDER BY
          (xp + (on_time_rate * 100) + (quiz_avg * 100)) DESC,
          xp DESC,
          student_id
      )::int AS new_rank
    FROM student_metrics
  )
  UPDATE profiles p
  SET rank = r.new_rank
  FROM ranked r
  WHERE p.id = r.student_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalculate_cohort_ranks(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_cohort_ranks(uuid) TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS flags_student_id_unique ON public.flags(student_id);
CREATE UNIQUE INDEX IF NOT EXISTS diagnostic_responses_student_question_unique
  ON public.diagnostic_responses(student_id, question_key);
