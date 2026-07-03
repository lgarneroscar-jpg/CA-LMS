-- Living workbook: per-exercise answer persistence with optional public sharing

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS default_answer_visibility boolean;

CREATE TABLE IF NOT EXISTS public.exercise_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  exercise_key text NOT NULL,
  answer jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exercise_answers_user_module_key_unique
    UNIQUE (user_id, module_id, exercise_key)
);

CREATE INDEX IF NOT EXISTS exercise_answers_module_id_idx
  ON public.exercise_answers (module_id);

CREATE INDEX IF NOT EXISTS exercise_answers_public_idx
  ON public.exercise_answers (is_public)
  WHERE is_public = true;

CREATE OR REPLACE FUNCTION public.set_exercise_answers_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS exercise_answers_updated_at ON public.exercise_answers;

CREATE TRIGGER exercise_answers_updated_at
BEFORE UPDATE ON public.exercise_answers
FOR EACH ROW
EXECUTE FUNCTION public.set_exercise_answers_updated_at();

ALTER TABLE public.exercise_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own or public exercise answers" ON public.exercise_answers;
DROP POLICY IF EXISTS "Users insert own exercise answers" ON public.exercise_answers;
DROP POLICY IF EXISTS "Users update own exercise answers" ON public.exercise_answers;
DROP POLICY IF EXISTS "Users delete own exercise answers" ON public.exercise_answers;

CREATE POLICY "Users read own or public exercise answers"
ON public.exercise_answers FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users insert own exercise answers"
ON public.exercise_answers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own exercise answers"
ON public.exercise_answers FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own exercise answers"
ON public.exercise_answers FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
