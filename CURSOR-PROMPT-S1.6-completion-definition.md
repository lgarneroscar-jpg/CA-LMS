# Cursor prompt — S1.6: make "module complete" mean something

Copy everything below the line into Cursor. **One commit.** This changes student-facing gating behaviour — read section 0 first.

---

## 0. What is changing and why

Today, `submitQuiz` sets `quiz_completed: true` **regardless of score**, and `moduleCompletionPrerequisitesMet()` checks only that boolean. **Submitting the quiz is passing the quiz.** In the current data, three module rows scored 2 of 4 and all count as complete. Separately, `EXERCISE_SUBMIT_GATE_ENABLED` is `false`, so the living workbook — the product's differentiator — contributes nothing to completion.

**Oscar's decisions:**
1. **Quiz passing threshold: 75%** (3 of 4 on the current 4-question quizzes), with **retakes allowed**.
2. **Module complete = all workbook exercises answered + quiz passed.** Enable the exercise gate now. **Leave the video gate off** — real videos do not exist yet; it gets enabled in a later, separate change.

This is a deliberate, dated definition change, and there will be a **second** one when videos land. That is accepted. `COMPLETION_DEFINITION_VERSION` exists precisely so both breaks are recorded rather than silently absorbed.

**There is no live cohort yet — this is the last moment this change is cheap.** Do it now, not after students are mid-programme.

## 1. Quiz passing threshold

- Add `QUIZ_PASS_THRESHOLD = 0.75` to `lib/module-gates.ts`, with a comment that 4-question quizzes make this 3 of 4.
- Compute pass as `score / questionCount >= QUIZ_PASS_THRESHOLD`. **Always divide by the actual question count for that module** — never a hardcoded 4.
- `submitQuiz` should keep recording `quiz_score` on every attempt, but `quiz_completed` must mean **passed**, not **attempted**. If you need to distinguish "has attempted" from "has passed", add a separate field rather than overloading `quiz_completed`.
- Return pass/fail plus the score in the action result so the UI can show it.

**Retakes:** a student below threshold may retake. Keep the most recent attempt's score (simplest, and matches how the column is read today). Do not silently keep the best score — if you want best-of, say so explicitly in your summary rather than deciding quietly.

## 2. Enable the exercise gate — and fix what it checks

Set `EXERCISE_SUBMIT_GATE_ENABLED = true`.

**Critical:** `markExercisesReadyForQuiz()` in `app/actions/exercise-answers.ts` currently verifies only that **a row exists** for each exercise key. A student could save blank answers and satisfy it. Change it to require a **non-empty** answer using `isAnswerEmpty()` from `lib/exercise-answers.ts` — the same function S1 reporting uses.

This matters beyond correctness: if the gate and the reporting disagree, the admin roster will show "3 of 31 exercises" beside a module marked complete. Gate and report must use one definition of "answered".

Error copy should name what is missing, not just "save every exercise".

## 3. Bump the completion definition version

- `COMPLETION_DEFINITION_VERSION` becomes something like `"workbook+quiz75"` (today it is `"quiz-only"`).
- Add a comment listing the known versions in order, so a future reader can interpret an old snapshot: `quiz-only` → `workbook+quiz75` → (later, when videos land) a third value.
- Stage 2 will stamp this into every report snapshot. Do not remove or rename the export.

## 4. Do NOT retroactively revoke completions

Existing rows with `is_complete = true` stay complete, including the three that passed at 50%. Revoking a completion a student already earned is wrong, and it would corrupt historical reporting.

- Do not write a migration that un-completes anything.
- The new rule applies to completions from this point forward.
- Where reporting shows historical figures, the definition version is what explains the discontinuity.

## 5. Guard against impossible quiz scores

There is a row with `quiz_score = 5` on a module that now has **4** questions — seeded in May by `app/api/create-user/route.ts`, before the Q1 pass canonized every quiz to 4 questions. It renders as **125%**.

- Clamp displayed percentages at 100%, and log a warning when `quiz_score > questionCount` rather than rendering it.
- Fix the hardcoded score in `app/api/create-user/route.ts` so it cannot recur.
- This is the same class of defect as the completion definition: a stored number whose denominator changed underneath it.

## 6. Student-facing UX

The gate change is visible to students, so it must read as guidance, not obstruction.

- Quiz section, when exercises are incomplete: say which exercises remain, with a link.
- Quiz result below threshold: show the score, state the threshold plainly ("3 of 4 needed to complete this module"), and offer a retake. Do not shame; do not imply failure of the programme.
- Do not change XP rules in this pass.

## 7. Reporting follow-through

- The explainer text "A module counts as complete when its quiz is passed" is now **wrong**. Update everywhere it appears to reflect: all exercises answered + quiz at or above 75%.
- The roster's duplicated "Modules passed" and "Quiz" columns will now genuinely differ — keep both.
- Add a quiz-attempt signal so a student stuck below threshold is visible: an attention reason for repeated failed attempts on the same module.

## Acceptance criteria

- `npm run build` passes.
- A quiz scored below 75% does **not** complete the module and can be retaken.
- A module with any blank/empty exercise does **not** allow quiz submission; the message names what is missing.
- The gate's definition of "answered" is `isAnswerEmpty()` — identical to the reporting figure. No surface can show an unanswered exercise inside a completed module.
- `COMPLETION_DEFINITION_VERSION` is updated and documents its history.
- No existing `is_complete` row is revoked.
- No quiz percentage above 100% can render.
- No changes to workbook content, quiz content, XP rules, or the video gate.

List every file you change, state whether retakes keep the latest or best score, and confirm the video gate is still `false`.

---

## After Cursor — REQUIRED

1. `npm run build`
2. Commit + push (e.g. `feat: completion requires workbook and a passing quiz`)
3. No migration in this pass.
4. Tell me when it is pushed — I will re-align the Demo University fixtures, which currently contain three sub-threshold completions that would misrepresent the new rule.
