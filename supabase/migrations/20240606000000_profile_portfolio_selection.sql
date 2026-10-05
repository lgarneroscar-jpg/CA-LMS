-- S8: which saved exercises a student has chosen for their portfolio document.
--
-- Deliberately separate from exercise_answers.is_public: "visible to my cohort"
-- and "send to an employer" are different decisions. Stored as a JSON array of
-- "<module_id>:<exercise_key>" strings so the choice survives answer edits.
--
-- Written only by the savePortfolioSelection server action under the service
-- role; S6's column-level UPDATE grants on profiles are unchanged, so client
-- roles cannot write it directly. Additive; no existing data is modified.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS portfolio_selection jsonb NOT NULL DEFAULT '[]'::jsonb;
