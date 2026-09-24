-- CAPRI v2 — Corporate Academy Professional Readiness Index, native instrument.
--
-- Replaces the invented 7-question onboarding diagnostic as the Week 1 measure.
-- Structure follows the CAPRI v2 spec: 3 pillars x 3 sub-dimensions x 3 Likert
-- items (27), plus a 6-item behavioral frequency block.
--
-- Design rules that matter for anyone editing this later:
--   * Item IDs are permanent. Changing an item's wording means a NEW id under a
--     NEW instrument version -- never an in-place edit, or longitudinal
--     comparison breaks silently.
--   * A student's Week 1 answers are written once and never updated again. The
--     Week 12 retrospective is stored as additional rows on the Week 12 response
--     with rating_context = 'retrospective'. Any code path that could overwrite a
--     baseline answer is a bug.

-- ---------------------------------------------------------------------------
-- Instrument + items (content tables)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.capri_instruments (
  version text PRIMARY KEY,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.capri_items (
  instrument_version text NOT NULL
    REFERENCES public.capri_instruments(version) ON DELETE CASCADE,
  id text NOT NULL,
  section text NOT NULL CHECK (section IN ('core', 'behavioral')),
  pillar integer NOT NULL CHECK (pillar BETWEEN 1 AND 3),
  subdimension text,
  item_type text NOT NULL CHECK (item_type IN ('likert5', 'frequency_band')),
  prompt text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (instrument_version, id),
  CONSTRAINT capri_items_core_has_subdimension
    CHECK (section <> 'core' OR subdimension IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS capri_items_pillar_idx
  ON public.capri_items (instrument_version, pillar, order_index);

-- ---------------------------------------------------------------------------
-- Administrations, responses, answers, scores
-- ---------------------------------------------------------------------------

-- Institution IS the cohort in this product (see institution_unlocked_weeks),
-- so an administration hangs off institution_id rather than a cohort table.
CREATE TABLE IF NOT EXISTS public.capri_administrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL
    REFERENCES public.institutions(id) ON DELETE CASCADE,
  instrument_version text NOT NULL
    REFERENCES public.capri_instruments(version),
  administration_type text NOT NULL
    CHECK (administration_type IN ('baseline', 'post')),
  opens_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capri_administrations_unique_per_institution
    UNIQUE (institution_id, administration_type, instrument_version)
);

CREATE TABLE IF NOT EXISTS public.capri_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL
    REFERENCES public.capri_administrations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  duration_seconds integer,
  CONSTRAINT capri_responses_one_per_student_per_administration
    UNIQUE (administration_id, student_id)
);

CREATE INDEX IF NOT EXISTS capri_responses_student_idx
  ON public.capri_responses (student_id);

CREATE INDEX IF NOT EXISTS capri_responses_submitted_idx
  ON public.capri_responses (administration_id, submitted_at);

CREATE TABLE IF NOT EXISTS public.capri_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL
    REFERENCES public.capri_responses(id) ON DELETE CASCADE,
  instrument_version text NOT NULL,
  item_id text NOT NULL,
  -- 'current' is how the student rates themselves today. 'retrospective' is the
  -- Week 12 re-rating of Week 1 (B2). Baseline responses only ever hold 'current'.
  rating_context text NOT NULL DEFAULT 'current'
    CHECK (rating_context IN ('current', 'retrospective')),
  raw_value integer NOT NULL CHECK (raw_value BETWEEN 0 AND 5),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capri_answers_item_fk
    FOREIGN KEY (instrument_version, item_id)
    REFERENCES public.capri_items (instrument_version, id),
  CONSTRAINT capri_answers_unique_per_context
    UNIQUE (response_id, item_id, rating_context)
);

CREATE INDEX IF NOT EXISTS capri_answers_response_idx
  ON public.capri_answers (response_id);

CREATE TABLE IF NOT EXISTS public.capri_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL
    REFERENCES public.capri_responses(id) ON DELETE CASCADE,
  instrument_version text NOT NULL,
  scope text NOT NULL
    CHECK (scope IN ('subdimension', 'pillar', 'composite', 'bei')),
  scope_id text NOT NULL,
  rating_context text NOT NULL DEFAULT 'current'
    CHECK (rating_context IN ('current', 'retrospective')),
  value numeric(5, 2) NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capri_scores_unique_per_scope
    UNIQUE (response_id, scope, scope_id, rating_context)
);

CREATE INDEX IF NOT EXISTS capri_scores_response_idx
  ON public.capri_scores (response_id);

CREATE OR REPLACE FUNCTION public.set_capri_answers_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capri_answers_updated_at ON public.capri_answers;

CREATE TRIGGER capri_answers_updated_at
BEFORE UPDATE ON public.capri_answers
FOR EACH ROW
EXECUTE FUNCTION public.set_capri_answers_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
--
-- Students read and write only their own responses and answers. Institutional
-- admins can see WHO has completed (capri_responses) for participation
-- tracking, but never individual answers or individual scores -- the spec is
-- explicit that institutions receive aggregate reporting only. Aggregation for
-- the institutional report runs server-side under the service role.
-- ---------------------------------------------------------------------------

ALTER TABLE public.capri_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capri_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capri_administrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capri_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capri_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capri_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read capri instruments" ON public.capri_instruments;
CREATE POLICY "Authenticated read capri instruments"
ON public.capri_instruments FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated read capri items" ON public.capri_items;
CREATE POLICY "Authenticated read capri items"
ON public.capri_items FOR SELECT
TO authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Members read own institution administrations" ON public.capri_administrations;
CREATE POLICY "Members read own institution administrations"
ON public.capri_administrations FOR SELECT
TO authenticated
USING (
  public.current_user_role() = 'super_admin'
  OR institution_id = public.current_user_institution_id()
);

DROP POLICY IF EXISTS "Students read own capri responses" ON public.capri_responses;
DROP POLICY IF EXISTS "Students insert own capri responses" ON public.capri_responses;
DROP POLICY IF EXISTS "Students update own capri responses" ON public.capri_responses;

CREATE POLICY "Students read own capri responses"
ON public.capri_responses FOR SELECT
TO authenticated
USING (
  auth.uid() = student_id
  OR public.current_user_role() = 'super_admin'
  OR (
    public.current_user_role() = 'institutional_admin'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = capri_responses.student_id
        AND p.institution_id = public.current_user_institution_id()
    )
  )
);

CREATE POLICY "Students insert own capri responses"
ON public.capri_responses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students update own capri responses"
ON public.capri_responses FOR UPDATE
TO authenticated
USING (auth.uid() = student_id AND submitted_at IS NULL)
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students read own capri answers" ON public.capri_answers;
DROP POLICY IF EXISTS "Students insert own capri answers" ON public.capri_answers;
DROP POLICY IF EXISTS "Students update own capri answers" ON public.capri_answers;

CREATE POLICY "Students read own capri answers"
ON public.capri_answers FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.capri_responses r
    WHERE r.id = capri_answers.response_id
      AND r.student_id = auth.uid()
  )
);

CREATE POLICY "Students insert own capri answers"
ON public.capri_answers FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.capri_responses r
    WHERE r.id = capri_answers.response_id
      AND r.student_id = auth.uid()
      AND r.submitted_at IS NULL
  )
);

-- Answers stay editable only while the response is unsubmitted. Once a student
-- submits, their answers are frozen -- this is what makes B1 immutable.
CREATE POLICY "Students update own capri answers"
ON public.capri_answers FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.capri_responses r
    WHERE r.id = capri_answers.response_id
      AND r.student_id = auth.uid()
      AND r.submitted_at IS NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.capri_responses r
    WHERE r.id = capri_answers.response_id
      AND r.student_id = auth.uid()
      AND r.submitted_at IS NULL
  )
);

DROP POLICY IF EXISTS "Students read own capri scores" ON public.capri_scores;
CREATE POLICY "Students read own capri scores"
ON public.capri_scores FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.capri_responses r
    WHERE r.id = capri_scores.response_id
      AND r.student_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- Seed: CAPRI v2.0
-- ---------------------------------------------------------------------------

INSERT INTO public.capri_instruments (version, is_active)
VALUES ('2.0', true)
ON CONFLICT (version) DO UPDATE SET is_active = EXCLUDED.is_active;

INSERT INTO public.capri_items
  (instrument_version, id, section, pillar, subdimension, item_type, prompt, order_index)
VALUES
  -- Pillar 1 -- Identity & Brand Building
  ('2.0', 'P1-1', 'core', 1, '1A', 'likert5', 'I can clearly articulate the professional reputation I want to build.', 1),
  ('2.0', 'P1-2', 'core', 1, '1A', 'likert5', 'I can explain why I am pursuing my career direction in a way that is compelling to someone else.', 2),
  ('2.0', 'P1-3', 'core', 1, '1A', 'likert5', 'I understand how I am currently perceived in professional settings.', 3),
  ('2.0', 'P1-4', 'core', 1, '1B', 'likert5', 'I hold myself to a defined professional standard without external pressure, and I finish work to that standard rather than just "done."', 4),
  ('2.0', 'P1-5', 'core', 1, '1B', 'likert5', 'I take ownership of mistakes without defensiveness.', 5),
  ('2.0', 'P1-6', 'core', 1, '1B', 'likert5', 'I proactively manage how I show up in high-stakes environments.', 6),
  ('2.0', 'P1-7', 'core', 1, '1C', 'likert5', 'My LinkedIn and public professional profiles accurately represent the professional I am becoming.', 7),
  ('2.0', 'P1-8', 'core', 1, '1C', 'likert5', 'I can describe my strengths and accomplishments without minimizing or overstating them.', 8),
  ('2.0', 'P1-9', 'core', 1, '1C', 'likert5', 'I feel I belong in professional environments, even when I am the least experienced person in the room.', 9),

  -- Pillar 2 -- Executive Communication & Social Capital
  ('2.0', 'P2-1', 'core', 2, '2A', 'likert5', 'I communicate updates concisely and clearly.', 1),
  ('2.0', 'P2-2', 'core', 2, '2A', 'likert5', 'I summarize discussions into actionable next steps.', 2),
  ('2.0', 'P2-3', 'core', 2, '2A', 'likert5', 'I write professional emails that make a clear ask and are easy for the recipient to act on.', 3),
  ('2.0', 'P2-4', 'core', 2, '2B', 'likert5', 'I am comfortable speaking in professional group settings.', 4),
  ('2.0', 'P2-5', 'core', 2, '2B', 'likert5', 'I adjust my tone and level of detail depending on my audience, including senior leaders.', 5),
  ('2.0', 'P2-6', 'core', 2, '2B', 'likert5', 'When I disagree or am put on the spot, I seek context and stay composed rather than reacting.', 6),
  ('2.0', 'P2-7', 'core', 2, '2C', 'likert5', 'I build professional relationships intentionally, contributing value before I ask for anything.', 7),
  ('2.0', 'P2-8', 'core', 2, '2C', 'likert5', 'I follow up consistently after professional interactions and keep relationships warm over time.', 8),
  ('2.0', 'P2-9', 'core', 2, '2C', 'likert5', 'I understand how influence and decision-making actually work inside organizations.', 9),

  -- Pillar 3 -- Career Navigation Strategy & Execution
  ('2.0', 'P3-1', 'core', 3, '3A', 'likert5', 'I have a clear picture of the kind of role and environment I am targeting next.', 1),
  ('2.0', 'P3-2', 'core', 3, '3A', 'likert5', 'I have a system for tracking the opportunities, companies, and contacts I am pursuing.', 2),
  ('2.0', 'P3-3', 'core', 3, '3A', 'likert5', 'I know how to find opportunities that are not posted publicly.', 3),
  ('2.0', 'P3-4', 'core', 3, '3B', 'likert5', 'I can prioritize my work without needing constant direction.', 4),
  ('2.0', 'P3-5', 'core', 3, '3B', 'likert5', 'I think through the downstream and team-level consequences of a decision before I act.', 5),
  ('2.0', 'P3-6', 'core', 3, '3B', 'likert5', 'I know when to escalate an issue and when to solve it independently.', 6),
  ('2.0', 'P3-7', 'core', 3, '3C', 'likert5', 'I consistently meet deadlines without reminders.', 7),
  ('2.0', 'P3-8', 'core', 3, '3C', 'likert5', 'I communicate early when a deliverable is at risk.', 8),
  ('2.0', 'P3-9', 'core', 3, '3C', 'likert5', 'I maintain a working system for managing my tasks, calendar, and commitments.', 9),

  -- Behavioral evidence block -- "Thinking about the last 30 days only"
  ('2.0', 'B1-1', 'behavioral', 1, NULL, 'frequency_band', 'How many times did you update your resume, LinkedIn, or professional profile with a new accomplishment or experience?', 1),
  ('2.0', 'B1-2', 'behavioral', 1, NULL, 'frequency_band', 'How many times did you publicly share or document a professional win, project, or lesson (post, portfolio, presentation, newsletter)?', 2),
  ('2.0', 'B2-1', 'behavioral', 2, NULL, 'frequency_band', 'With how many new professional contacts did you have a real conversation -- an informational chat, coffee, or call (not a connection request)?', 3),
  ('2.0', 'B2-2', 'behavioral', 2, NULL, 'frequency_band', 'How many follow-up messages did you send to maintain an existing professional relationship?', 4),
  ('2.0', 'B3-1', 'behavioral', 3, NULL, 'frequency_band', 'How many opportunities (roles, internships, programs) did you actively advance by applying, getting referred, or interviewing?', 5),
  ('2.0', 'B3-2', 'behavioral', 3, NULL, 'frequency_band', 'How many professional meetings or calls did you enter with prepared notes, questions, or an agenda?', 6)
ON CONFLICT (instrument_version, id) DO UPDATE SET
  section = EXCLUDED.section,
  pillar = EXCLUDED.pillar,
  subdimension = EXCLUDED.subdimension,
  item_type = EXCLUDED.item_type,
  prompt = EXCLUDED.prompt,
  order_index = EXCLUDED.order_index;
