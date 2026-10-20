-- =============================================================================
-- handle_new_user: stop deriving institution from sign-up metadata
--
-- raw_user_meta_data is whatever the caller passed to signUp({ options: { data }}),
-- and public sign-up is enabled, so a self-registering user could attach
-- themselves to any institution by supplying its id. Role was already pinned to
-- 'student' in 20240608000000; this pins institution to NULL.
--
-- Invited and admin-created users get their role and institution from an
-- explicit service-role write after the auth user exists
-- (lib/provision-profile.ts, called from app/actions/roster-invites.ts,
-- app/actions/preview-invites.ts and app/api/create-user/route.ts).
--
-- full_name is still read from metadata: it is display-only and grants nothing.
-- ON CONFLICT keeps the trigger harmless if a profile row was written first.
-- =============================================================================

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

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
