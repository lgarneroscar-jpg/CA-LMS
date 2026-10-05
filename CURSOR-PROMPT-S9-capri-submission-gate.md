# Cursor prompt — S9: close the CAPRI self-submission hole (T3.2)

Copy everything below the line into Cursor. **One commit, one migration. Small and contained.**

---

## The problem

Confirmed against the live database. `capri_responses` policies:

```
INSERT  with_check: auth.uid() = student_id
UPDATE  using:      auth.uid() = student_id AND submitted_at IS NULL
        with_check: auth.uid() = student_id
```

A student can therefore:
- set `submitted_at` on their own open response, or
- insert a response that is **already** marked submitted.

`hasSubmittedPost()` then returns true and `/certificate/[student-id]` unlocks — with **zero `capri_answers` and zero `capri_scores`** behind it.

**Why this is mission-critical:** the certificate is the credential being sold, and CAPRI is the source of every outcome claim made to institutions. A self-issued certificate with no assessment behind it contradicts both. It also quietly shrinks the paired-response count that the institutional outcomes section depends on, which is already gated at `MIN_N_COHORT_CLAIM = 8`.

## The fix

The application already submits through the service role in `submitResponse()` — students never need to write `submitted_at` themselves. So remove the ability.

- **Drop the student UPDATE policy on `capri_responses` entirely.** Confirm nothing in the app relies on a student updating that row directly; if something does, move it to the service role rather than keeping the policy.
- **Constrain the student INSERT** so a student can only create a row for themselves, with `submitted_at` null. A student must not be able to insert a pre-submitted response.
- **Revoke the privileges too, not just the policies** — `UPDATE` on `capri_responses` from `anon, authenticated`, matching the S6 principle: a missing policy silently affects zero rows, a missing privilege fails loudly.
- Leave `capri_answers` student INSERT/UPDATE alone. Those are the student's own answers and the existing "only while `submitted_at` is null" condition is correct.

Keep `capri_scores`, `capri_items`, `capri_instruments` and `capri_administrations` as they are — I already revoked client writes on those.

## Verify by trying it

As a student, confirm each of these now fails, and report the result of each:

- `update capri_responses set submitted_at = now()` on their own open response
- `insert into capri_responses (administration_id, student_id, submitted_at) values (…, auth.uid(), now())`
- taking the assessment normally through the UI still works end to end: start, autosave, submit, scores written

The third is the one that matters most — do not trade the hole for a broken assessment.

## Also confirm

`hasSubmittedPost()` should mean "submitted a response that actually has answers". Check whether a response row with `submitted_at` set but **no** `capri_answers` could still exist by any route. If it can, make the certificate gate require scored answers rather than just the timestamp — belt and braces, since the certificate is the thing being issued.

## Acceptance criteria

- `npm run build` passes; existing tests still pass.
- A student cannot set `submitted_at` by any route, and cannot insert a pre-submitted response.
- Taking and submitting CAPRI through the UI works unchanged — baseline and post.
- The certificate cannot be reached without a genuinely completed Week 12 assessment.
- No changes to the CAPRI instrument, scoring, grading, completion rules, reporting, or the portfolio.

List every file and policy you change, and the result of each probe above.

---

## After Cursor — REQUIRED

1. `npm run build`
2. Commit and push on `main`; say which branch if not.
3. Tell me the migration name — I will apply it and re-probe independently.
