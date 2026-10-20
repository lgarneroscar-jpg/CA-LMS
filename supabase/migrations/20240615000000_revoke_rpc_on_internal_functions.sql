-- Supabase's database linter flagged every SECURITY DEFINER function added in
-- 20240608000000 and 20240611000000 as callable over the REST API at
-- /rest/v1/rpc/<name>, by anon as well as authenticated. Nothing in the app
-- calls them that way.
--
-- The three trigger functions are fired by the trigger mechanism and do not
-- need EXECUTE granted to any client role; revoking it removes the RPC
-- endpoints without affecting the triggers.
--
-- institution_of_user is referenced inside the exercise_answers SELECT policy.
-- A policy expression is evaluated with the querying user's privileges, so
-- `authenticated` must keep EXECUTE or that policy stops resolving and students
-- lose access to their own answers. anon never reads that table, so only the
-- unauthenticated surface is removed. It returns a uuid given a uuid and
-- exposes no personal data, which is why keeping the signed-in grant is
-- acceptable.
--
-- Applied to live 2026-10-20. Verified after: anon EXECUTE false on all four;
-- authenticated EXECUTE false on the three trigger functions, true on
-- institution_of_user.

REVOKE EXECUTE ON FUNCTION public.force_private_in_demo() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_profile_is_demo() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_exercise_answer_institution() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.institution_of_user(uuid) FROM PUBLIC, anon;
