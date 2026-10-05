# Cursor prompt — S5: server-side quiz grading + answer capture

Copy everything below the line into Cursor. **One commit, one migration. This is the last backend pass.**

---

## 0. The problem

Verified in the code:

```
app/(protected)/program/[pillar]/[module]/page.tsx:111  .select("… correct_answer …")
                                               :151  correctAnswers[q.id] = q.correct_answer
                                               :178  correctAnswers={correctAnswers}   → browser
app/actions/module-progress.ts:165  submitQuiz(…, correctAnswers)      ← from the browser
                              :169  if (answers[qId] === correctAnswers[qId]) score += 1
```

**The answer key is sent to the browser, and the server grades against what the browser sends back.** A student can read every answer in the page payload, or post a perfect score having answered nothing.

This matters because of what completion now controls: a module is complete when every workbook exercise is answered **and** the quiz scores ≥ 75%. Completion gates the certificate and is the basis of every figure in the institutional report. Fabricated completion becomes a false outcome claim to a paying institution.

Separately, chosen answers are discarded — only a count is stored — so there is no per-question analysis (O7 from the original assessment). Both problems share one fix: **the server must know what was answered.**

## 1. Grade on the server

- Remove `correctAnswers` from the `submitQuiz` signature entirely. **Never accept an answer key from the client.**
- Inside `submitQuiz`, load the questions for that module from `quiz_questions` and grade against the stored `correct_answer`.
- Validate the submission: every `questionIds` entry must belong to that module, and every answer must be one of that question's option ids. Reject anything else rather than scoring it.
- Stop sending `correct_answer` to the browser **before** submission. The quiz renderer needs question text and options only.
- After grading, returning which answers were right is fine — that is the feedback students should see. The key just must not be available in advance.

## 2. Capture the answers

New table, via migration:

```
quiz_answers
  id            uuid pk
  student_id    uuid → profiles(id) on delete cascade
  module_id     uuid → modules(id)  on delete cascade
  question_id   uuid → quiz_questions(id) on delete cascade
  chosen_option text      -- the option id the student selected
  is_correct    boolean
  attempt_at    timestamptz default now()
```

- Index on `(module_id, question_id)` for the aggregate, and `(student_id, module_id)` for per-student reads.
- RLS on, matching the existing pattern: students read their own; admins read within their institution via `current_user_role()` / `current_user_institution_id()`. Follow `student_progress`'s policies — do **not** grant admins write access.
- Write a row per answer inside `submitQuiz`, in the same action as grading.
- **Retakes:** keep every attempt. `student_progress.quiz_score` continues to hold the latest attempt's score, as decided in S1.6. The history lives here.

## 3. Per-question analysis

Now that the data exists:

- `/superadmin/content/[moduleId]`: per question, how many students answered correctly, and the most-chosen wrong option. That is the content-improvement signal — a question everyone misses is usually a bad question or a gap in the module.
- Institutional report: a short "most-missed questions" line.
- **Both must say that analysis covers attempts since this shipped**, so an early thin sample is never mistaken for a cohort-wide finding.

## 4. Do not revoke anything

Existing `is_complete` rows stay. Completions were earned under the old grading and are not evidence of cheating; revoking them retroactively would be wrong and would corrupt historical reporting.

**`COMPLETION_DEFINITION_VERSION` does not change.** The definition is identical — all exercises answered plus a quiz at or above 75%. Only the grading's trustworthiness changes. Leave the constant alone so Stage 2 deltas stay comparable.

## Acceptance criteria

- `npm run build` passes.
- `correct_answer` appears nowhere in any client payload before submission.
- `submitQuiz` accepts no answer key and grades solely from `quiz_questions`.
- A submission naming a question outside the module, or an option outside the question, is rejected rather than scored.
- Every submitted answer is recorded in `quiz_answers`, retakes included.
- Per-question breakdown renders on the module content page, captioned with its start date.
- No existing completion is revoked; `COMPLETION_DEFINITION_VERSION` is unchanged.
- No changes to workbook content, quiz content, XP, the CAPRI instrument, or the reporting pipeline.

List every file you change, and confirm the answer key no longer reaches the browser before submission.

---

## After Cursor — REQUIRED

1. `npm run build`
2. Commit and push on `main`; say which branch if not.
3. Tell me the migration name — I will apply it and verify the RLS policies.
4. Worth a manual check afterwards: open a module quiz, view source or the network payload, and confirm the correct answers are no longer in it.
