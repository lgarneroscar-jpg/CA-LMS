-- Create login_events and reports
--
-- Both tables are declared in 20240527000000_phase4_gamification_admin.sql but
-- were never actually present in the production database -- that migration was
-- only partially applied. lib/cohort-analytics.ts queries login_events; the
-- error was silently discarded until the S0 pass made query failures throw,
-- at which point /admin/[institution-id]/dashboard started returning 500.
--
-- Same class of drift as the missing profiles.last_login column. The applied
-- migration history in Supabase uses 2026-series version numbers that do not
-- correspond to the 2024-series files in this folder, so this directory has
-- not been the source of truth for the production schema. A full repo-vs-database
-- diff is scheduled for the testing phase.
--
-- recalculate_cohort_ranks() from the same Phase-4 migration is ALSO absent from
-- production. It is not created here because nothing currently calls it --
-- ranks are set directly. Revisit if rank recalculation is ever wired up.
--
-- Idempotent: safe to run against the database where it has already been applied.

CREATE TABLE IF NOT EXISTS public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  logged_in_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_events_user_id_idx ON public.login_events(user_id);
CREATE INDEX IF NOT EXISTS login_events_logged_in_at_idx ON public.login_events(logged_in_at);

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reports_institution_id_idx ON public.reports(institution_id);

ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- login_events: users write and read their own; admins read within scope.
DROP POLICY IF EXISTS "Users insert own login events" ON public.login_events;
CREATE POLICY "Users insert own login events" ON public.login_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own login events" ON public.login_events;
CREATE POLICY "Users read own login events" ON public.login_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read login events in scope" ON public.login_events;
CREATE POLICY "Admins read login events in scope" ON public.login_events
  FOR SELECT USING (
    current_user_role() = 'super_admin'
    OR (
      current_user_role() = 'institutional_admin'
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = login_events.user_id
          AND p.institution_id = current_user_institution_id()
      )
    )
  );

-- reports: admin-only, scoped by institution. Students have no access.
DROP POLICY IF EXISTS "Admins manage reports in scope" ON public.reports;
CREATE POLICY "Admins manage reports in scope" ON public.reports
  FOR ALL USING (
    current_user_role() = 'super_admin'
    OR (
      current_user_role() = 'institutional_admin'
      AND reports.institution_id = current_user_institution_id()
    )
  ) WITH CHECK (
    current_user_role() = 'super_admin'
    OR (
      current_user_role() = 'institutional_admin'
      AND reports.institution_id = current_user_institution_id()
    )
  );
