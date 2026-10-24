-- Closes the interim restore in 20240616000000.
--
-- lib/provision-profile.ts is now deployed (commit 5f16ff7) and both
-- app/actions/roster-invites.ts and app/actions/preview-invites.ts call it to
-- write role and institution explicitly with the service role. The trigger no
-- longer needs to read institution_id from sign-up metadata, so it stops doing
-- so: metadata is caller-controlled and nothing caller-controlled should decide
-- which cohort an account joins.
--
-- End state, and the intended one: every profile is created as a 'student' with
-- no institution. Role and institution are set afterwards, deliberately, by
-- service-role code.
--
-- Applied to live 2026-10-20, after the deploy.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, role, institution_id, full_name)
  VALUES (
    NEW.id,
    'student',
    NULL,
    COALESCE(
      NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''),
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;
