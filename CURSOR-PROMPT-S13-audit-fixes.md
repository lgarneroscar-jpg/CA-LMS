# S13 — Audit fixes

Branch from current `main` (deployed commit `5f16ff7`). Five tasks, ordered by priority.
Tasks 1 and 2 matter. Tasks 3–5 are cleanup.

---

## Task 1 — Rebuild the base schema migration (highest priority)

`supabase/migrations/20240525000000_initial_schema.sql` is a 38-line stub. It
defines `institutions` and `profiles` and then stops at the line:

    -- See full migration in Supabase dashboard migration history: initial_schema

**The repo therefore cannot rebuild the database.** No disaster recovery, no
branch testing, no onboarding a second developer, and no way to verify that any
later migration applies cleanly from scratch. Every migration written since has
been validated against a stub rather than the real base.

Reconstruct the full base schema from the live project and replace the stub.
Sources, in order of preference:

1. `supabase_migrations.schema_migrations` on the live database, which holds the
   original statements.
2. Failing that, introspect live and generate DDL: every table in `public` with
   columns, defaults, constraints and comments; all indexes; all RLS policies
   and `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`; all functions and triggers;
   all grants and revokes; all enums and extensions.

Exclude anything already covered by a later migration, so the chain applies in
order without conflict.

**Verify by applying the whole migration chain to an empty database and
diffing the result against live.** That diff being empty is the deliverable —
not the file itself. Report any object you could not reproduce rather than
quietly leaving it out.

---

## Task 2 — Sync the password policy to the live setting

The Supabase dashboard was changed on 2026-10-20:

- Password requirements: **No required characters**
- Minimum length: **12**
- Leaked-password protection: **on** (rejects passwords found in the
  HaveIBeenPwned corpus, returning an error at sign-up or password change)

`lib/password-policy.ts` still encodes the previous rule (minimum 10, plus
lowercase, uppercase, digit and symbol). The form is now stricter than the
server, which is harmless but reimposes exactly the friction the change was
meant to remove.

Update it to: minimum 12 characters, no character-class requirements. Keep the
live checklist UI; it should now show a single criterion. Keep the comment that
ties the file to the dashboard setting, and update it to say what the setting
now is.

**Also handle the leaked-password rejection.** That error is new and the form
has never seen it. Map it to a written sentence — something like "That password
has appeared in a known data breach. Please choose another." Never render the
raw server string.

---

## Task 3 — Look up the preview institution by id, not name

`app/api/create-user/route.ts` finds the separate "Demo Preview" institution by
name. Every other path keys off the id. A rename breaks this silently and the
account lands in the wrong place, or nowhere.

Use the id, as `lib/preview.ts` does.

---

## Task 4 — Portfolio warning copy for preview users

The portfolio builder warns about "public or private settings for your cohort".
Preview users are in a demo institution where sharing is disabled at the
database level, so they have no such settings and the sentence is confusing.

Suppress or reword it when the profile is in a demo institution.

---

## Task 5 — Performance, before the first real cohort

Supabase's linter reports two patterns. Neither matters at 13 profiles; both
will at 25 students across several cohorts. Do them now while there is no data
to migrate.

**Unindexed foreign keys (8):** `capri_administrations.instrument_version`,
`capri_answers` (item fk), `exercise_responses.module_id`, `flags.flagged_by`,
`flags.student_id`, `quiz_answers.question_id`, `quiz_questions.module_id`,
`student_progress.attendance_confirmed_by`.

**RLS policies re-evaluating `auth.uid()` per row (22 policies):** wrap the call
as `(select auth.uid())` so Postgres evaluates it once per query instead of once
per row. Affects `exercise_answers`, `capri_answers`, `capri_responses`,
`capri_scores`, `profiles`, `student_progress`, `login_events`, `notifications`,
`quiz_answers`, `exercise_responses`, `diagnostic_responses`.

Changing a policy's expression must not change its meaning. After each one,
re-read the policy from the database and confirm the logic is identical.

While there: `exercise_answers` has two permissive SELECT policies, `Users read
own or public cohort exercise answers` and `Users read own or public exercise
answers`. The second was narrowed to `auth.uid() = user_id` and is fully covered
by the first. Migration `20240608000000` drops it; confirm the drop actually
applied, and if not, drop it.

---

## Standing rules

- **Do not run git commands.** Oscar handles all commits and pushes.
- **Work on a branch and say which branch it is.** The last two rounds reported
  a branch that was never created; everything landed on `main` uncommitted.
- Do not change: pillar slugs `identity-brand-building`,
  `executive-communication`, `career-navigation`; any enum value, DB column,
  route segment, seed key or email-template key.
- Migrations go in `supabase/migrations/` following the existing naming. Do not
  apply them to the live project; say which ones need applying and they will be
  run separately.
- Run `npm run build` and report TypeScript status.
- Flag anything you assumed rather than guessing silently.
