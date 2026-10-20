-- =============================================================================
-- Preview institution display name: "Demo University" -> "Northfield University"
--
-- Display only. No slug, route segment or seed key derives from
-- institutions.name: routes use the id, scripts/seed-demo-cohort.ts and
-- lib/preview.ts key off the id, and the only name lookups in the codebase are
-- for the separate 'Demo Preview' institution. The 'Demo University' match in
-- 20240608000000's backfill is historical and already applied.
--
-- Keyed by id and guarded by is_demo so it can never rename a real
-- institution; a no-op where the row doesn't exist.
-- =============================================================================

UPDATE public.institutions
SET name = 'Northfield University'
WHERE id = 'ffc653d3-da74-4141-afa5-be70d6eaf1c8'
  AND is_demo
  AND name = 'Demo University';
