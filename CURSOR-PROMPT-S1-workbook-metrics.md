# Cursor prompt — S1: workbook activity metrics + reporting correctness

Copy everything below the line into Cursor. **One commit. Read-only reporting additions plus two correctness fixes — no changes to student-facing pages, saving, scoring, or gating.**

---

The living workbook is the product's differentiator and it is currently **invisible to every admin view**. A buyer can see that a student finished a module but not that they did the work inside it. This pass surfaces that, and fixes two reporting bugs found while verifying S0.

## 0. Read the right table — this matters

There are two exercise tables:

- **`exercise_answers`** — LIVE. Written by `app/actions/exercise-answers.ts` (Pass 2 living workbook). Columns: `user_id`, `module_id`, `exercise_key`, `answer` (jsonb, shape `{ values: Record<string, ...> }`), `is_public`, `created_at`, `updated_at`. **102 rows currently seeded across the Demo University cohort.**
- **`exercise_responses`** — LEGACY. Flat `response` text, keyed `student_id`. Written only by `app/api/create-user/route.ts`. **0 rows.**

**All workbook metrics must read `exercise_answers`.** Reading `exercise_responses` would silently report zeros forever — the same failure shape as the `login_events` bug. Do not "fix" the discrepancy by merging them; leave `exercise_responses` alone.

## 1. Workbook activity metrics [the main event]

The catalog has **31 exercises across 14 modules**, unevenly distributed — P8, P9 and P10 have 1 each; P13 has 5. Count exercises from `modules.exercises` (a jsonb array; each entry has `key`, `input_type`, `fields[]`), never a hardcoded number.

**"Answered" must reuse `isAnswerEmpty()` from `lib/exercise-answers.ts`.** That function already encodes the per-input-type rules — anchor pairs, rewrite pairs, `fill_blank` blank-key derivation, scorecard score/notes. Do not reimplement the "is this answered" test; a row existing is not the same as a row having content, and that distinction is exactly what caused the Pass 2 save bugs.

Add to `lib/cohort-analytics.ts`:

- **Per student:** `workbookAnswered` (count of non-empty answers), `workbookTotal` (31, computed), `workbookPercent`, `lastWorkbookActivity` (max `updated_at`, nullable), `workbookModulesTouched`.
- **Per cohort:** average workbook completion, and a count of students with **zero** workbook activity — that group is the intervention list.

**Display format (Oscar's decision): depth + recency.** Render as *"24 of 31 exercises · last activity 2 days ago"*, not a bare percentage. A student at 80% who has not touched it in three weeks and one at 80% who wrote yesterday are different situations, and the report needs to distinguish them. Where a student has never started, say *"No workbook activity"* rather than "0 of 31".

Surface it on: the admin dashboard cohort-health block, the student roster (a column), and the student detail page (per-module breakdown).

## 2. Answer privacy — counts only

**Oscar's decision: admins see counts and recency, NEVER answer text.** The workbook holds personal reflection — identity anchors, confidence, purpose, career doubts. Students wrote it for themselves and their own profile, not for their institution.

- Do **not** add any admin UI that renders `answer` content, not even `is_public` ones, and not even for super_admin.
- Do **not** widen RLS on `exercise_answers`. If the existing policies do not permit an admin to run a COUNT within their institution, add a **count-only** path — a `SECURITY DEFINER` function returning aggregates, or an admin-scoped view exposing `user_id, module_id, exercise_key, updated_at, is_public` and **not** `answer`. State clearly in your summary which approach you used and why.
- This is a one-way door. Counts can be loosened later; exposed reflection cannot be un-seen.

## 3. Fix `averageQuizScore` — it counts non-takers as zero

In `lib/cohort-analytics.ts`, `averageQuizScore` sums every student's `quizAverage` and divides by **all** students, so students who have taken no quiz contribute 0. Demo University's true average among the 7 students who have taken quizzes is **81%**; the dashboard reports **63%** (81 × 7⁄9).

This makes a *participation* problem look like a *comprehension* problem — and it is the kind of number that goes into an institutional report.

- Average only over students with at least one completed quiz.
- Return the denominator alongside it and render it: **"81% · 7 of 9 students"**.
- Return `null` (render "—") when nobody has taken a quiz, rather than 0. Zero and "no data" must not look identical — same principle as the S0 error handling.
- Apply the same review to `overallCompletionRate`: there, including everyone IS correct (a non-starter genuinely is 0% complete). Leave it, but add a comment saying the difference is deliberate so nobody "fixes" it later.

## 4. Per-student quiz performance

`quiz_score` is a **raw correct-answer count (0–4)**, not a percentage — `app/actions/module-progress.ts` does `score += 1` per correct answer. Any display must divide by the module's question count.

On student detail, show per-module quiz results as **"3 of 4"** plus a percentage, and flag modules scored below 50%. Add a `QUIZ_SCORE_IS_RAW_COUNT` comment at the read site; a seed written against the wrong assumption already produced a "1577%" on the live dashboard.

## 5. "Needs attention" with reasons

The behind-pace list currently shows names and percentages with no *why*. Give each flagged student one or more reasons, in priority order:

1. `No workbook activity` — zero non-empty answers
2. `Inactive N days` — from `last_active_date`
3. `Behind pace` — existing `isBehindPace`
4. `Diagnostic incomplete` — `diagnostic_complete = false`
5. `Low quiz average` — below 50%, only when they have taken at least one

Render as chips. Attendance is **NOT** a reason — it is reported, never required.

## 6. Cohort attendance summary

Attendance lives in `student_progress` rows against `is_live_session` modules (`is_complete = true`); there is no attendance table. Add a cohort roll-up: attendance rate per session (LS1–LS5) and per student ("3 of 5").

Present it **beside, not blended into**, completion. In the Demo cohort, Casey is 71% complete with 0/5 sessions and Gray is 7% complete with 5/5 — attendance and completion are deliberately uncorrelated, and the report must not imply otherwise.

## 7. Roster sort stability

The roster reordered between two loads of the same page: "Test Student" (`rank` is NULL) appeared in different positions. Sort by an explicit, total ordering — `completionPercent DESC, xp DESC, full_name ASC` — with NULL ranks sorted last deterministically.

## Acceptance criteria

- `npm run build` passes.
- Demo University dashboard shows workbook metrics matching: Avery 31/31, Blake 26/31, Casey 19/31, Devon 9/31, Emerson 6/31, Frankie 3/31, Gray 1/31, Harper none.
- Avg quiz score reads **81% · 7 of 9 students**, not 63%.
- No admin surface renders workbook answer text anywhere.
- Every behind-pace student shows at least one reason chip.
- Roster order is identical across three consecutive reloads.
- No changes to student-facing pages, exercise saving, quiz scoring, XP, or gating.

List every file you change, and state explicitly how you granted admins count access to `exercise_answers`.

---

## After Cursor — REQUIRED

1. `npm run build`
2. Commit + push (e.g. `feat: workbook activity metrics and reporting corrections`)
3. No re-seed needed — this pass adds no seed data.
4. Verify live on `/admin/ffc653d3-da74-4141-afa5-be70d6eaf1c8/dashboard`.
