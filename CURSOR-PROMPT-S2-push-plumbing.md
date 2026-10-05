# Cursor prompt — S2: report snapshots, deltas, and the sendable report

Copy everything below the line into Cursor. **This is the largest pass so far — split into two commits if it helps: (A) snapshots + deltas, (B) report artifact + demo/empty states.**

---

Institutions do not log in. Oscar generates a report and sends it. This pass builds that: reliable snapshots, honest "since last report" deltas, and the artifact itself.

## 0. What is broken today — verified, not theoretical

`lib/reports.ts` → `maybeGenerateReportSnapshot()` is called from the admin dashboard's render path. Consequences, all confirmed in the live database:

- **It fired five times on 2026-08-29 for one institution**, producing five identical rows, because it does a check-then-insert with no database constraint and page loads raced each other.
- **"Cadence" is only a start delay, not a period.** `daysSinceStart < cadenceWeeks * 7` returns early before week 4 and then passes forever. After that, every dashboard load on a new day writes another snapshot whose `period_end` is *whatever day Oscar happened to open the page*. Report periods are therefore determined by browsing behaviour.
- **It fails silently in four places** — no admin client, no institution, no cohort start date, no analytics — each an unconditional `return`. A reporting pipeline that silently does nothing is the failure mode this project has already been bitten by three times (`last_login`, `login_events`, `exercise_responses`).
- Snapshots stored raw `currentWeek: 15` and `16` — the unclamped value, from before the S0 display fix.

**Already done for you:** the accidental rows were deleted and a unique index `reports_institution_period_end_idx` on `(institution_id, period_end)` now exists. Do not re-create it; do rely on it.

## 1. Make snapshot generation deliberate

- **Delete the call from the dashboard render path.** Rendering a page must never write reporting history.
- Provide two entry points:
  1. An explicit **"Generate report" action** in admin, which states the period it is about to cover and asks for confirmation.
  2. A **scheduled route** (`app/api/cron/generate-snapshots/route.ts`) that runs on a cadence, protected by a secret compared with `crypto.timingSafeEqual` (not `===`), returning 401 otherwise. Add the Vercel cron entry.
- **Period boundaries must come from the cadence, not from today.** Compute period N from `cohort_start_date + N × cadenceWeeks`, so the same period always has the same boundaries no matter when generation runs. Late generation must still produce the *correct* period, not a window ending today.
- Rely on the unique index for idempotency: `ON CONFLICT (institution_id, period_end) DO NOTHING`, or an explicit regenerate path that updates in place.
- **No silent returns.** Every failure logs with context and surfaces to the caller. The cron route returns a per-institution result summary.

## 2. Version the snapshot envelope

Wrap the analytics payload rather than storing it bare:

```
{
  snapshotVersion: 1,
  completionDefinition: COMPLETION_DEFINITION_VERSION,  // "workbook+quiz75"
  generatedAt, generatedBy: "cron" | "manual",
  cohortSize,
  metrics: { ...analytics }
}
```

`COMPLETION_DEFINITION_VERSION` already exists in `lib/module-gates.ts` and is currently `"workbook+quiz75"`. It changed once (`quiz-only` → now) and **will change again when real videos land and the video gate is enabled.**

Store the **clamped** `displayWeek` and `programComplete`, not the raw `currentWeek`. A snapshot is a report artifact; it should never carry "Week 16 of 12".

## 3. Deltas — and refuse to compare across definitions

Add "since last report" by diffing the current snapshot against the previous one for that institution: completion, workbook, quiz average, attendance, engagement, students needing attention.

**Hard rule: if `completionDefinition` differs between the two snapshots, do NOT render a completion delta.** Show "definition changed — not comparable" instead, with both values labelled. Flipping a gate changes what "complete" means; a diff across that boundary shows movement that never happened. This is the entire reason the constant exists — do not soften it into a warning next to a number.

Metrics unaffected by the definition change (attendance, workbook counts, engagement) may still be compared; be precise about which.

## 4. The report artifact

The thing Oscar sends. One page per institution per period, printable to PDF, self-contained.

Contents, in order: cohort identity and period · participation and completion · workbook depth · quiz performance with its denominator · attendance **with source labels** · what changed since last report · students needing attention with reasons · **an outcomes section reserved for CAPRI**.

- **The CAPRI section must be pluggable and absent-safe.** CAPRI is being designed in a separate thread and does not exist yet. Define the interface, render "Not yet available" when there is no data, and make sure adding it later requires no change to the generator. Do not invent CAPRI fields.
- Every figure states its definition or its source. Reuse the S1.5 labels — do not re-word them into something vaguer.
- No student workbook or diagnostic answer text. Counts only, exactly as on screen.
- Institutions still do not log in: this renders for Oscar, who exports and sends it. No institution-facing auth in this pass.

## 5. Demo cohort refresh — a script, not a special code path

**Oscar's constraint, and it is the right one: the demo must not run on different logic than production.** So do not add demo-only branches, and do not compute recency differently for demo rows. Fix the data instead.

Demo University's recency is stored, so it decays: engagement fell to 11% and eight of nine students read as "Inactive" within a week of seeding. Every day it looks more abandoned.

- Add `scripts/seed-demo-cohort.ts` (`npm run seed:demo`) that rebuilds the Demo University fixtures **relative to `now()`** — profiles, progress, workbook answers, login events, attendance — using the same offsets the fixtures use today (inactivity 0/1/2/5/9/16/27/40 days; workbook 31/27/20/17/12/7/3/0; attendance deliberately uncorrelated with completion).
- Idempotent, scoped to `is_demo = true` and Demo University, and it must **refuse to run against any institution containing non-demo students**.
- Completed modules must have every exercise answered and a quiz score ≥ 3 of 4 — the fixtures must satisfy the current completion definition, or the demo misrepresents the product.
- Include one student who has **passed a quiz but not finished their exercises**, so "Modules passed" and "Quiz" visibly differ. They are identical today only because no fixture student is in that state.
- Optionally wire it to the same cron so the demo stays fresh without anyone remembering.

## 6. Honest early-cohort states — this is a real feature, not a demo hack

Oscar's other observation: *"it looks abandoned until it's actually used."* That is true of every genuine new cohort too. Week 1 of a real programme shows 0% everywhere, and the first report an institution receives should not read like a disaster.

- **Before `cohort_start_date`:** "Cohort starts in N days — no activity expected yet." Suppress pace, behind-pace and attention entirely.
- **Weeks 1–2:** show participation and diagnostic completion; do not flag anyone as "behind pace" before there is anything to be behind on.
- **Zero-data metrics:** render "—" with "no data yet", never `0%`. Zero and absent must not look the same — the same rule S1 applied to `averageQuizScore`.
- Report generation before any meaningful activity should say so rather than emit a page of zeros.

This benefits real institutions, and it fixes the demo's worst look as a side effect — without any demo-specific logic.

## Acceptance criteria

- `npm run build` passes.
- Loading the admin dashboard writes nothing to `reports`. Confirm by loading it repeatedly and checking the row count is unchanged.
- Generating twice for the same period produces one row.
- Period boundaries derive from `cohort_start_date` + cadence; generating late yields the correct period, not a window ending today.
- Every snapshot carries `snapshotVersion`, `completionDefinition`, `generatedAt`, `generatedBy`, and a clamped `displayWeek`.
- A delta across two different `completionDefinition` values renders "not comparable" and no completion number.
- The report artifact renders with the CAPRI section showing "Not yet available", and prints cleanly.
- The cron route rejects a wrong secret with 401 and uses `timingSafeEqual`.
- `npm run seed:demo` rebuilds Demo University relative to today and refuses to touch a non-demo institution.
- A pre-start cohort shows "starts in N days" and flags nobody.
- No student answer text anywhere. No changes to learning content, scoring, XP, or gates.

List every file you change, state how period boundaries are computed, and confirm the dashboard no longer writes to `reports`.

---

## After Cursor — REQUIRED

1. `npm run build`
2. Commit + push (one or two commits as above)
3. Tell me the commit and whether a migration is needed — I will apply it and verify snapshot generation, the duplicate guard, and the delta refusal directly against the database.
4. Set `CRON_SECRET` in Vercel before the scheduled route goes live.
