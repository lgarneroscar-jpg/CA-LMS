-- =============================================================================
-- Keep exercise_answers.institution_id populated
--
-- 20240608000000 added the column, backfilled it and created a partial index on
-- (institution_id) WHERE is_public, but the trigger that maintains it failed to
-- apply at the time, so new rows were being written with a null institution.
-- The column and its index were decoration.
--
-- Access control does not depend on this: the cohort SELECT policy resolves the
-- author's institution through institution_of_user(). This keeps the column
-- honest so the index is usable and the drift-migration verification query
-- ("answers with a null institution should be 0") stays true.
--
-- Applied to live 2026-10-14 and verified: 0 rows with a null institution.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_exercise_answer_institution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  SELECT institution_id INTO NEW.institution_id
  FROM public.profiles WHERE id = NEW.user_id;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_set_exercise_answer_institution ON public.exercise_answers;
CREATE TRIGGER trg_set_exercise_answer_institution
  BEFORE INSERT OR UPDATE OF user_id ON public.exercise_answers
  FOR EACH ROW EXECUTE FUNCTION public.set_exercise_answer_institution();

UPDATE public.exercise_answers ea
SET institution_id = p.institution_id
FROM public.profiles p
WHERE p.id = ea.user_id
  AND ea.institution_id IS DISTINCT FROM p.institution_id;
