-- Retention for the public preview-request rate-limit log.
--
-- preview_request_attempts stores an IP address per request and had no expiry,
-- so a public endpoint would accumulate them indefinitely. The rate limits only
-- look back one hour (per IP) and one day (per email domain), so rows older
-- than that have no function. Seven days leaves room to investigate abuse while
-- keeping the window short.
--
-- Applied to live 2026-10-20 and verified: job active, function returns 0 on an
-- empty table.

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.purge_preview_request_attempts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  removed integer;
BEGIN
  DELETE FROM public.preview_request_attempts
  WHERE created_at < now() - interval '7 days';
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$function$;

REVOKE ALL ON FUNCTION public.purge_preview_request_attempts() FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.purge_preview_request_attempts() IS
  'Deletes preview_request_attempts rows older than 7 days. Scheduled daily by pg_cron job purge-preview-request-attempts.';

-- cron.schedule upserts by job name, so re-applying this migration is safe.
-- 04:17 UTC rather than on the hour, to stay off the busiest scheduler minute.
SELECT cron.schedule(
  'purge-preview-request-attempts',
  '17 4 * * *',
  $job$SELECT public.purge_preview_request_attempts();$job$
);
