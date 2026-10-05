# CA-LMS — Full Project Audit, tiered

**Date:** 2026-10-05 · **Live commit:** `0297394` + `972cdf8` · **Supabase:** Pro · **Purpose:** decide whether marketing can start

**Tier 3** — breaks a core concept, makes it unusable, or contradicts the value proposition.
**Tier 2** — noticeable to someone judging the product; doesn't destroy anything.
**Tier 1** — loose threads. Clip them or don't.

---

## Verdict

**Three Tier 3 items. Two are content/configuration, one is a two-line code fix.** Nothing in the application architecture blocks selling.

The platform does what it claims: students are invited, set passwords, take a real readiness assessment, work through gated modules, build a living workbook, and leave with a portfolio. Institutions get an honest, versioned report. That has all been verified in production against the database, not just on screen.

---

# TIER 3 — must clear before a cohort runs

## T3.1 — No module videos exist

**Evidence:** 0 of 14 self-paced modules have a real video. All 14 point at the same placeholder URL. The student sees *"Video lesson — coming soon."*

**Why Tier 3:** every module is built as Watch → Read → Do → Check. One of the four stations is dead across the entire curriculum. The offer is a taught programme; without video it is a workbook with quizzes. A buyer shown a demo sees "coming soon" fourteen times.

**Not a code defect.** The player, the gate and the admin editor all work — `VIDEO_GATE_ENABLED` is deliberately off and will switch on when real videos land. This is production work, and it is the longest-lead item on the list.

**Options, in descending honesty:** record all 14 before cohort 1 · record weeks 1–4 and stay ahead of the drip · sell explicitly as workbook-led with live sessions, and remove the Watch station until video exists. **Do not leave "coming soon" visible to a paying cohort.**

## T3.2 — A student can issue themselves a certificate without taking the Week 12 CAPRI

**Evidence:** `capri_responses` policies —

```
INSERT  with_check: auth.uid() = student_id
UPDATE  using: auth.uid() = student_id AND submitted_at IS NULL
        with_check: auth.uid() = student_id
```

A student can set `submitted_at` on their own open response, or insert one already marked submitted. `hasSubmittedPost()` then returns true and the certificate unlocks with **zero `capri_answers` and zero `capri_scores`**.

**Why Tier 3:** the certificate is the credential being sold, and CAPRI is "the source of every outcome claim made to institutions." A self-issued certificate with no assessment behind it contradicts both. It also quietly shrinks the paired-response count that outcome reporting depends on.

**Fix (small):** restrict the student INSERT to `administration_id` and `student_id` only, and drop the student UPDATE policy — the app already submits through the service role, so nothing breaks. Same pattern as S6.

## T3.3 — The site is not connected to anything a buyer can reach

**Evidence:** the app lives at `ca-lms.vercel.app`. There is no custom domain, and no login entry point from the Corporate Academy site.

**Why Tier 3:** this is the specific thing blocking the stated goal. Marketing cannot start pointing at a vercel.app subdomain.

**Sequence, and the step that bites:** add the custom domain in Vercel (e.g. `learn.corpacad.com`) · add the DNS record at Squarespace, where the `mail.corpacad.com` records already live · **add the new origin to Supabase → Authentication → URL Configuration, both Site URL and Redirect URLs** · update `NEXT_PUBLIC_SITE_URL` in Vercel · redeploy · then add the login button on Squarespace.

**Miss the Supabase step and every invite and password-reset link breaks on the new domain** — the same failure already lived through twice.

---

# TIER 2 — fix before or during the first cohort

| # | Item | Evidence | Why it matters |
|---|---|---|---|
| T2.1 | **Cohort rank never recalculates** | `recalculate_cohort_ranks` **does not exist** in the database, though it is defined in `20240527000000_phase4_gamification_admin.sql` and called from `lib/rankings.ts`. The error is caught and logged, so it fails silently. Verified: a student who completed a module kept `rank = NULL`. | A visible student-facing feature that never works. Dashboard shows "Complete modules to rank" forever; the roster's Rank column stays empty for real students. |
| T2.2 | **Repo migrations ≠ applied migrations** | 20 files in `supabase/migrations/`, 22 applied rows, and the version numbers do not correspond (repo `2024…`, applied `2026…`). | Fourth discovery of this drift. It has already caused four production defects (`last_login`, `login_events`, `reports`, four profile columns, and T2.1). A fresh environment cannot be rebuilt from the repo. |
| T2.3 | **Live-session stream URLs are placeholders** | 0 of 5 have a real URL; 0 have recordings. | The admin editor exists, so this is per-cohort data entry — but it must be done before week 2 or the first live session has no link. |
| T2.4 | **Students can insert their own `login_events`** | Policy allows own-row insert; the table feeds "weekly engagement" in the institutional report. | A student could inflate the engagement figure reported to their institution. |
| T2.5 | **`MIN_N_COHORT_CLAIM = 8`** | Outcome claims are withheld below 8 paired responses. | A 10-person honours cohort loses its entire outcomes section to two non-responders — the section you are selling. Decide whether it scales. |
| T2.6 | **Leaked-password protection disabled** | Supabase security advisor. | One toggle. Students will reuse passwords. |
| T2.7 | **Demo fixtures decay** | Recency is stored, not computed; engagement fell to 11% within a week. | Open the demo in front of a buyer on the wrong day and the cohort looks abandoned. `npm run seed:demo` fixes it; consider `SEED_DEMO_ON_CRON=true`. |
| T2.8 | **Third-party profile view untested** | RLS is `(auth.uid() = user_id) OR (is_public = true)` and the page passes `publicOnly: true`. Architecturally sound, never tested with a second account. | The privacy promise shown to students on the CAPRI intro screen. Needs one real test. |
| T2.9 | **Hydration warning in `app-header.tsx`** | Reported by Cursor; likely a date rendered server- then client-side. | Causes flicker and can mis-render. |
| T2.10 | **Admin surfaces un-lifted** | No Campus Indigo anywhere in `/admin` or `/superadmin`. | Deliberately deferred as internal tooling — but it is the screen you would share with a buyer. |

---

# TIER 1 — loose threads

| # | Item |
|---|---|
| T1.1 | `recalculate_cohort_ranks` is callable by any signed-in user for any institution (harmless — recomputes from real data). |
| T1.2 | Existing lint error in `components/modules/v2/workbook-blocks.tsx`. |
| T1.3 | Legacy tables still present: `exercise_responses` (4 rows), `diagnostic_responses` (7 rows), both superseded. |
| T1.4 | Demo Preview institution holds report rows for a one-student fixture cohort. |
| T1.5 | `BUILD-LOG.md` and all `CURSOR-PROMPT-*.md` files are uncommitted. |
| T1.6 | Portfolio PDF footer requires Chrome/Edge 131+; Safari and Firefox print without it. |
| T1.7 | Onboarding walkthrough copy never refreshed after CAPRI replaced the entry diagnostic. |

---

# Verified working — not at risk

Confirmed in production against the database during this audit and the 2026-10-04 journey walk:

- Invite → set password → onboarding → CAPRI baseline → programme start.
- CAPRI v2: 33 items, correct scoring (composite, pillars, BEI), response-shift retrospective captured.
- Module completion: workbook gating, server-side quiz grading, 75% threshold, retakes, answer capture, XP, completion stamp.
- Quiz answer key absent from client payloads; students cannot write their own outcomes (S5 + S6, probed live).
- Living workbook → profile → publish toggle → portfolio document, with no CAPRI score reaching the student document.
- Institutional reporting: cadence-anchored periods, deliberate generation, backfill without duplication, cross-definition delta refusal, CAPRI outcomes section, weekly cron running unattended.
- Custom SMTP delivering real invites.

---

# Recommended order

1. **T3.2** — two-line policy fix. Do it today.
2. **T3.3** — domain and Supabase URL configuration. Half a day, unblocks marketing.
3. **T3.1** — video production. Start now; it is the long pole.
4. **T2.1, T2.2** together — both are the same migration-drift root cause.
5. Everything else during cohort onboarding.

**T3.2 and T3.3 can be done this week. T3.1 is the real schedule.** Marketing can begin once the domain is live, provided the video plan is honest in the sales conversation.
