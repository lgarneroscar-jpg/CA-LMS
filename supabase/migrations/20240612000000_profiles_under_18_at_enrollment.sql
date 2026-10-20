-- Students under 18 need a parent or guardian signature before their written
-- work can be used in marketing. The flag is known at enrolment. A boolean
-- answers that question without storing a date of birth.
--
-- Default false: existing rows are not marked under 18. Correct those by
-- re-reading the roster, not by guessing.
--
-- Not added to the column-level UPDATE grant in
-- 20240605000000_lock_student_outcome_writes.sql, so authenticated clients
-- cannot set it. Only service-role provisioning writes it.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS under_18_at_enrollment boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.under_18_at_enrollment IS
  'True when the student was under 18 at enrollment. Publicity use of their work needs a parent or guardian signature. Not a date of birth.';
