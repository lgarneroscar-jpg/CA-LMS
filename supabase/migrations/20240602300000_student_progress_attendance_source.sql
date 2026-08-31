-- Live session attendance provenance: self-reported vs admin-confirmed.

ALTER TABLE public.student_progress
  ADD COLUMN IF NOT EXISTS attendance_source text
    CHECK (
      attendance_source IS NULL
      OR attendance_source IN ('self_reported', 'admin_confirmed')
    ),
  ADD COLUMN IF NOT EXISTS attendance_confirmed_by uuid
    REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.student_progress.attendance_source IS
  'For live-session rows only: self_reported (student button) or admin_confirmed. NULL for content modules.';

COMMENT ON COLUMN public.student_progress.attendance_confirmed_by IS
  'Institutional admin who confirmed attendance. NULL for self-reported or content modules.';

-- Existing live-session completions were all student self-reports.
UPDATE public.student_progress sp
SET attendance_source = 'self_reported'
FROM public.modules m
WHERE sp.module_id = m.id
  AND m.is_live_session = true
  AND sp.is_complete = true
  AND sp.attendance_source IS NULL;
