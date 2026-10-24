# supabase/migrations — read this before running any Supabase CLI command

## Never run `supabase db push` against production

This folder's migration history and the production database's migration history
are **completely disjoint**. They share no versions.

- Every file here is named `2024…` (`20240525000000_initial_schema.sql` …
  `20240618000000_fk_indexes_and_auth_uid_initplan.sql`) — 33 files.
- Production's `supabase_migrations.schema_migrations` records 25 rows, all named
  `2026…` (`20260525205200_initial_schema` … `20261014043730_add_institution_to_exercise_answers`).

Because the CLI decides what to apply by comparing version strings, `supabase db push`
would consider **all 33 files unapplied** and try to run the entire chain against
production — starting by re-running `initial_schema`. Do not run it.

## What each history is for

**Production is the source of truth for schema state.** Changes reach it by being
applied directly (Supabase SQL editor, MCP, or `supabase db execute`), and the
2026-dated history is the record of that.

**This folder is the rebuild-from-scratch document.** It exists so a fresh database
can be stood up with the same schema, and so the schema is reviewable in git. It is
validated by `supabase db reset` against a *local or branch* database and diffing the
result against production — never by pushing.

## Applying a change to production

1. Write the migration file here, named to sort after `20240618000000`.
2. Apply the statements to production directly.
3. Confirm the result by querying production (`pg_policies`, `pg_indexes`,
   `pg_proc`, the advisors), not by trusting the file.

Steps 1 and 2 are separate actions. A file in this folder is **not** evidence that
production has it.

## Already applied to production, not recorded in its history

These two were applied statement-by-statement against production in October 2026.
Their effects are live; production's `schema_migrations` has no row for either.

- `20240617500000_baseline_rls_policies.sql` — reproduces the live RLS state
  (21 tables with RLS enabled, 47 policies). Written *from* production, so applying
  it to production is a no-op by construction. It is here so a rebuilt database gets
  the policies, which `initial_schema` alone does not create.
- `20240618000000_fk_indexes_and_auth_uid_initplan.sql` — 8 foreign-key indexes, and
  the `auth.uid()` → `(select auth.uid())` rewrite across 22 policies on 11 tables.
  Applied with `ALTER POLICY` rather than this file's drop-and-recreate, so no policy
  was ever briefly absent and no policy's roles/command/permissive flag was
  reconstructed from text. Verified afterwards: all 30 policies on those tables are
  byte-identical to their pre-change definitions once the `(select …)` wrap is
  normalised away, and the `auth_rls_initplan` advisor lint is cleared.

### The one statement from `20240618` that is not on production

Its top-level `DROP POLICY IF EXISTS "Users read own or public exercise answers"`
has not run. That policy is still on `exercise_answers`:
`SELECT`, `TO authenticated`, `USING (auth.uid() = user_id)`.

It is **redundant, not a hole** — a strict subset of
`"Users read own or public cohort exercise answers"`, which covers the same rows for
the same roles. It grants no access the cohort policy does not already grant. It
remains only because it trips the `multiple_permissive_policies` lint and because its
name reads like the original cross-institution leak policy, which invites a
misdiagnosis later.

To remove it:

```sql
DROP POLICY IF EXISTS "Users read own or public exercise answers" ON public.exercise_answers;
```

## Known, accepted, not fixed

`current_user_role()`, `current_user_institution_id()` and `institution_of_user(uuid)`
are `SECURITY DEFINER` and callable by `authenticated` over `/rest/v1/rpc/`. The grant
is deliberate — RLS policy expressions evaluate as the querying role, so revoking
`EXECUTE` makes every policy that calls them fail. That is what
`20260526002347_grant_rls_helper_function_execute` exists for.

The residual exposure is `institution_of_user(uuid)`: a signed-in user who already has
another user's UUID can learn that user's institution id. No names, no student work.
The clean fix is to move the three helpers into a schema PostgREST does not expose and
re-qualify every policy that calls them — a deliberate change across 17+ policies, not
a hotfix.
