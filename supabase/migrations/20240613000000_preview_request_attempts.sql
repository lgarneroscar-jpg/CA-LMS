-- Rate-limit log for POST /api/preview-request.
-- Counts are per IP (hour) and per email domain (day). Service role only:
-- no policies, and anon/authenticated have no privileges.

CREATE TABLE IF NOT EXISTS public.preview_request_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  email_domain text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS preview_request_attempts_ip_created_idx
  ON public.preview_request_attempts (ip, created_at DESC);

CREATE INDEX IF NOT EXISTS preview_request_attempts_domain_created_idx
  ON public.preview_request_attempts (email_domain, created_at DESC);

ALTER TABLE public.preview_request_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.preview_request_attempts FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.preview_request_attempts IS
  'Accepted public preview requests, for rate limits. No personal names. Service role only.';
