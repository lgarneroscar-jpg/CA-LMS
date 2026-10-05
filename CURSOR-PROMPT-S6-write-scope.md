# Cursor prompt — S6: stop students writing their own outcomes

Copy everything below the line into Cursor. **One commit, one migration. This closes the hole S5 exposed.**

---

## 0. The problem you flagged is real — confirmed in production

```
student_progress · "Students manage own progress" · cmd = ALL · (student_id = auth.uid())
profiles         · "Users update own profile"     · cmd = UPDATE · (id = auth.uid())
```

`ALL` includes UPDATE. With the public anon key already in the browser, a signed-in student can run one line against the REST API:

```js
supabase.from('student_progress')
  .update({ is_complete: true, quiz_completed: true, quiz_score: 4, xp_earned: 999 })
  .eq('student_id', <their own id>)
```

and complete the entire programme without opening a module. **This bypasses everything:** S5's server-side grading, S1.6's workbook requirement, the 75% threshold, and the certificate gate. `profiles` is the same story for `xp` and `rank`.

Fabricated completion flows straight into the institutional report. Moving the answer key server-side was necessary and is not sufficient — this is the rest of that fix.

## 1. Principle

**A student may write their own work. A student may not write their own outcomes.**

- *Work* — exercise answers, profile bio, LinkedIn URL, answer visibility — stays student-writable. That is correct today; do not change it.
- *Outcomes* — anything that grades, scores, completes, awards or ranks — is **server-written only**.

## 2. student_progress

- Replace `"Students manage own progress"` with a **SELECT-only** policy for students (`student_id = auth.uid()`). Keep the existing admin read policy.
- **Remove student INSERT/UPDATE/DELETE entirely.** Every write moves to the service-role client.
- Audit every write path and switch it: `getOrCreateProgress`, `submitQuiz`, `tryCompleteModule`, `markLiveSessionComplete`, `markExercisesReadyForQuiz`, video-watched, and anything else touching the table. They already run inside server actions behind `requireStudent()`, so the user's identity is still verified — only the database connection changes.
- **Each server action must keep enforcing that the row belongs to the calling user.** Service role bypasses RLS, so the ownership check that RLS was providing now has to be explicit in code. Do not take a `student_id` from the client; derive it from the session.

## 3. profiles

Students legitimately edit `full_name`, `bio`, `linkedin_url`, `profile_picture_url`, `grad_year`, `default_answer_visibility`.

They must not write `xp`, `rank`, `role`, `institution_id`, `is_demo`, `diagnostic_complete`, `onboarding_complete`, `program_completed_at`, `program_started_at`, `streak_days`, `earned_badges`, `streak_milestones_awarded`, `last_active_week`, `last_login`, `last_active_date`.

`role` and `institution_id` are the serious ones: a student could promote themselves to `super_admin` or move into another institution's cohort and read its data.

Use **column-level privileges** — keep the UPDATE policy, but `REVOKE UPDATE` on the table from `authenticated` and `GRANT UPDATE (…)` on only the editable columns. Move the rest to the service-role client.

## 4. Check every other table

Apply the same test to all of them, including the CAPRI set: can a student write anything that is a result rather than their own input?

`capri_responses` and `capri_answers` must stay student-writable — those are their answers — but confirm `submitted_at` cannot be cleared to reopen a frozen response, and that **`capri_scores` is not student-writable at all**, since scores are computed. Report what you find; do not silently change anything outside this prompt's scope.

## 5. Verify by trying it

Add a short note to the summary confirming you attempted each of these **as a student** and got a permission error:

- `update student_progress set is_complete = true`
- `update profiles set xp = 9999`
- `update profiles set role = 'super_admin'`
- `insert into quiz_answers (…)`
- `update capri_scores set value = 100`

A policy that looks right and is not is the failure mode here. Prove it.

## Acceptance criteria

- `npm run build` passes, and existing tests still pass.
- A student cannot write `student_progress` by any route; module completion still works normally through the UI.
- A student can still edit their own profile fields, and cannot change `xp`, `rank`, `role` or `institution_id`.
- Every moved write derives `student_id` from the session, never from client input.
- No existing data is modified by the migration — policy and privilege changes only.
- No changes to learning content, quiz content, XP *rules*, the CAPRI instrument, or report generation.

List every file you change, every policy and grant you alter, and the result of each probe in §5.

---

## After Cursor — REQUIRED

1. `npm run build`
2. Commit and push on `main`; say which branch if not.
3. Tell me the migration name — I will apply it and re-probe independently.
4. Then: student completes a module end to end, and a student edits their profile. Both must still work.
