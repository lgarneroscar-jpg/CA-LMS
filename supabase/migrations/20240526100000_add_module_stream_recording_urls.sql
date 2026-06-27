-- Phase 3: live session stream/recording URLs + unique module_code for upserts
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS stream_url text,
  ADD COLUMN IF NOT EXISTS recording_url text;

CREATE UNIQUE INDEX IF NOT EXISTS modules_module_code_key ON public.modules (module_code);
