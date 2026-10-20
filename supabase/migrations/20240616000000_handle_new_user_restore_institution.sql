-- INTERIM. Supersedes the institution change in
-- 20240609000000_handle_new_user_ignore_metadata.sql until the explicit
-- provisioning code (lib/provision-profile.ts) is deployed.
--
-- Why: 20240609 set institution_id to NULL in the trigger, because sign-up
-- metadata is caller-controlled. That is correct ONLY alongside the code that
-- writes role and institution explicitly with the service role. That code is
-- written but not yet deployed, and the live build still relies on the trigger
-- reading institution_id from inviteUserByEmail metadata. Applying 20240609
-- against the deployed build makes every invited student land with no
-- institution: no cohort, no content, no report.
--
-- Safe in the meantime: public sign-up was disabled on 2026-10-19, so the only
-- caller that can set this metadata is Oscar's own service-role invite code.
-- Role stays pinned to 'student' -- that was the privilege-escalation fix and
-- it is retained here.
--
-- AT DEPLOY TIME: once lib/provision-profile.ts is live, re-apply the body of
-- 20240609000000 to close the metadata path for good.
--
-- Applied to live 2026-10-20.

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
    (NEW.raw_user_meta_data->>'institution_id')::uuid,
    COALESCE(
      NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''),
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;
