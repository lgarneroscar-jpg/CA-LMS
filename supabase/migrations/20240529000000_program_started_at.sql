-- Progress-based program start (set when student clicks Go on dashboard).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS program_started_at timestamptz;
