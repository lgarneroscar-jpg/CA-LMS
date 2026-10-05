# Cursor prompt — S4: close out the backend phase

Copy everything below the line into Cursor. **One commit. This is intended to be the last operational pass before the testing phase.**

---

Four fixes. Three are small; the first is a real dead end that a live cohort will hit.

## 1. A student with no cohort must not land in a blank app

**Reproduced in production.** An invited user whose `profiles.institution_id` is `null` can sign in, set a password, complete onboarding — and then every page renders empty. Modules are cohort-scoped (drip unlock runs off `cohort_start_date`), and `resolveOwnResponse` in `app/actions/capri.ts` throws *"You are not assigned to a cohort yet"*, so the CAPRI page shows nothing at all. The student is told to take the pre-assessment and then hits a blank screen with working nav and no content.

This happens whenever a user is invited from the Supabase dashboard rather than the roster, and will happen again whenever an institution is deleted or an invite is mis-routed.

- Add a **single guard** for authenticated students with no `institution_id`. Show a clear page: they are not assigned to a cohort yet, and to contact their program administrator. Give it a real heading and body — not a toast, not an empty state that looks like a loading failure.
- Apply it at the layout level for the student area so **every** student route is covered, rather than patching page by page.
- The CAPRI page must never render blank. If anything prevents the assessment loading — no institution, no active instrument, no administration — say which, in plain language.
- Surface it on the admin side too: a student with no institution should appear in `/superadmin/users` with a visible warning, since today nothing flags it.

## 2. Per-question quiz analysis

The last data gap from the original assessment (O7). Per-student quiz scores exist; **nothing shows which questions a cohort gets wrong.**

- Add a per-module, per-question breakdown: for each question, how many students answered it correctly.
- Surface on `/superadmin/content/[moduleId]` (content improvement) and in the institutional report as a short "most-missed questions" line (reporting value).
- Needs the chosen answer per attempt. `student_progress.quiz_score` only stores a count, so check whether per-answer data is retained anywhere; **if it is not, say so rather than inventing it** — capturing it may be a schema change, and I would rather know than receive a guess.

## 3. Pluralisation in the report artifact

`components/admin/institution-report-artifact.tsx` renders *"No workbook activity — 1 students"*. The same fix was applied to the dashboard; the report component has its own copy. Sweep for other hardcoded plurals while you are there.

## 4. Invite status must not contradict visible activity

The report has shown *"Invite not accepted after 129 days"* directly above *"Modules passed 14 of 14 · Workbook 31 of 31"*.

`invitePendingDays()` is technically correct — it keys off `last_sign_in_at` — but a stale or missing timestamp produces a line that flatly contradicts the student's own coursework on the same row, which undermines every other figure on the page.

- Suppress the "invite not accepted" reason whenever there is **any** evidence of activity: completed modules, workbook answers, XP, or quiz attempts.
- Keep it for genuinely inert accounts, which is the case it exists for.

## Explicitly NOT in this pass

- **Admin visual lift (Campus Indigo).** The admin surfaces are internal tooling under the push model. Cosmetic, and deferred deliberately.
- **Cross-cohort proof points.** Cannot be built until real cohorts finish. Correctly deferred, not forgotten.

## Acceptance criteria

- `npm run build` passes.
- A student with no `institution_id` sees a clear explanation on every student route, never a blank page.
- The CAPRI page always explains itself when it cannot load.
- Per-question quiz data appears, **or** you state plainly that the underlying answers are not stored and what it would take.
- No "1 students" anywhere.
- No student with recorded activity is described as not having accepted their invite.
- No changes to learning content, scoring, the CAPRI instrument, or the reporting pipeline.

List every file you change, and state whether per-question quiz answers are retained today.

---

## After Cursor — REQUIRED

1. `npm run build`
2. Commit and push on `main`; say which branch if not.
3. No migration expected — flag it if item 2 needs one.
