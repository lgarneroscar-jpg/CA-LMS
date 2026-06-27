-- RLS policies reference current_user_role() and current_user_institution_id().
-- Authenticated users must have EXECUTE for policy evaluation during login/queries.
-- Anon must NOT execute these (no session / no profile).

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_institution_id() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_user_institution_id() FROM anon;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
