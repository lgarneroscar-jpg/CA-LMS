-- Fix modules.order_index
--
-- order_index was last written by 20240526200000_seed_phase3_all_modules.sql
-- (now deprecated). npm run seed:workbook writes unlock_week but NEVER writes
-- order_index, so when C3 changed unlock weeks the ordering data was left
-- behind and went stale.
--
-- The values were also not unique within a week -- P1 and P3 were both 1, and
-- P11 and P12 were both 1 -- so any ORDER BY (unlock_week, order_index) had
-- ambiguous ties and rendered week 1 as P1, P3, P2.
--
-- CANONICAL RULE (decided 2026-08-29): unlock_week is the source of truth for
-- curriculum sequence. Within a week, order by ascending P-number. Module
-- numbers deliberately do NOT track the calendar -- P14 lands in week 9 and
-- P11/P12 in week 12 -- as a result of the 15 -> 14 module renumber.
--
-- Resulting structure: self-paced modules on odd weeks, live sessions on even
-- weeks, weeks 11 and 12 closing the program.

UPDATE public.modules SET order_index = v.oi
FROM (VALUES
  ('P1', 1), ('P2', 2), ('P3', 3),   -- week 1
  ('P4', 1), ('P5', 2),              -- week 3
  ('P6', 1), ('P7', 2),              -- week 5
  ('P8', 1), ('P9', 2),              -- week 7
  ('P10', 1), ('P14', 2),            -- week 9
  ('P13', 1),                        -- week 11
  ('P11', 1), ('P12', 2)             -- week 12
) AS v(code, oi)
WHERE public.modules.module_code = v.code
  AND public.modules.is_live_session = false;

-- Live sessions are alone in their weeks (LS1 w2, LS2 w4, LS3 w6, LS4 w8, LS5 w10).
UPDATE public.modules SET order_index = 1 WHERE is_live_session = true;
