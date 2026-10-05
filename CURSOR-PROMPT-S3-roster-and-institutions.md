# Cursor prompt — S3: institutions, rosters, and student invites

Copy everything below the line into Cursor. **Two commits suggested: (A) institution + roster + invites, (B) create-user lockdown + cross-institution overview.**

---

Onboarding a cohort currently requires hand-written SQL or a secret API call with a plaintext password. This pass makes it a real workflow.

## 0. Prerequisite Oscar must complete — invites cannot work without it

Supabase's **built-in email service refuses to deliver to anyone outside the project team**. From their docs: *"Supabase Auth will refuse to deliver messages to addresses that are not part of the project's team… All other addresses will fail with the error message Email address not authorized."* Their docs also state the default service is *"not meant for production use"*, and that invites specifically require custom SMTP.

**A custom SMTP provider (Resend, Postmark, AWS SES, SendGrid, Brevo — all listed by Supabase) must be configured in Supabase Auth before any invite can reach a student.** Custom SMTP then begins at 30 messages/hour, adjustable under Authentication → Rate Limits.

Build the flow anyway — but **surface this clearly in the UI**: if sending fails with an authorization error, show a specific message saying custom SMTP is not configured, not a generic "invite failed". Do not let a silent failure look like a sent invite. Oscar will be looking at a roster of "pending" students wondering why nobody has logged in.

## 1. Institution creation — super admin only

**Decision: only Oscar creates institutions and manages rosters.** Institutions never log in (v1 is push reporting), so institution-facing tooling has no user. Do not build institution-admin management screens.

Replace the `/superadmin` scaffolding — it currently says *"Create institutions in Supabase or via the roster tool (Phase 5)"* and *"full management tools arrive in Phase 5"*. That copy is stale; remove every "Phase 5" reference.

Add a create/edit institution form: name, `cohort_start_date`, `reporting_cadence`, `drip_type`, `is_pilot`, optional `logo_url` and `primary_color`, `notes`.

`cohort_start_date` drives drip unlocking, pace, **and report period boundaries** — changing it on a live cohort moves every future report period. Warn on edit when the institution already has report rows.

## 2. Roster upload + invites

- Upload CSV with `full_name,email`. Show a parsed preview before anything is sent — never send on upload.
- Validate: well-formed email, no duplicates within the file, and flag addresses that already exist as users.
- Invite via Supabase `inviteUserByEmail` with `data: { role: "student", institution_id, full_name }`.
  **The `handle_new_user` trigger already reads exactly those three keys** from `raw_user_meta_data` and creates the profile — this is verified working. Do not create profile rows manually; let the trigger do it.
- **Never set or transmit a student password.** The invite link is how a student sets their own. There must be no code path where an admin sees, sets, or emails a password.
- Send invites in a batch with a per-row result: sent / already exists / failed with reason. Partial failure must not roll back the successes, and must not be reported as overall success.

## 3. Invite status tracking

Add to the roster view: **Invited · Accepted · Not yet accepted**, with the invite date and a **Resend** action.

Derive accepted from `auth.users.last_sign_in_at` (or `confirmed_at`), not from a flag you maintain — a maintained flag drifts. Read it server-side through the service-role client, exactly as S1 did for `exercise_answers`, and expose only status to the client, never tokens or auth records.

"Not yet accepted after N days" belongs in the existing attention-reasons system, since a student who never logged in is the earliest possible intervention.

## 4. Cross-institution overview

`/superadmin` should answer "how is every cohort doing?" at a glance: one row per institution with cohort size, current week (clamped), modules-passed average, workbook average, students needing attention, and the date of the last generated report.

Exclude `is_demo = true` students from cross-institution totals — that rule already exists from S1.5; reuse it rather than reimplementing.

## 5. Lock down `/api/create-user`

**Decision: strip its powers, disable in production.** Today it accepts `role: "super_admin"`, takes a plaintext password, deletes existing auth users via `recreate: true`, and compares its secret with `===`.

- Remove `"super_admin"` from the accepted roles. A privilege-escalation endpoint guarded by one env var is not acceptable once real students exist.
- Remove the `recreate` delete path entirely.
- Compare the secret with `crypto.timingSafeEqual`, as the cron route does.
- Return 404 in production unless an explicit `ALLOW_DEV_USER_API=true` is set, so it is inert on the live site by default.
- Leave it usable locally for test accounts.

## 6. Guardrails

- Every destructive or sending action confirms first, stating exactly how many students it affects.
- No bulk delete of students in this pass. Deactivation only, if anything.
- Uploading a roster to an institution that already has students must **add**, never replace, and must say which it is doing.

## Acceptance criteria

- `npm run build` passes.
- An institution can be created and edited entirely in the UI; no "Phase 5" copy remains anywhere.
- A CSV preview appears before any invite is sent; sending reports per-row outcomes.
- A failed invite caused by missing custom SMTP shows a message naming that cause specifically.
- No code path sets, displays, or emails a student password.
- Roster shows invite status derived from auth, with a working resend.
- `/superadmin` shows a real cross-institution table excluding demo students.
- `/api/create-user` cannot create a super_admin, cannot delete users, uses `timingSafeEqual`, and 404s in production by default.
- No changes to learning content, scoring, XP, gates, or the reporting pipeline.

List every file you change, and confirm no code path handles a student password.

---

## After Cursor — REQUIRED

1. `npm run build`
2. Commit + push
3. Tell me the commit and whether a migration is needed — I will apply it and verify.
4. **Before testing invites for real:** configure custom SMTP in Supabase (Authentication → SMTP Settings). Until then, expect "Email address not authorized" for any address outside the project team — that is the documented behaviour, not a bug in this pass.
