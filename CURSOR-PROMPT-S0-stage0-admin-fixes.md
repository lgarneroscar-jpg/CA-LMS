# Cursor prompt — S0: Stage 0 admin fixes + R1 follow-ups

Copy everything below the line into Cursor. **One commit. No new features — correctness and hygiene only.**

Two migration files and the production data fix are already done (see "Already done" at the bottom). Do not redo them.

---

Six small fixes across the admin/reporting side. None of them change student-facing content or scoring.

## 1. Clamp the displayed cohort week to the program length

`/admin/[institution-id]/dashboard` currently reads **"Cohort Week 15"** for Demo University. The math is honest — that cohort started 2026-05-23, which really is 14+ weeks ago — but the program is 12 weeks, so the label is wrong.

- Add an exported constant `PROGRAM_LENGTH_WEEKS = 12` to `lib/drip.ts`.
- **Do NOT clamp `getProgramWeek()` itself** — drip unlocking and "has the program ended" logic need the raw value.
- In `lib/cohort-analytics.ts`, add a `displayWeek` to `CohortAnalytics`, computed as `Math.min(Math.max(1, currentWeek), PROGRAM_LENGTH_WEEKS)`. Keep `currentWeek` raw.
- Use `displayWeek` for any "Cohort Week N" / "Week N of 12" label in the admin dashboard and student-detail pages.
- Where a cohort is past the end (`currentWeek > PROGRAM_LENGTH_WEEKS`), render "Week 12 of 12 · program complete" rather than a number above 12.

Note: `targetWeek` does **not** need clamping for correctness — every module unlocks by week 12, so `unlock_week <= 15` and `unlock_week <= 12` select the same set and `pacePercent` is unaffected. Clamp it anyway for clarity, but do not expect the number to move.

## 2. Sort by curriculum week everywhere, not by module number

**Decision (2026-08-29): `unlock_week` is the source of truth for sequence. Within a week, ascending P-number.**

Module numbers deliberately do not track the calendar — the 15→14 renumber left P14 in week 9 and P11/P12 in week 12. So the true order is:

```
Wk 1  P1 · P2 · P3        Wk 7  P8 · P9
Wk 2  LS1                 Wk 8  LS4
Wk 3  P4 · P5             Wk 9  P10 · P14
Wk 4  LS2                 Wk 10 LS5
Wk 5  P6 · P7             Wk 11 P13
Wk 6  LS3                 Wk 12 P11 · P12
```

`lib/program-nav.ts` currently sorts students by P-number via `parseModuleNumber`, which puts P11 (week 12) ahead of P13 (week 11) and P14 (week 9). That contradicts the rule above and disagrees with every admin surface.

- In `buildProgramNavByPillar`, sort by `(unlock_week, order_index)` and use `parseModuleNumber` only as a final tie-break.
- Keep `parseModuleNumber` exported — it is still the right tie-break — but it must no longer be the primary key.
- Check every other consumer of `parseModuleNumber` and apply the same rule.

**Then stop this from going stale again.** `scripts/seed-workbook-content.ts` writes `unlock_week` but never writes `order_index`, which is exactly why C3's week changes left the ordering behind. Fix that:

- Add an `order_index` to each module in `workbook-content-seed.md` (alongside the existing `**pillar:** N | **unlock_week:** N` line), parse it in `lib/workbook-seed-parser.ts`, and write it in the `.update({...})` call in `scripts/seed-workbook-content.ts`.
- Add a seed-time assertion that **fails loudly** if any two non-live modules share the same `(unlock_week, order_index)` pair. That ambiguity is the actual defect here; the seed should refuse to create it.

## 3. Fix the quiz status indicator

`app/(protected)/superadmin/content/page.tsx` line ~117 reads `ok={status.quizCount >= 5}`. Every module has exactly **4** questions (56 ÷ 14), canonized in the Q1 pass, so this renders `Quiz (4): —` for all 14 modules and reports healthy content as broken.

- Add `export const QUIZ_QUESTIONS_PER_MODULE = 4;` to `lib/module-content-status.ts`.
- Change the check to `status.quizCount >= QUIZ_QUESTIONS_PER_MODULE`.
- Do not change any quiz content, scoring, or gating.

## 4. Stop swallowing query errors in cohort analytics

`lib/cohort-analytics.ts` destructures `{ data: students }` and drops `error`. When `profiles.last_login` did not exist, that select failed and the page rendered an **empty roster with no error** — the R1 blocker took a full systematic-elimination pass to find because of this.

- Destructure and handle `error` on **every** Supabase call in this file.
- On error, log with enough context to identify the query, and either throw or return `null` so the caller renders an error state. **An empty cohort and a failed query must never look the same.**
- Apply the same treatment anywhere else in `lib/` that silently drops a Supabase `error`.

## 5. Regenerate the database types

`types/database.ts` predates `profiles.last_login`. Regenerate against the current schema so the column is typed and the `select` is checked at compile time.

## 6. Exclude demo data from real reporting

`profiles.is_demo` exists and is now `true` for the 8 Demo University seed students. Anywhere admin reporting aggregates across **institutions** (cross-institution rollups, totals, averages), exclude `is_demo = true` rows. Do **not** exclude them from single-institution views — Demo University is meant to show its own seeded data.

## Acceptance criteria

- `npm run build` passes.
- No admin surface renders a cohort week above 12.
- Student program nav and all three admin surfaces render the same order: P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P14, P13, P11, P12.
- `/superadmin/content` shows `Quiz (4): ✓` for all 14 modules.
- `npm run seed:workbook` writes `order_index` and aborts on a duplicate `(unlock_week, order_index)` pair.
- No Supabase call in `lib/cohort-analytics.ts` discards its `error`.
- No changes to workbook body content, quiz content, scoring, XP, or gating.

List every file you change.

---

## Already done — do not redo

- `supabase/migrations/20240602000000_profiles_last_login.sql` — written, idempotent, records the existing column.
- `supabase/migrations/20240602100000_fix_module_order_index.sql` — written **and already applied to production**. The `order_index` values in the database are correct as of 2026-08-29; verify against the week table above rather than changing data.
- Demo University is seeded with 8 students (`is_demo = true`, `@demo.test`).

## After Cursor — REQUIRED

1. `npm run build`
2. Commit + push (e.g. `fix: stage 0 admin corrections + R1 follow-ups`)
3. **Re-seed** once `order_index` is in the seed file: `npx tsx --env-file=.env.local scripts/seed-workbook-content.ts` — never `seed:content`
4. Verify live: cohort week reads 12 not 15; module order matches the table above on both student and admin surfaces; `/superadmin/content` shows all green.
