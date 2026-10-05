# CA-LMS BUILD LOG

Append-only chronological history. Every entry begins with an explicit update stamp. See COWORK-HANDOFF-BRIEF.md Section 6 for the format contract.

---

=== LOG UPDATED: 2026-07-03 20:03 (America/Detroit) — Pass 2 end-to-end verification (Step A): mostly working, 2 of 8 input types cannot save ===

- Context / why this was done:
  First task of the Cowork session per the handoff brief. The video-gate fix (commit 00e0649) made Pass 2 exercises visible for the first time; Pass 2 (interactive workbook + answer persistence) had never been verified end-to-end. Pass 3 depends on saved answers, so this verification gates Pass 3.

- What was attempted (specific):
  Logged in at ca-lms.vercel.app as test student (student@test.com). Exercised the living workbook in P1 (anchor_select, rewrite_pairs), P2 (reflection, fill_blank), and P10 (scorecard). Tested: interactive rendering, per-exercise Save, ask-once privacy prompt, persistence/pre-fill after full page reload, edit + re-save, "last updated" timestamp, per-answer public toggle. Then root-caused the failures by reading the code in the repo (read-only; no code changes made).

- Cursor prompt used: none (verification only; no Cursor pass run this session so far).

- Files changed (exact list from `git status`): none — working tree was clean at session start and remains clean except this new BUILD-LOG.md.

- Local build result: not run (no code changes).

- Commit hash + message: none yet. BUILD-LOG.md created; to be committed with the next push after Oscar's review.

- Deploy result: no new deploy. Verified against the current Production build at ca-lms.vercel.app (includes commits 65cc44f Pass 2 and 00e0649 video-gate bypass).

- Migration run? No.

- Verification performed (exactly what was clicked as the test student, and exactly what happened):
  NOTE ON TIMESTAMPS: the "Last updated" times quoted below are as displayed by the app in the verification browser (Mac local time), not America/Detroit.

  PASSING:
  1. Video gate removal CONFIRMED: exercises and module quiz render fully on P1/P2/P10 despite placeholder/unavailable videos (watch progress 0%).
  2. Exercises render as INTERACTIVE inputs (textareas, inline blanks, score dropdowns, checkboxes) — not static text. CONFIRMED on P1, P2, P4, P5, P10.
  3. Per-exercise "Save exercise" button, no autosave. CONFIRMED.
  4. Ask-once privacy prompt CONFIRMED: on the very first save (P1 rewrite_pairs), modal "Workbook answer visibility" appeared with "Public by default" / "Private by default" / Cancel. Chose "Private by default". The prompt did NOT reappear on any later save (P2 reflection, P10 scorecard) — default was remembered, per spec.
  5. Persistence + pre-fill CONFIRMED: after full page reload, P1 rewrite_pairs answers pre-filled ("I wait to be told exactly what to do." / "Here's my proposed next step — does that align?").
  6. Edit + re-save CONFIRMED: added pair 2 to P1 rewrite_pairs, re-saved; "Saved" flash shown and "Last updated" advanced (4:52 PM → 4:54 PM → 4:56 PM as displayed).
  7. Per-answer public toggle CONFIRMED: checked "Show on my profile when public" on P1 rewrite_pairs, saved, reloaded — checkbox state persisted. (An automation-tooling artifact initially made this look broken; a real click + save persists correctly.)
  8. reflection type (P2 "Purpose Brain Dump") saves and timestamps correctly.
  9. scorecard type (P10 "Apply the Opportunity Fit Table") saves and timestamps correctly; running total computes.

  FAILING — exact error text "Add at least one response before saving" (client-side validation; no console errors; no network request is ever made):
  10. anchor_select (P1 "Select Your Identity Anchors"): cannot save, ever. Also renders WRONG — a single textarea labeled raw key "anchor1" instead of 3 anchor+reason pairs.
  11. fill_blank (P2 "Build Your North Star"): cannot save, ever, even with all 3 blanks filled (verified with both synthetic input events and real keystrokes). fill_blank also exists in P4 ("Build Your LinkedIn Headline"), P5 ("Write a Micro-Wins Post"), P13 — presumed broken everywhere (same component path).
  12. scorecard COSMETIC/DATA issue (P10): row labels are mangled — "Manager Quality (score", "notes), Skill Development (score", … and "Total /25" was seeded as a 6th rated row, so the total reads "/30" instead of "/25". Same pattern will affect P13's Opportunity Comparison Table.

- Root cause analysis (from reading the repo; no changes made):
  A. lib/workbook-seed-parser.ts → parseFields(): checks `cleaned.includes(" + ")` and splits the WHOLE field string on " + " BEFORE considering commas. Any seed line of the form "a1 + b1, a2 + b2, …" is mangled: P1 anchor fields became keys [anchor1, reason1-anchor2, reason2-anchor3, reason3] instead of 3 anchor/reason pairs; P10/P13 scorecard labels got shredded and "Total /25" became a rated field. This is a DATA bug baked into modules.exercises in Supabase by scripts/seed-workbook-content.ts — fixing the parser requires re-running that script.
  B. lib/exercise-answers.ts → isAnswerEmpty() "fill_blank" case validates fields[i].key, but the renderer (structured-exercise-input.tsx) writes blank values under blankKeysForTemplate() keys (`${exerciseKey}_blank_${i}`) whenever the template contains ___ blanks. Key mismatch → validation always sees empty → save blocked. Pure code bug.
  C. lib/exercise-answers.ts → isAnswerEmpty() "anchor_select" (and "rewrite_pairs") use groupXPairs(fields).every(...); on an empty group [].every() returns TRUE = "empty", so any exercise whose fields don't group (e.g. due to bug A) can never save even though the fallback renderer accepts input. Latent footgun.

- Decisions made:
  1. Chose "Private by default" for the test student's ask-once visibility default (privacy-preserving; per-answer toggle verified separately).
  2. Per handoff brief Section 4: NOT proceeding to Pass 3 build until the two broken input types save correctly. A Cursor fix prompt has been drafted for Oscar's review (see session sync).
  3. Test data written to exercise_answers for the test student (P1 rewrite_pairs [public], P2 reflection [private], P10 scorecard [private]) — intentionally left in place; useful for Pass 3 verification.

- Open questions / things needing Oscar's input:
  1. Approve running the drafted Cursor fix prompt (parser fix + validation fixes + re-run seed script)?
  2. The re-seed script overwrites modules.exercises and workbook_content from workbook-content-seed.md — confirm no superadmin manual content edits exist that would be lost.
  3. anchor_select currently renders free-text anchor inputs; the workbook describes choosing from suggested anchors. Free-text acceptable for now?

- Next step (the single concrete next action):
  Oscar reviews the Pass 2 fix prompt for Cursor; once approved and run, re-verify anchor_select (P1), fill_blank (P2/P4/P5), and scorecard labels (P10) as the test student, then proceed to Pass 3 draft.

---

=== LOG UPDATED: 2026-07-03 20:14 (America/Detroit) — Oscar approved Pass 2 fix prompt; anchor multi-select added to spec (v2) ===

- Context / why this was done:
  Oscar answered the three open questions from the 20:03 entry.

- What was attempted (specific):
  Updated CURSOR-PROMPT-pass2-fixes.md to v2 (not yet run in Cursor).

- Cursor prompt used: none yet — v2 drafted and handed to Oscar to run.

- Files changed (`git status`): only BUILD-LOG.md (this entry). No code changes.

- Local build / commit / deploy / migration: none this entry.

- Verification performed: n/a (decision record).

- Decisions made:
  1. Q1 APPROVED — Oscar approved running the Pass 2 fix prompt in Cursor.
  2. Q2 RESOLVED — Oscar confirmed NO superadmin manual content edits exist, so re-running scripts/seed-workbook-content.ts is safe (nothing to lose).
  3. Q3 DECIDED — anchor_select must be a true MULTI-SELECT, not free text. Spec added to the fix prompt as Change 4: seed line gains `| options:` segment with the 6 anchors transcribed verbatim from the P1 "Identity Anchors" framework (Clear communicator, Reliable executor, Always prepared, Organized and structured, Connector of people and information, Calm and composed); parser carries options through to DB; renderer shows chips (max 3) each revealing a reason textarea; stored answer keys stay anchor1..3/reason1..3 so Pass 3's data shape is unchanged; free-text fallback kept when options absent.

- Open questions / things needing Oscar's input: none — waiting on Oscar to run the v2 prompt in Cursor.

- Next step (the single concrete next action):
  Oscar runs CURSOR-PROMPT-pass2-fixes.md (v2) in Cursor, then the deploy ritual: git status must show changes → npm run build → commit/push (include BUILD-LOG.md) → re-run seed script → Vercel green → I re-verify P1 anchor chips, P2 fill_blank, P10 scorecard as test student and log results.

---

=== LOG UPDATED: 2026-07-03 20:56 (America/Detroit) — Cursor ran the v2 fix; diff reviewed and approved; awaiting push + re-seed ===

- Context / why this was done:
  Oscar ran the approved v2 prompt in Cursor and reported results back.

- What was attempted (specific):
  Reviewed Cursor's full diff in the working tree against the v2 spec before push ("verify, don't assume").

- Cursor prompt used: CURSOR-PROMPT-pass2-fixes.md v2 (run by Oscar in Cursor).

- Files changed (exact list from `git status`, confirmed by Oscar's terminal output AND my diff review):
  modified: components/modules/exercise-card.tsx, components/modules/structured-exercise-input.tsx, lib/content-normalize.ts, lib/exercise-answers.ts, lib/workbook-seed-parser.ts, types/modules.ts, workbook-content-seed.md. Untracked: BUILD-LOG.md. (287 insertions / 39 deletions per diffstat.)

- Local build result: PASS — Oscar's terminal: ✓ Compiled successfully in 2.8s, ✓ Finished TypeScript in 2.4s (Next.js 16.2.6).

- Commit hash + message: not yet committed — push is the next action.

- Deploy result: not yet deployed.

- Migration run? No migration involved. Re-seed script run still REQUIRED after push (scripts/seed-workbook-content.ts) — the P1/P10/P13 field data in Supabase is still mangled until then.

- Verification performed (diff review, code-level):
  - parseFields now splits commas FIRST; `(score + notes)` descriptors collapse to a single field with clean label; scorecard "Total /NN" rows skipped; `N pairs of {a,b}` branch untouched. ✓ spec
  - parseExerciseLine parses optional `| options:` segment; options flow through ParsedExercise → toDbExercises → content-normalize → renderer props. ✓ spec
  - isAnswerEmpty: fill_blank now uses new shared fillBlankValueKeys() (same keys the renderer writes); anchor_select and rewrite_pairs fall back to raw-field check when grouping is empty ([].every footgun closed). exercise.key threaded from ExerciseCard. ✓ spec
  - AnchorSelectChips: chip buttons from options, max = number of anchor pairs (3), unselected chips disabled at max, reason textarea per selection, selections compact on deselect, stored under anchor1..3/reason1..3 (answer shape unchanged for Pass 3). Free-text fallback retained when options absent. ✓ spec
  - Seed line P1 exercise 1 gained the options list verbatim from the Identity Anchors framework. ✓ spec
  - Browser verification NOT yet possible — changes not deployed and DB not re-seeded.

- Decisions made: diff approved for push as-is; no rework requested.

- Open questions / things needing Oscar's input: none — next actions are Oscar's (push + seed script).

- Next step (the single concrete next action):
  Oscar: `git add -A && git commit -m "fix: pass 2 exercise save (fill_blank/anchor_select), seed parser field mangling, anchor multi-select" && git push origin main`, then `npx tsx scripts/seed-workbook-content.ts`, confirm Vercel deploy Ready. Then I re-verify in the browser and log.

---

=== LOG UPDATED: 2026-07-03 23:49 (America/Detroit) — Fix deployed & verified working; RE-SEED STILL NOT RUN (blocks P1 chips + P10/P13 scorecard labels) ===

- Context / why this was done:
  Oscar pushed commit 403d904 ("fix: pass 2 exercise save (fill_blank/anchor_select), seed parser field mangling, anchor multi-select" — 8 files, 412 insertions, includes BUILD-LOG.md). His first seed-script attempt FAILED with "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" (tsx does not auto-load .env.local). Correct command supplied: `npx tsx --env-file=.env.local scripts/seed-workbook-content.ts` (both keys confirmed present in .env.local by name). Oscar then said "ready"; browser verification performed.

- What was attempted (specific): browser re-verification as student@test.com against Production.

- Cursor prompt used: n/a (verification).
- Files changed (`git status`): BUILD-LOG.md only (this entry).
- Local build result: n/a. - Commit: 403d904 pushed to main earlier this session.
- Deploy result: new code CONFIRMED LIVE on ca-lms.vercel.app (behavioral proof below).
- Migration run? No. RE-SEED SCRIPT: NOT YET RUN SUCCESSFULLY — this is the open blocker.

- Verification performed (exact steps + results):
  1. fill_blank FIXED ✓ — P2 "Build Your North Star": filled all 3 blanks, Save succeeded ("Saved" + Last updated, displayed 8:44 PM browser-local). Previously impossible (validation bug). After full reload, all 3 values pre-fill (confirmed via DOM inspection: input values = "help teams communicate clearly" / "structured writing and operations work" / "good ideas actually ship"; note the accessibility tree misleadingly shows placeholders, so a JS DOM check was used as ground truth). Saved row confirmed in server payload: exercise_key build_your_north_star, values keyed build_your_north_star_blank_0..2.
  2. anchor_select empty-group footgun FIXED ✓ — P1: typing into the (still-mangled) fallback "anchor1" field and saving now WORKS ("Saved" + timestamp, displayed 8:43 PM). Previously always rejected.
  3. Regressions ✓ — P1 rewrite_pairs answers still pre-fill (pairs 1+2 intact); P2 reflection still pre-fills with its timestamp.
  4. NOT YET FIXED (data, not code): P1 still renders the single fallback "anchor1" field — NO chips (options not in DB). P10 scorecard labels still mangled ("notes), Skill Development (score", bogus "Total /25" row). Both require the re-seed.

- Decisions made: treated accessibility-tree "empty input" readings as unreliable for pre-fill verification; DOM value inspection is the standard going forward.

- Open questions / things needing Oscar's input: none — one action pending on Oscar's Mac (see next step).

- Next step (the single concrete next action):
  Oscar runs: `npx tsx --env-file=.env.local scripts/seed-workbook-content.ts` (must print "Re-seeding workbook body content for 14 modules..." and finish without error). Then I verify P1 anchor chips (6 options, max 3, reasons, save/persist) and P10/P13 scorecard labels + "/25" total, then log and proceed to drafting Pass 3.

---

=== LOG UPDATED: 2026-07-04 16:56 (America/Detroit) — Re-seed verified: ALL Pass 2 fixes confirmed working end-to-end. Pass 2 verification CLOSED. Two minor follow-ups logged ===

- Context / why this was done:
  Oscar ran the re-seed successfully (`npx tsx --env-file=.env.local scripts/seed-workbook-content.ts`, confirmed in Cursor terminal). Final browser verification of the seed-dependent fixes.

- What was attempted (specific): browser verification as student@test.com on Production (commit 403d904 + re-seeded DB).

- Cursor prompt used: n/a. Files changed: BUILD-LOG.md only. Build/commit/deploy: none new. Migration: n/a (re-seed completed by Oscar).

- Verification performed (exact steps + results):
  1. P1 anchor_select multi-select FULLY WORKING ✓ — renders all 6 chips verbatim from the workbook framework (Clear communicator, Reliable executor, Always prepared, Organized and structured, Connector of people and information, Calm and composed). Selected 2 chips ("Always prepared", "Calm and composed"): counter updates (3/3 incl. legacy entry, see follow-up 1), reason textarea appears per selection, 4th chip click correctly blocked (unselected chips disabled at max). Typed a reason, saved → "Saved" + timestamp. Full reload: chip selections persist (selected chips enabled/highlighted, others disabled), reason pre-fills (DOM-verified).
  2. P10 scorecard FIXED ✓ — 5 cleanly-labeled rows (Manager Quality, Skill Development, Learning Velocity, Environment/Culture, Brand/Trajectory), bogus "Total /25" row gone, total reads "/ 25". Set Manager Quality=4 → live "Total: 4 / 25", saved successfully ("Saved" + timestamp).
  3. fill_blank re-confirmed working post-re-seed (P2 values still pre-filled).

- FOLLOW-UPS DISCOVERED (logged, not blocking, no action taken):
  1. Legacy free-text anchor answer on the TEST ACCOUNT (saved pre-fix into fallback field) now occupies selection slot 1 with no matching chip and has no remove control in the chips UI. Only affects answers saved before the fix (i.e., just the test student). Options: clear that exercise_answers row, or add a remove control per selection card. Oscar to choose (can fold into a later pass).
  2. P10 module QUIZ question 2 renders ~11 radio options (brand/trajectory, GPA, school, major, network, luck, Prestige, pay, perks, people, place) — quiz OPTION parsing from the seed appears comma-mangled for at least this question. Separate from the exercise fields fix. Note: quizzes were already flagged for Oscar's content review (they're Claude-derived); fold an options-parsing check into that review.

- Decisions made: Pass 2 verification is CLOSED — all 8 input-type save paths that exist in seeded content behave correctly (reflection, rewrite_pairs, scorecard, fill_blank, anchor_select verified working; star/checklist/tier_map not present in any seeded module exercise encountered — no seeded instances found in P1/P2/P4/P5/P10 checks; they share the same fixed validation paths).

- Open questions / things needing Oscar's input:
  1. Follow-up 1 above: clear the test student's legacy anchor row, or add a per-selection remove control?
  2. Follow-up 2: fold quiz-option parsing check into the planned quiz content review?

- Next step (the single concrete next action):
  Draft the Pass 3 Cursor prompt (profile living-workbook display per handoff brief Section 4B) and submit to Oscar for review. Pass 2 is no longer a blocker.

---

=== LOG UPDATED: 2026-07-05 11:28 (America/Detroit) — Oscar's scope decisions recorded; Pass 3 Cursor prompt drafted, AWAITING OSCAR'S REVIEW ===

- Context / why this was done:
  Oscar answered the open questions from the 2026-07-04 16:56 entry, plus the Pass 3 scope question from the handoff brief (§4B "confirm with Oscar").

- Decisions made (all Oscar's, this entry exists to relay them to the core chat):
  1. Legacy anchor answer: ADD A PER-SELECTION REMOVE CONTROL (× on each selection card) rather than deleting the test row — folded into the Pass 3 prompt as an approved Pass 2 follow-up.
  2. Quiz-option parsing bug (P10 Q2 rendering ~11 mangled options): FOLD INTO the planned quiz content review (quizzes are Claude-derived and were already flagged for Oscar's accuracy review).
  3. Pass 3 scope: INCLUDE the other-student profile view now. Oscar's words: the profile is the social aspect — students within cohorts should be able to view each other, "like social media — if you'd like to go private you can." So: /profile (own, everything + toggles) AND /profile/[student-id] (public answers only, authenticated users). No discovery/browse UI yet (Pass 4).
  4. Flagged for LATER (recorded in the prompt, not in this pass): cohort/institution scoping of public answers — current RLS lets any authenticated user view public answers; decide before onboarding a second institution.

- What was attempted (specific): drafted CURSOR-PROMPT-pass3-profile.md (delivered to Oscar via Cowork). Key technical points baked into the prompt: read-only per-input-type answer renderer (shared component, reusable by the future activity feed); pillar→module→exercise grouping with ascending P-number sort (module_code numeric — NOT unlock_week, avoiding the known /program ordering bug); dedicated `setAnswerVisibility` server action for profile toggles (deliberately NOT reusing saveExerciseAnswer, which asserts the video gate); explicit is_public filter in the public-view query as defense in depth; no migrations, no RLS changes.

- Cursor prompt used: none run yet. Files changed: BUILD-LOG.md only. Build/deploy/migration: none.
- Verification performed: n/a (drafting entry).

- Open questions / things needing Oscar's input:
  1. Approve CURSOR-PROMPT-pass3-profile.md to run in Cursor?

- Next step (the single concrete next action):
  Oscar reviews/approves the Pass 3 prompt → runs it in Cursor → deploy ritual (git status → npm run build → push incl. BUILD-LOG.md → NO re-seed needed → Vercel green) → I verify both profile views in the browser and log.

---

=== LOG UPDATED: 2026-07-05 13:28 (America/Detroit) — PASS 3 SHIPPED & FULLY VERIFIED (both profile views, toggle, privacy). Pass 3 CLOSED ===

- Context / why this was done:
  Oscar approved the Pass 3 prompt, ran it in Cursor, and pushed after my diff review. This entry records the diff review, deploy, and full browser verification.

- What was attempted (specific):
  (a) Pre-push diff review of Cursor's Pass 3 output. (b) Post-deploy browser verification of /profile (as test student) and /profile/[student-id] (as super admin).

- Cursor prompt used: CURSOR-PROMPT-pass3-profile.md (run by Oscar). Cursor's file list: NEW lib/profile-workbook.ts, components/profile/answer-display.tsx, answer-visibility-control.tsx, living-workbook-section.tsx, profile-identity-header.tsx, app/(protected)/profile/[student-id]/page.tsx; MODIFIED app/(protected)/profile/page.tsx, components/profile/profile-editor.tsx, app/actions/exercise-answers.ts (setAnswerVisibility), components/modules/structured-exercise-input.tsx (× remove control).

- Files changed (git status before commit): matched Cursor's list exactly + BUILD-LOG.md.

- Local build result: PASS (Oscar's terminal: ✓ Compiled 2.6s, ✓ TypeScript 2.5s; route list shows new ƒ /profile/[student-id]).

- Commit hash + message: pushed to main as "feat: pass 3 living-workbook profile (own view + public student view, visibility toggle, anchor remove control)". (Hash not captured in chat — retrieve with `git log -1` if needed; my sandbox git access is disabled after the index.lock incident, see below.)

- Deploy result: Vercel Production Ready (Oscar confirmed; new route live and verified below).

- Migration run? No (none needed).

- INCIDENT (process note): my sandboxed `git status` created a stale `.git/index.lock` that blocked Oscar's commit; the sandbox couldn't delete it (mount permissions) — Oscar removed it manually (`rm .git/index.lock`). DECISION: I no longer run git commands against the repo from the Cowork sandbox; I read files directly instead. Oscar runs all git operations.

- Diff review findings (pre-push, all pass):
  - setAnswerVisibility scopes update with .eq("user_id", user.id) (ownership enforced server-side), requireStudent(), no video-gate assert, revalidates profile + module paths.
  - /profile/[student-id]: requireProfile() auth; own-id → redirect("/profile"); missing student → notFound(); portfolio fetched with publicOnly → explicit .eq("is_public", true) (defense in depth on top of RLS).
  - Sorting via parseModuleNumber(module_code) ascending (not unlock_week). Shared read-only renderer answer-display.tsx reuses lib/exercise-answers.ts helpers. × remove control compacts selections via existing writeAnchorSelections.

- Verification performed (exact steps + observed results):
  AS TEST STUDENT (student@test.com) on /profile:
  1. "My Living Workbook" renders below the edit-profile card (avatar upload UI intact). Grouped Pillar → Module → Exercise: Identity & Brand Building → P1 (anchors, rewrite pairs), P2 (brain dump reflection, North Star fill_blank); Career Navigation → P10 (scorecard). Ascending P-number order. ✓
  2. Read-only rendering per type: anchors as badges + reason text (incl. legacy free-text entry as a badge); rewrite pairs as before → after; reflection with field label; fill_blank as reconstructed sentence with emphasized values ("I want to help teams communicate clearly by/through structured writing and operations work so that good ideas actually ship."); scorecard row (Manager Quality 4) + "Total: 4 / 25". Timestamps on every entry. ✓
  3. Visibility toggle: clicked "Make public" on the P10 scorecard → badge flipped to Public immediately, timestamp refreshed; after full reload state persisted (2 Public / 3 Private across the account). ✓
  4. /profile/<own-id> redirects to /profile ✓. /profile/<nonexistent-uuid> → 404 ✓ (discovered accidentally via a wrong id, a useful negative test).
  AS SUPER ADMIN (Oscar's login, my browser tab) on /profile/87383f30-acd8-4ae7-93ef-08e775980adf:
  5. Identity header: Test Student, Demo University, avatar placeholder. ✓
  6. Shows EXACTLY the 2 public entries (P1 rewrite pairs, P10 scorecard), same grouping/renderer. ✓
  7. NO toggle/edit affordances anywhere. ✓
  8. PRIVACY LEAK CHECK: searched the full rendered HTML payload for the private answers' text (reflection "Messy processes...", fill_blank "help teams communicate clearly", anchor reason "never waste the room's...") — ALL ABSENT from the payload. Private data is not shipped to other viewers. ✓

- Decisions made: Pass 3 is CLOSED — built, deployed, verified. (× remove control on anchors deployed with it; not separately exercised this session — it's the same writeAnchorSelections path verified in Pass 2 chips testing.)

- Open questions / things needing Oscar's input: none new. Standing items: cohort/institution scoping of public answers (before institution #2); quiz content review incl. option-parsing bug (P10 Q2); Pass 1 content polish; /program page P10–P14 ordering fix; pre-launch service-role key roll (brief §5).

- Next step (the single concrete next action):
  Pass 4 (social layer: per-module comments + home-page activity stream) — draft scope with Oscar, then Cursor prompt for his review. The living workbook + public profiles it depends on are now live.

---

=== LOG UPDATED: 2026-07-05 19:23 (America/Detroit) — E1 (Experience Lift) kickoff: passthrough fact-check DONE, P1 proof design plan drafted, AWAITING OSCAR'S APPROVAL. No code written ===

- Context / why this was done:
  New phase brief COWORK-PASS-E1-look-and-feel.md (supersedes COWORK-RESTART-experience-lift.md): locked design direction — learning experience → Quizlet feel; profile → LinkedIn structure in CA's style. Restyle/restructure ONLY, no re-engineering (no new data models/engines; social layer + export + deep gamification explicitly deferred). Rollout locked: prove on ONE module first. Supporting docs received: CA-LMS-priorities-post-pass3.md (fact-check source) + CA-LMS-design-reference-library.md.

- What was attempted (specific):
  (a) Full passthrough as test student (dashboard, program tab, P1, P11, quiz, profile knowledge from Pass 3). (b) Reference study — NOTE: Quizlet blocks automated browsing (2 navigation timeouts) and LinkedIn walls logged-out automation; borrow-lists built from product knowledge, flagged for Oscar's gut-check. (c) Drafted E1-P1-PROOF-DESIGN-PLAN.md (delivered via Cowork).

- Cursor prompt used: none — per brief, NO code until Oscar approves the P1 proof plan.
- Files changed: BUILD-LOG.md only. Build/deploy/migration: none.

- Verification performed (passthrough fact-check of the priorities doc — ALL themes CONFIRM):
  - Theme 2 confirmed hard: P1 = 6+ identical callout cards (blue=concepts / gold=frameworks — data-model logic invisible to students); P11 "10-Week Audition" = 10 weeks in ONE paragraph; "six qualities" = run-on sentence; embedded lists flattened to prose everywhere.
  - Theme 4 quantified: P11 Q2 "six qualities" quiz question renders ~24 single-select radio options (same family as P10 Q2 mangled options) — CONTENT/parse fix, belongs to quiz-review workstream.
  - Theme 6 confirmed cheap: nav = Home/Program/Profile + tree; Program tab duplicates sidebar as plain lists AND still shows the P10,P14,P11,P13,P12 ordering bug (S4) live.
  - Placeholder video = huge black dead zone atop every module (major exam-portal contributor).
  - NEW observations beyond the doc: zero institution presence anywhere (relevant to Home-as-institution-space); "Behind pace" amber banner is the loudest dashboard element — demotivating first impression, propose momentum framing in the IA chunk.

- Decisions made (mine, all reversible, surfaced in the plan): recommend accent Option B "Campus Indigo" (one interaction accent; gold demoted to achievement-only); recommend P1-only proof with P11 as immediate stress-test; renderer-side list-pattern detection with prose fallback for the rollout (no seed changes in the proof).

- Open questions / things needing Oscar's input (numbered in E1-P1-PROOF-DESIGN-PLAN.md §6):
  1. Accent system: A Scholar Gold / B Campus Indigo (recommended) / C institution-adaptive now-or-later?
  2. Proof scope: P1 only (recommended) or P1+P11 two-page proof?
  3. Rollout list-formatting: renderer pattern-detection (recommended) vs seed-format extension + re-seed?
  4. Collapse placeholder video to slim "coming soon" strip?
  5. Quizlet-literalness dial 1–10 (recommend ~7).

- Next step (the single concrete next action):
  Oscar reviews E1-P1-PROOF-DESIGN-PLAN.md and answers decisions 1–5 → then I write the P1 proof Cursor prompt for his review → deploy ritual → live proof review.

---

=== LOG UPDATED: 2026-07-05 19:39 (America/Detroit) — Oscar answered all 5 E1 design decisions; P1 proof Cursor prompt drafted, AWAITING HIS GO-AHEAD TO RUN ===

- Context / why this was done:
  Oscar answered the E1 plan's numbered decisions. Recording them (this is the design-direction record for the whole E1 phase) and drafting the Cursor prompt.

- Decisions made (ALL Oscar's, verbatim intent):
  1. Accent = B "Campus Indigo": one vivid indigo interaction accent; gold demoted to achievement-only; navy = neutral ink. (C institution-adaptive theming deferred, not dead.)
  2. Proof scope = P1 only. (P11 stress-test follows approval, per plan.)
  3. Rollout list handling = RENDERER-side pattern detection with prose fallback. No seed-format changes.
  4. Placeholder video = YES, collapse to slim "coming soon" strip (one-line restore flag).
  5. Quizlet literalness = 6–7: "inspiration should be felt but not recognized" — energy via spacing/rounding/motion; CA's own type + colors; no Quizlet hex, no copied layouts. (This phrase is now the E1 styling north star, embedded in the Cursor prompt.)

- What was attempted (specific):
  Drafted CURSOR-PROMPT-E1-P1-proof.md (delivered via Cowork). Key mechanics: new experience GATED to P1 via lib/experience-lift.ts (EXPERIENCE_LIFT_MODULE_CODES=["P1"]) with new components in components/modules/v2/ so non-gated modules stay byte-identical; rollout later = adding module codes. Campus Indigo tokens; hero + Watch/Read/Do/Check station progress (derived from existing state only); sticky scroll-spy chips; slim video strip behind a restore flag; workbook-blocks v2 renderer (lede, numbered Key Ideas, frameworks as structured objects, application context cards); lib/workbook-format.ts pure-function detectors (colon-lists, arrow chains, enumerations, Week-sequences, before→after pairs) with unit tests and prose fallback; generic NarrativeCard (Maya) shipped in proof, exercised on P11 at rollout; exercises restyled as the dominant station WITHOUT touching save/visibility logic; quiz options as cards, no engine changes. Hard constraints: no schema/actions/seed/RLS/gamification changes; stop-and-flag rule if anything seems to need backend work.

- Files changed: BUILD-LOG.md only. Build/deploy/migration: none. Verification: n/a (drafting).

- Open questions / things needing Oscar's input: approve CURSOR-PROMPT-E1-P1-proof.md to run in Cursor (or request edits).

- Next step (the single concrete next action):
  Oscar runs the approved prompt in Cursor → deploy ritual (git status → npm run build → push incl. BUILD-LOG.md → no re-seed → Vercel Ready) → Cowork verifies P1 visually+functionally and confirms P2 unchanged → Oscar reviews the live proof and rules on rollout.

---

=== LOG UPDATED: 2026-07-06 00:03 (America/Detroit) — E1 P1 PROOF DEPLOYED & VERIFIED (visual + functional + gate isolation). Awaiting Oscar's formal proof verdict for rollout ===

- Context / why this was done:
  Oscar ran the E1 P1 proof prompt in Cursor; build passed (✓ Compiled 2.7s, ✓ TS 2.5s, workbook-format tests added); pushed to Vercel (note: first git status showed uncommitted — Oscar had Cursor complete the push). Cursor's summary matched the spec: gate lib/experience-lift.ts (["P1"]) + SHOW_PLACEHOLDER_VIDEO_STRIP flag; scoped .experience-lift Campus Indigo tokens in globals.css; new components/modules/v2/ (module-experience-v2, module-hero, station-nav, workbook-blocks, workbook-body, narrative-card, completion-check); lib/workbook-format.ts + tests; variant="lift" styling on existing exercise/quiz components without logic changes.

- Verification performed (browser, Production, as test student):
  P1 VISUAL — ALL SPEC ITEMS PRESENT:
  1. Hero: P1 chip, pillar tag, serif title, week/min metadata, 4-station progress bar reading 3/4 stations (Watch/Read/Do earned from existing state; Check pending — quiz not yet submitted). ✓
  2. Sticky Watch·Read·Do·Check chips with active state. ✓
  3. Slim "Video lesson — coming soon" strip replaces the black player. ✓
  4. Workbook: styled lede; KEY IDEAS as numbered sequence (indigo number chips, bold claims, inline key-phrase emphasis — no card wall); Identity Anchors colon-list → real bulleted list; Student-Mode Detector → bullets + labeled BEFORE→AFTER two-column pair; Identity Flywheel → chip step-chain diagram. The formatter detectors all fired correctly on real content. ✓
  5. Real-World Application → labeled context mini-cards (IN CLASS / IN CLUBS / IN CONVERSATIONS). ✓
  6. Completion Check: card targets + "0 of 5" counter. ✓
  7. "Do the work" station: Exercise 1 of 2 / 2 of 2 chips, "Saved ✓" chips on both saved exercises, dominant cards, indigo save buttons, anchor chips show persisted selections with × removes, saved answers pre-filled. ✓
  8. Quiz → "Check your understanding": options as selectable cards in a 2-col grid. ✓
  9. Color discipline: indigo everywhere interactive; NO gold on the module page. ✓
  P1 FUNCTIONAL REGRESSION:
  10. Edited anchor reason ("Calm and composed") and re-saved on the new UI → "Saved" + timestamp advanced. Persistence intact. ✓
  GATE ISOLATION:
  11. P2 renders the ORIGINAL experience (old header, full black video player, old workbook cards). Non-gated modules unaffected. ✓

- Decisions made: none mine — proof is live for Oscar's verdict. Oscar's initial reaction: "looks good," wants to expand site-wide.

- Open questions / things needing Oscar's input:
  1. Formal proof verdict: approve the P1 look as-is (or list tweaks)?
  2. On approval, rollout order per plan: flip P11 on FIRST (stress-test: 10-week timeline, Maya NarrativeCard, six-qualities content) → then all 14 modules. Confirm?

- Next step (the single concrete next action):
  On Oscar's verdict: one-line Cursor edit adding "P11" to EXPERIENCE_LIFT_MODULE_CODES → deploy → Cowork stress-tests P11 → then add remaining codes → then IA split → profile restyle.

---

=== LOG UPDATED: 2026-07-06 00:19 (America/Detroit) — Oscar's proof verdict recorded; P1.1 refinement + P11-enable Cursor prompt drafted, awaiting run ===

- Context / why this was done:
  Oscar reviewed the live P1 proof and gave a directional verdict rather than plain approval.

- Decisions made (Oscar's, verbatim intent — this is the styling adjustment record):
  1. Proceed with P11 next (stress-test before full rollout). APPROVED.
  2. Refinements required: page reads "quiet and compact" — use more of the margins (wider content usage), expand the content, LARGER text; readability is the priority ("making it more readable is huge here").
  3. Energy dial: raise Quizlet-likeness from ~6 to 7.5/10 (still "felt, not recognized").
  4. The HERO (module title + station progress "bubble") is the benchmark: "that look and feel and functionality I'm looking for" — the rest of the page should rise to it; the prompt echoes the hero's language down the page (station-level status affordances).

- What was attempted (specific): drafted CURSOR-PROMPT-E1-P1.1-refine-plus-P11.md — adds "P11" to the gate; type scale up (~17–18px reading base, bolder claim headings, station headers as real section moments); wider container (max-w-5xl territory) with prose kept at ~70ch measure (width goes to structure, not long lines); increased vertical rhythm/padding; bolder indigo usage, larger radii/chips/buttons, tasteful motion (hover lift, check animation, bar transitions; explicitly no confetti); all scoped to .experience-lift/v2.

- Files changed: BUILD-LOG.md only. Build/deploy: none yet. Verification: n/a.

- Open questions / things needing Oscar's input: none — run the prompt when ready.

- Next step (the single concrete next action):
  Oscar runs P1.1 prompt in Cursor → build → push → Vercel Ready → Cowork: stress-test P11 (Week-timeline detector, Maya NarrativeCard, six-qualities list, exercises/quiz function), re-check P1 refinements, confirm P2 isolation → report for rollout-to-all verdict.

---

=== LOG UPDATED: 2026-08-02 21:30 (America/Detroit) — LOG GAP CLOSED (~1 month). E1 P1.1 + P11 stress-tested in production: MOSTLY PASS, 2 formatter regressions found. ROLLOUT NOT RECOMMENDED until fixed ===

- Context / why this was done:
  Project paused ~2026-07-06 right after commit 96c8be1 ("feat: refine P1 experience lift and enable P11") — pushed but never verified; BUILD-LOG ended mid-flow ("awaiting run"). This entry closes that gap. Ground truth = live site + git tip, per Oscar's kickoff instruction.

- Session blockers resolved before testing (both worth remembering):
  1. Claude-in-Chrome extension was signed out — Oscar re-signed in.
  2. SUPABASE PROJECT WAS AUTO-PAUSED (free tier pauses after ~1 week idle; we were idle ~4 weeks). Symptom: login "Failed to fetch", app hangs; /rest/v1/ and /auth/v1/health returned empty instead of the normal "No API key" error. Oscar restored it from the dashboard; site recovered fully, all data intact. NEW STANDING ITEM: the project MUST be on a paid plan before real students/institutions onboard — an auto-pause during a cohort would take the academy offline. Track alongside the service_role key roll.

- Verification performed (live, as student@test.com, commit 96c8be1):
  P11 — "The 10-Week Audition" (primary test):
  1. 10-Week Audition renders as a STRUCTURED WEEK TIMELINE (indigo dot rail, WEEK 1…WEEK 10 eyebrows, each week's text on its own row) — NOT one paragraph. PASS ✓
  2. "Maya's summer audition" renders as the NarrativeCard (avatar chip, story styling) WITH a week mini-timeline. PASS (with cosmetic defects, below) ✓
  3. "Six qualities of the rising star narrative" render as a STRUCTURED LIST (one card per quality). PASS in structure — FAIL in fidelity (see R1) ⚠
  4. Exercises SAVE: typed into P11 Exercise 1 ("Build Your Internship Strategy Plan") → "Saved ✓" chip + "Last updated Aug 2, 2026, 9:20 PM". Pass 2 functionality intact under the lift. PASS ✓
  5. Quiz renders in lift styling (card options, 2-col grid, hover/selected states) and options are selectable. PASS ✓
  6. Station hero/nav/progress ("2 / 4 stations"), slim video strip, Completion Check with "0 of 7" counter: all present. PASS ✓
  P1 — refinement check (P1.1):
  7. Visibly larger type, wider content column, more vertical air, stronger indigo, station header check-badges echoing the hero. Refinements ARE live. PASS ✓
  P2 — isolation check:
  8. P2 renders the LEGACY UI (old header, full black video player, old workbook cards, no station nav). Gate isolation holding; lift did NOT leak. PASS ✓

- REGRESSIONS FOUND (both are formatter over-eagerness introduced/exposed by the P1.1 pass — presentation-only, no data impact):
  R1. COLON-LIST OVER-SPLITTING (both modules). The detector splits on commas inside parenthetical phrases, shattering single items:
      - P11 six qualities → "Coachability (do you listen" / "adjust" / "grow?)" as three separate cards (should be one card per quality, 6 total).
      - P1 Identity Gap → the two-identity contrast becomes 7 cards, and "communicates reactively. Pre-Professional Identity: takes initiative" merges two different identities into one card.
      - P11 networking message template → the quoted "Hey ___ / I'm interning with the ___ team…" template is split into 2 cards mid-sentence.
      Root cause (hypothesis, code not yet inspected this session): lib/workbook-format.ts colon-list detector splits on ALL commas without respecting parentheses/quotes, and fires on prose sentences that merely contain a colon.
  R2. DUPLICATE "Real-World Application" HEADING on P11 — the heading renders twice in a row (once from the heading block, once from the application-section wrapper). Cosmetic.
  R3 (minor, cosmetic): NarrativeCard title shows "M's story" instead of "Maya's story" — persona name truncated to its first character.

- Decisions made: NONE affecting code. Recommendation to Oscar: fix R1–R3 BEFORE rolling to the remaining 12 modules — the formatter runs on every module, so rolling now would multiply the same defects across the program. Rollout gate stays at ["P1","P11"] pending his verdict.

- Open questions / things needing Oscar's input:
  1. Approve a small E1.2 fix pass (formatter parenthesis/quote-aware splitting + stricter colon-list heuristic + duplicate-heading fix + persona-name fix), then roll to all 14?
  2. Or roll to all 14 now and fix formatter defects in place afterward (faster, but ships known defects program-wide)?
  3. Supabase paid-plan decision (new standing item) — timing before institution onboarding.

- Next step (the single concrete next action):
  Oscar answers Q1/Q2. If E1.2 approved: Cowork drafts the fix Cursor prompt (formatter-only, still presentation-only), Oscar runs it, Cowork re-verifies P1+P11, THEN the rollout flip of the remaining 12 module codes.

---

=== LOG UPDATED: 2026-08-02 21:45 (America/Detroit) — Oscar chose "A then B": fix formatter first, then roll to all 14. E1.2 fix prompt drafted (root causes confirmed in code) ===

- Context / why this was done:
  Oscar's verdict on the stress-test regressions: "A then B" — run the E1.2 fix pass, then the full 14-module rollout.

- Root causes CONFIRMED by reading the code this session (not hypothesis anymore):
  R1 lib/workbook-format.ts → detectColonList(): splits post-colon text with `.split(/,\s*/)` — no parenthesis/quote awareness (shatters "Coachability (do you listen, adjust, grow?)"), and its match regex is loose enough that ordinary prose containing a colon qualifies (P1 Identity Gap two-part contrast becomes one flat 7-item list; P11 quoted message template splits mid-sentence). Compounding factor: formatWorkbookBody() runs detectColonList BEFORE the more specific arrow/signal/enumeration detectors, so a stray colon wins first.
  R2 duplicate "Real-World Application": heading block + application-section wrapper both emit the heading.
  R3 components/modules/v2/narrative-card.tsx → extractPersona() returns `match?.[1]?.charAt(0)`, so the card title renders "M's story"; the full name is needed for the title, the initial only for the avatar.

- What was attempted (specific):
  Drafted CURSOR-PROMPT-E1.2-formatter-fixes.md (delivered via Cowork). Fix spec: depth-aware splitTopLevel() helper (ignores separators inside parens/brackets/quotes); bail to prose when post-colon content is predominantly a quoted template; tighten the list trigger (reject items containing sentence-end + capitalized word, reject >~12-word items); handle two-part "Label: …" contrasts either via a new contrast_groups type or prose fallback (Cursor to state which); re-order formatWorkbookBody so specific detectors run before the generic colon list; de-dupe the application heading; return full persona name for the title. Mandatory test additions: the three real failing strings + a genuine list that must still format + prose-with-colon that must stay prose.

- Files changed: BUILD-LOG.md only. Build/deploy/migration: none this entry.
- Verification performed: n/a (drafting entry; verification of the fix comes post-deploy).

- Decisions made: rollout stays gated at ["P1","P11"] until E1.2 verifies. Rollout list for step B is explicit: add P2–P10, P12, P13, P14.

- Open questions / things needing Oscar's input: none blocking — run the E1.2 prompt. (Standing: Supabase paid-plan timing before institution onboarding.)

- Next step (the single concrete next action):
  Oscar runs CURSOR-PROMPT-E1.2-formatter-fixes.md in Cursor → npm run build (+ formatter tests) → commit/push → Vercel Ready → Cowork re-verifies P1 + P11 (six qualities = 6 items, Identity Gap not fragmented, template intact, single Real-World Application heading, "Maya's story") → on pass, flip the remaining 12 codes and deploy the full rollout.

---

=== LOG UPDATED: 2026-08-04 20:01 (America/Detroit) — E1.2 DEPLOYED (commit 6eff116) & VERIFIED: all 3 target bugs FIXED. 2 new minor cosmetic issues found. Rollout decision pending ===

- Context / why this was done:
  Oscar approved "A then B" (fix formatter, then roll to all 14). Cursor implemented E1.2 and pushed as 6eff116. Cursor's report: 24 workbook-format tests pass; for spec item 4 it chose the CONTRAST_GROUPS option (not prose fallback); implemented splitTopLevel() (paren/bracket/quote-aware, apostrophe-safe), predominantly-quoted rejection, ≥2 capital-led items / ≤12 words / no ". Capital" glue, and detector order week → signal → arrow → enumeration → contrast_groups → colon list. Files: lib/workbook-format.ts, lib/workbook-format.test.ts, components/modules/v2/workbook-body.tsx, workbook-blocks.tsx, narrative-card.tsx.

- Verification performed (live, as student@test.com, commit 6eff116):
  ALL THREE TARGET BUGS FIXED:
  1. R1a P11 six qualities → exactly 6 intact items, parentheticals preserved ("Coachability (do you listen, adjust, grow?)", "Initiative (do you act without being asked twice?)", … "Learning Velocity (are you getting better each week?)"). PASS ✓
  2. R1b P1 Identity Gap → renders as CONTRAST GROUPS: two side-by-side titled cards, STUDENT IDENTITY (waits for instructions / asks permission before acting / completes tasks but doesn't own outcomes / communicates reactively) and PRE-PROFESSIONAL IDENTITY (takes initiative / communicates with clarity / follows up and closes loops / thinks ahead for the group), with intro above and outro below. No merged item, no 7-fragment flat list. Excellent result. PASS ✓
  3. R1c P11 networking message template → renders as intact readable prose; no mid-sentence split. PASS ✓
  4. R2 P11 "Real-World Application" heading → appears ONCE. PASS ✓
  5. R3 NarrativeCard → titled "Maya's story" (full name), avatar chip shows "M". PASS ✓
  REGRESSION CHECKS (things that worked before and must still work):
  6. P1 Identity Anchors → still a proper 6-item list. PASS ✓
  7. P1 Student-Mode Detector BEFORE→AFTER pair → still renders. PASS ✓
  8. P11 10-Week Audition timeline → still full 10-beat timeline. PASS ✓
  9. P11 Handling Ambiguity → now renders as a numbered 1–5 list (enumeration detector) — improvement over prose. PASS ✓

- NEW MINOR COSMETIC ISSUES (introduced by the detector re-ordering; NOT blocking, NOT data-affecting):
  N1. P1 Key Idea 3 "Identity Is Built Through Action": the arrow-chain detector now fires on prose containing "→" and swallows whole sentences into chips — first chip reads "Most students wait to feel confident before acting. Professionals act, then let confidence catch up. Small behavior", last chip reads "repeat. Identity does not come from self-belief. It comes from repetition". Before E1.2 this rendered as plain prose. Cause: arrow detector now runs before colon list, and its intro/outro trimming only handles the "The earlier…" tail pattern, so surrounding sentences get absorbed into the first/last step. Fix would be: trim to sentence boundaries around the arrow run (only the clause containing the arrows becomes the chain).
  N2. P1 Student-Mode Detector intro list ("apologize before speaking, over-explain or ramble, …") now renders as prose instead of the bulleted list it showed in the P1 proof — the stricter colon-list trigger (sentence-end + capital rule / word-count) rejects it. Readable, but a mild downgrade in structure.

- Decisions made: none unilateral. Recommendation to Oscar: N1/N2 are cosmetic and readable (unlike the pre-E1.2 shattering, which was genuinely broken), so rollout is defensible now; but N1 in particular looks sloppy (full sentences inside pills) and WILL recur on other modules containing "→" in prose. Options presented: (i) one more small tuning pass (sentence-boundary trimming for arrow chains + slightly relaxed colon-list trigger) before rollout, or (ii) roll to all 14 now and fold N1/N2 into a later polish pass.

- Open questions / things needing Oscar's input:
  1. Roll to all 14 now, or one more quick tuning pass for N1/N2 first?

- Next step (the single concrete next action):
  On Oscar's answer: either (i) draft the N1/N2 tuning prompt, or (ii) one-line change adding P2–P10, P12, P13, P14 to EXPERIENCE_LIFT_MODULE_CODES → deploy → spot-check a sample of newly-lifted modules (suggest P4, P6, P13) → then IA split (Home/Dashboard) per the E1 roadmap.

---

=== LOG UPDATED: 2026-08-04 20:12 (America/Detroit) — Oscar chose the tuning pass before rollout; E1.3 prompt drafted ===

- Context / why this was done:
  Oscar's answer to the open question: quick tuning pass first, THEN roll to all 14. Rationale accepted: N1 (sentences inside arrow pills) will recur on any module whose prose contains "→", so fixing before multiplying across 14 modules keeps the same discipline that caught the R1 shattering bug.

- What was attempted (specific):
  Drafted CURSOR-PROMPT-E1.3-detector-tuning.md (delivered via Cowork). Spec:
  Tune 1 — clamp arrow chains to SENTENCE BOUNDARIES around the arrow run (walk left/right from first/last arrow to nearest sentence boundary; text outside becomes intro/outro), replacing the hardcoded /The earlier…/ special case with a general rule; keep the ≥3-step guard, prose fallback if clamping leaves fewer.
  Tune 2 — relax the E1.2 colon-list trigger just enough to restore P1 Student-Mode Detector's 5-item list: drop the "capital-led items" requirement (lowercase items are valid) in favour of style CONSISTENCY (all capital-led or all lowercase-led); explicitly KEEP the depth-aware split, quoted-template rejection, ≤12-word cap, and the ". Capital" glue rule (the one preventing the Identity Gap merge) — but apply the glue rule within candidate items only, not to trailing outro text.
  Tests mandatory: new cases for both strings (arrow chain = exactly 4 steps with no "." inside any step, plus non-empty intro AND outro; Student-Mode = 5 items with outro containing "Rewrite each behavior") and all existing E1.2 cases must stay green.

- Files changed: BUILD-LOG.md only. Build/deploy/migration: none this entry. Verification: n/a (drafting).

- Decisions made: rollout remains gated at ["P1","P11"] until E1.3 verifies. Rollout step is now explicitly "set EXPERIENCE_LIFT_MODULE_CODES to all 14 (P1–P14)".

- Open questions / things needing Oscar's input: none — run the E1.3 prompt.

- Next step (the single concrete next action):
  Oscar runs CURSOR-PROMPT-E1.3-detector-tuning.md → build/tests → commit/push → Vercel Ready → Cowork re-verifies P1 (Key Idea 3 chain clean, Student-Mode list back, contrast groups + anchors intact) and P11 (six qualities, timeline, Maya, single RWA heading) → on pass, flip all 14 codes, deploy, spot-check P4/P6/P13 → then the Home/Dashboard IA split.

---

=== LOG UPDATED: 2026-08-04 21:03 (America/Detroit) — E1.3 DEPLOYED (commit 5c0d571) & VERIFIED CLEAN. FORMATTER WORK COMPLETE. Cleared for the all-14 rollout ===

- Context / why this was done:
  Oscar chose the tuning pass before rollout. Cursor implemented E1.3 and pushed as 5c0d571 ("fix: clamp arrow chains to sentence boundaries; allow lowercase colon lists"); 28 workbook-format tests + build green.
  NOTABLE — Cursor self-caught a regression while implementing: allowing lowercase-led colon lists made the P1 Identity Gap leak back into detectColonList; it added a deferral so contrast_groups wins when it matches. That was the exact risk called out in the E1.3 spec's "keep the glue rule" caveat, caught before it shipped.

- Verification performed (live, as student@test.com, commit 5c0d571):
  P1 — both tuning targets FIXED, no collateral:
  1. N1 Key Idea 3 "Identity Is Built Through Action" → intro prose ("Most students wait to feel confident before acting. Professionals act, then let confidence catch up.") ABOVE a clean 4-chip chain (Small behavior → small win → small confidence → repeat), outro below. No sentences inside pills. PASS ✓
  2. N2 Student-Mode Detector → 5-item list restored ("apologize before speaking" …), with the "Rewrite each behavior… Example:" text as outro and the BEFORE→AFTER pair still rendering. PASS ✓
  3. Identity Gap → STILL contrast groups (leak fix holding). PASS ✓
  4. Identity Anchors → still a 6-item list. PASS ✓
  5. BONUS improvement: Key Idea 2 "Signals Create Reputation" now renders its signals as a proper 5-item list (previously prose) — the lowercase-lead relaxation working as intended, including the quoted item "proactive clarity ("Here's what I understand and what I'll do next")" kept intact by the depth-aware split. PASS ✓
  P11 — no regressions from the tuning:
  6. Six qualities → still exactly 6 intact items. PASS ✓
  7. 10-Week Audition timeline, Maya NarrativeCard, single Real-World Application heading → all unchanged. PASS ✓

- Decisions made: formatter work (E1.2 + E1.3) is COMPLETE and verified. No further tuning needed before rollout — the detector suite now handles every content pattern present in the two hardest modules (week timelines, contrast groups, colon lists w/ parentheticals + quotes, arrow chains in prose, enumerations, before→after pairs) with prose fallback everywhere else.

- Open questions / things needing Oscar's input: none. Rollout is cleared.

- Next step (the single concrete next action):
  Flip the gate: set EXPERIENCE_LIFT_MODULE_CODES in lib/experience-lift.ts to all 14 codes (P1–P14) → build → push → Vercel Ready → Cowork spot-checks P4, P6, P13 (modules never seen in the new UI; they carry star/checklist/tier_map/scorecard exercise types not present in P1/P11) → then the Home/Dashboard IA split per the E1 roadmap.

---

=== LOG UPDATED: 2026-08-04 21:08 (America/Detroit) — E1 ROLLOUT COMPLETE (commit 44950a3): all 14 modules on the Campus Indigo experience. Spot-checks PASS. E1 module-page phase CLOSED ===

- Context / why this was done:
  With E1.3 verified, Oscar had Cursor flip EXPERIENCE_LIFT_MODULE_CODES to P1–P14 and pushed as 44950a3. This entry records the post-rollout spot-checks.

- Verification performed (live, as student@test.com, commit 44950a3) — sampled modules chosen because they carry exercise/content types absent from P1/P11:
  P4 "Student Resume + Early LinkedIn Kit" (star + fill_blank + reflection):
  1. Full lift present: hero + 2/4 station progress, station chips, slim video strip, numbered Key Ideas. PASS ✓
  2. "The Resume Structure" framework → prose with an inline chip chain (1–2 lines connecting identity → purpose → goal) — arrow clamping behaving correctly on a NEW module. PASS ✓
  3. Real-World Application → 4 labeled context cards in a grid. PASS ✓
  4. Completion Check "0 of 5"; Do-the-work station with "Exercise 1 of 3" chips; rewrite_pairs (WEAK BULLET / STRONG REWRITE) renders as two-column pair. PASS ✓
  P13 "Opportunity Mapping & Direction Setting" (scorecard + fill_blank + reflection, Maya content):
  5. "The 3–4–5 Star Opportunity Model" → clean 5-item list (5-star … 1-star), each with its parenthetical intact — the depth-aware split working on new content. PASS ✓
  6. Maya NarrativeCard renders with correct "Maya's story" title. PASS ✓
  7. Exercises 1–3 render (reflection, fill_blank with inline blanks, scorecard). PASS ✓
  P6 "Communication That Builds Real Professional Relationships":
  8. Full lift, numbered Key Ideas, inline bold emphasis, quoted content preserved intact. PASS ✓
  NOTE: P6's URL slug is /communication-professional-relationships (NOT the full title slug) — a guessed slug 404s. Sidebar links are the source of truth for slugs.

- PRE-EXISTING CONTENT ISSUE SURFACED (not caused by the lift; belongs to the content/quiz workstream):
  C1. P13 Exercise 3 "Opportunity Comparison Table" (scorecard) renders three rated rows: "Role A (5 criteria scored /25)", "Role B (5 criteria scored /25)", and "Which direction does your future self choose and why?" — with Total: 0 / 15. The seed line defines those three strings as scorecard FIELDS, so each becomes one 1–5 row: Role A/B should each be a 5-criteria sub-table, and the "which direction" prompt is a reflection question, not a scored row. This is a SEED-AUTHORING mismatch (the content asks for a richer structure than input_type scorecard supports), visible before the lift too — the lift just makes it legible. Fix options for later: (a) re-author the P13 seed line into 5 criteria rows + a separate reflection exercise, or (b) extend scorecard to support grouped sub-tables. Low priority; no data/save impact (saving works).

- Decisions made: E1 module-page work is COMPLETE — proof (P1) → refinement (P1.1) → stress-test (P11) → formatter fixes (E1.2) → tuning (E1.3) → full rollout (14/14), all verified in production. C1 logged to the content workstream, not treated as an E1 defect.

- Open questions / things needing Oscar's input:
  1. Ready to start the Home/Dashboard IA split (next E1 chunk), or take the profile restyle first?
  2. C1 (P13 scorecard authoring) — fold into the quiz/content review workstream? (recommended)

- Next step (the single concrete next action):
  Oscar picks the next E1 chunk. Per the E1 roadmap the order is: IA split (Dashboard vs Home, Program tab as overview, completion bar) → then profile restyle (LinkedIn-structure sections, answer-source clarity, customization). Standing items unchanged: Supabase paid plan before institution onboarding; service_role key roll; quiz content review (incl. P10/P11 option sprawl + C1); Pass 1 grammar polish; /program P10–P14 ordering (S4); Pass 4 social layer held.

---

=== LOG UPDATED: 2026-08-16 20:11 (America/Detroit) — WS1 IA-split plan + WS2 C1 fix options drafted. BOTH AWAITING OSCAR'S DECISIONS. No code written ===

- Context / why this was done:
  New pass brief: two separate workstreams, separate commits — WS1 the Home/Dashboard IA split (structural, plan-first per brief), WS2 the C1 P13 scorecard content fix. Guardrails: routing/nav/presentation only; no auth/role/gate-flag changes; gate stays P1–P14; flag anything needing a data model instead of building it.

- WS1 — IA SPLIT PLAN (E1-IA-SPLIT-PLAN.md delivered):
  Current state read from code (not assumed): nav is 3 items in BOTH app-sidebar.tsx and mobile-nav.tsx, with "Home" ALREADY pointing at /dashboard — there is no separate home page today (app/page.tsx is the pre-login root). /dashboard holds greeting, 4 stat cards (Progress % at dashboard/page.tsx ~line 70), pace banner, program feed/timeline, Continue Learning, Live Sessions. /program renders 3 pillar cards of plain module links and sorts by unlock_week (~line 36) = the S4 ordering bug, live on the page we're rebuilding. PILLARS in types/modules.ts has slug/label/weeks but NO description copy — so pillar/module "what it's for" text does not exist and must come from somewhere (Decision 3).
  Proposal: NEW /home (institution hero, at-a-glance completion bar + Continue Learning, 3–4 navigate cards incl. a decorative disabled "Community" placeholder for Pass 4, live sessions moved here) · /dashboard KEEPS its route (only the nav label changes Home→Dashboard, avoiding link/redirect breakage) · nav becomes 4 items in both sidebar and mobile · Progress % stat card → momentum completion bar ("3 of 14 modules complete", Campus-Indigo fill, same language as the module station bar; same computed data, no new tracking) · /program becomes an overview (pillar sections with descriptions + compact module cards with status chips, ascending P-number).
  Explicitly NOT built, flagged: per-institution colorway theming (needs an institution-branding data model), Pass 4 community, profile restyle, any auth/gate change.
  Decisions surfaced (5): post-login landing /home vs /dashboard (rec /home); live sessions placement (rec Home); source of pillar/module description copy — I draft from existing DB overview text for Oscar's review vs Oscar writes vs auto-excerpt (rec: I draft, reviewed); retitle Program tab (rec: keep); fold S4 ordering fix into this pass (rec yes).

- WS2 — C1 FINDINGS (C1-P13-scorecard-fix-options.md delivered):
  VERIFIED against the workbook source: the exercise instruction "Rate them 1–5 using the Fit Table" refers to P10's Opportunity Fit Table (Manager Quality, Skill Development, Learning Velocity, Environment/Team Culture, Brand/Career Trajectory, /25). Confirmed by P13's own concept text ("Using the five factors from P10") and by Maya's example scoring 18 vs 15 (i.e. out of 25). Correct structure = two roles × 5 criteria + one reflection.
  BLOCKER FOUND: this canNOT be fixed by editing the seed line alone — input_type `scorecard` supports only ONE rated group with one total, not two parallel scored roles. Three options given: (A) split into 3 exercises — Role A scorecard /25, Role B scorecard /25, reflection — seed-only, no code, RECOMMENDED; (B) extend scorecard with grouped sub-tables — truest to the workbook but touches renderer + answer shape + isAnswerEmpty, i.e. re-engineering the input system, which E1 guardrails say to flag not build; (C) single-role scorecard + reflection — simplest but drops the comparison and would alter workbook-derived instruction text (needs Oscar's sign-off per the handoff brief's content rule).
  ALSO FOUND while verifying (flagged, NOT fixed here): P13 quiz Q2 has the same option-sprawl bug as P11 Q2 — four multi-word answers split into 12 fragments; correct answer stored as "Salary, brand name, location". Added to the quiz content review workstream.

- Files changed: BUILD-LOG.md only. Build/deploy/migration/re-seed: none this entry (no code written, per brief).

- Open questions / things needing Oscar's input:
  1–5. The five IA decisions above.
  6. C1-1: Option A (recommended), B, or C?

- Next step (the single concrete next action):
  Oscar answers the IA decisions + C1-1 → I write two SEPARATE Cursor prompts (WS1 IA split incl. S4 fix; WS2 C1 seed edit) → Oscar runs each, commits separately, and for C1 re-runs `npx tsx --env-file=.env.local scripts/seed-workbook-content.ts` (code-push alone does NOT update module content) → I browser-verify both.

---

=== LOG UPDATED: 2026-08-16 20:30 (America/Detroit) — Oscar's decisions: IA SPLIT CANCELLED (dashboard IS home); scope becomes a landing/live-session/Curriculum reskin. Two Cursor prompts drafted. MAJOR CONTENT FINDING on live sessions ===

- Context / why this was done:
  Oscar answered the six open decisions. His answer to #2 reshaped the whole workstream.

- DECISIONS (Oscar's, verbatim intent — this supersedes the E1-IA-SPLIT-PLAN proposal):
  1. NO HOME/DASHBOARD SPLIT. "Dashboard is home and home is dashboard. I see no reason to have the dashboard not be the home page, at least from a student perspective." → /dashboard stays the single post-login landing, keeps the "Home" nav label; NO /home route. What he actually wants is the QUIZLET/CAMPUS-INDIGO RESKIN extended to the landing page — "it's still missing the formatting from our Quizlet edits… we're still trying to get away from the AI built look."
  2. Per-institution/cohort individualization (colorways): PASS for now (he checked whether logs said otherwise — logs only ever listed it as a profile-customization idea + Circle-style reference, never a committed plan; recorded as deferred, not dropped).
  3. Live sessions: give them their WEEK and a not-yet/available status; prefer rolling them INTO the timeline rather than a separate box. But titles-vs-curriculum is "probably more important than where they actually live".
  4. Program tab: retitle approved — "Program is super lame" — he had no preference. I chose **"Curriculum"** (institution-credible, boilerplate-clear); route stays /program. Overridable.
  5. S4 ordering fix: folded into this pass. APPROVED.
  6. C1: Option A APPROVED (split into Role A scorecard /25, Role B scorecard /25, reflection).
  7. Pillar/module copy question was unclear to him ("no clue what you're talking about") — my explanation was bad, not his gap. Resolved by DECIDING it rather than re-asking: the Cursor prompt derives module one-liners from each module's stored workbook overview (first sentence, truncated at a sentence boundary) and forbids new invented copy. He reviews the result on screen.
  8. FORWARD-LOOKING (logged, NOT this pass): Oscar wants to start considering how people REACH the sign-in page — a front-facing site like corpacad.com with insights/YouTube links, an institutional page, and "log in here for the actual product". This is the public marketing site already on the roadmap; his framing adds that the sign-in entry point and the institutional page should be designed as one connected concept. Also noted: the product "looks kind of dead only because we haven't put a real group through here" — real names/institutions will carry a lot of the perceived-life problem, so we should not over-engineer liveliness now.

- MAJOR FINDING — LIVE SESSION CONTENT IS AI-INVENTED AND SURVIVED THE PASS 1 RE-SEED (needs Oscar's source material):
  Oscar was right that live session titles don't match the curriculum; it's worse than titles. Live sessions live in content/live-sessions.ts + migration 20240526200000_seed_phase3_all_modules.sql (LS1–LS4: "Pillar 1 Completion Live Session", "Communication Practice Live Session", "Visibility & Relationships Live Session", "Opportunity Alignment Live Session"). They are NOT in workbook-content-seed.md, and scripts/seed-workbook-content.ts only re-seeds the 14 workbook modules (it filters is_live_session=false) — so the Pass 1 "replace AI approximation with real workbook content" pass NEVER TOUCHED THEM. They remain Phase-3 Claude-authored content.
  Evidence they are invented: every distinctive term in their descriptions appears ZERO times in workbook-content-seed.md — "BLUF" (0), "Give-Ask-Give" (0), "elevator pitch" (0), "signal audit" (0), "mock interview" (0).
  This violates the handoff brief's hard boundary ("Module content is transcribed faithfully from the workbook — never invented or paraphrased"). The workbook itself says nothing about live sessions, so this cannot be fixed by re-seeding — OSCAR MUST SUPPLY the real live-session titles, weeks, and descriptions (or confirm the intended source). Until then the E1.4 prompt only restyles them and adds week/status; it does not touch their text.

- What was attempted (specific): two Cursor prompts drafted and delivered.
  CURSOR-PROMPT-C1-p13-scorecard.md — seed-only; P13 exercise 3 → three entries (Role A scorecard, Role B scorecard, reflection) with P10's five Fit Table metrics transcribed verbatim; separate commit; re-seed REQUIRED.
  CURSOR-PROMPT-E1.4-landing-reskin.md — presentation only, explicitly states no /home route: dashboard completion bar replacing the bare %, hero-style welcome with institution chip, v2 stat cards (gold reserved for XP/rank), calmer momentum-framed pace banner, timeline/Continue Learning in v2 language; live sessions get Week chips + upcoming/available/past status (display-only, no gating) and interleave into the timeline, plus a reskin of the live-session detail/join page (still pure pre-lift); Program tab → "Curriculum" (page + sidebar + mobile nav), S4 fixed by sorting on parsed P-number instead of unlock_week, and an overview layout with derived one-liners + status chips. Hard constraints repeated: no auth/role/gate-flag/data-model changes, stop-and-flag rule.

- Files changed: BUILD-LOG.md only. Build/deploy/re-seed: none this entry.

- Open questions / things needing Oscar's input:
  1. LIVE SESSION CONTENT: supply real titles/weeks/descriptions (or point me at the source). Blocking a proper fix; restyle proceeds regardless.
  2. Confirm "Curriculum" as the Program-tab name (or pick another).

- Next step (the single concrete next action):
  Oscar runs the two prompts in Cursor as SEPARATE commits — C1 (then `npx tsx --env-file=.env.local scripts/seed-workbook-content.ts`) and E1.4 — pushes both, then I browser-verify: P13 two scorecards /25 + reflection saving; dashboard completion bar + reskin; live sessions week/status + timeline placement + reskinned join page; Curriculum tab renamed with P10–P14 in order.

---

=== LOG UPDATED: 2026-08-16 20:52 (America/Detroit) — REAL LIVE-SESSION SOURCE FOUND IN NOTION. C2 prompt drafted. "Curriculum" confirmed. MAJOR DISCREPANCY FOUND: app module numbering ≠ final syllabus ===

- Context / why this was done:
  Oscar confirmed "Curriculum" as the tab name and located the authoritative source: the Notion workspace (Corporate Academy Workspace → Product Development). Cowork HAS Notion access and pulled it directly.

- SOURCE OF TRUTH RETRIEVED (Notion, verified 2026-08-16):
  · "Syllabus w/ Videos and Workbook" (id 2bba01c5-6cc2-80d3-9154-d4ccd6648cf4, dated 2025-12-24) — CORPORATE ACADEMY PREP — 12-WEEK PROGRAM (FINAL).
  · "Video Table of Contents" (id 2c8a01c5-6cc2-8087-a0f3-d64a73b4dc2b).
  NOTE: the syllabus page also contains a SECOND, different product — "CORPORATE ACADEMY GRAD" (12 weeks, 6 live sessions, modules G1–G15). That is NOT this app's curriculum; do not conflate. Only the PREP half applies.

- LIVE SESSIONS — authoritative structure (FIVE, on even weeks; app currently has FOUR on weeks 4/6/8/10 with invented titles):
  LS1 Week 2 — Identity Q&A + Purpose Coaching
  LS2 Week 4 — Resume + LinkedIn Workshop
  LS3 Week 6 — Communication Lab
  LS4 Week 8 — Warm Networking Lab
  LS5 Week 10 — Recruiting Strategy Hot Seat
  So the app is wrong on COUNT (4 vs 5), WEEKS (all shifted), and TITLES (all invented). Prep-video pages W2.1/W4.1/W6.1/W8.1/W10.1 state what students bring to each session; descriptions in the C2 prompt are derived from those, not invented.

- What was attempted (specific): drafted CURSOR-PROMPT-C2-live-sessions.md — rewrites content/live-sessions.ts to the five real sessions (codes, weeks, titles, slugs, derived descriptions), requires seeding by module_code so LS1–LS4 update in place and LS5 is created without duplicates, forbids editing the historical migration, and asks Cursor to state whether live sessions are seeded via script or migration (currently ambiguous: they exist in BOTH content/live-sessions.ts and migration 20240526200000). Separate commit; seeding step required.

- ⚠ MAJOR DISCREPANCY FOUND (flagged, NOT acted on — needs Oscar's decision):
  The final Notion syllabus does NOT match the app's module numbering or set:
  · Notion Week 9 = P10 Opportunity Strategy & Fit + **P15 Hidden Job Market Strategy**
  · Notion Week 11 = **P14 Opportunity Mapping & Direction Setting**
  · Notion Week 12 = **P11 Internship Momentum** + **Master Module (P12 + P13 COMBINED)**
  · App/workbook-content-seed.md = 14 modules P1–P14 where P13 = Opportunity Mapping (wk11) and P14 = Hidden Job Market (wk9), P12 = First 90-Day (wk12), P11 = Internship Momentum (wk11).
  So Notion's P14/P15 ↔ the app's P13/P14, and Notion merges P12+P13 into one "Master Module" — implying a different module COUNT than the 14 we seeded. The Notion TOC is itself mid-renumbering (a heading reads "P15 — Hidden Job Market Strategy" while the page it links is titled "Video P14.1 — The Hidden Job Market"), so Notion is not internally consistent either.
  IMPLICATION: workbook-content-seed.md (our seeding source of truth, faithfully transcribed at Pass 1) may be based on an OLDER numbering than the final syllabus. This affects module codes, unlock weeks, and the /program ordering work. Do NOT let this block E1.4/C1/C2 — but it must be reconciled before real students onboard, or the app will teach a different sequence than the syllabus Oscar sells.
  Also relevant: module unlock weeks in the app put modules on weeks 1,1,2,3,3,5,5,7,7,9,11,12,11,9 — the final syllabus puts modules on ODD weeks (1,3,5,7,9,11) with live sessions on EVEN weeks (2,4,6,8,10) and week 12 as capstone/certification. The app's week mapping does not follow that rhythm.

- Files changed: BUILD-LOG.md only. Build/deploy/seed: none this entry.

- Open questions / things needing Oscar's input:
  1. MODULE NUMBERING RECONCILIATION: is the Notion final syllabus (P14/P15, Master Module P12+P13) the current truth, or is the app's P1–P14 set correct and Notion stale? This determines whether a re-numbering/re-seed pass is needed before launch.
  2. Should module unlock weeks be re-mapped to the syllabus rhythm (modules on odd weeks, live sessions even, week 12 capstone)?

- Next step (the single concrete next action):
  Oscar runs THREE separate Cursor commits: C1 (P13 exercise fix + re-seed), C2 (live sessions + seed), E1.4 (landing/live-session/Curriculum reskin). Then I browser-verify all three. Module-numbering reconciliation (Q1/Q2) gets scoped as its own content pass afterward.

---

=== LOG UPDATED: 2026-08-16 21:34 (America/Detroit) — C2 SHIPPED & VERIFIED (536540a + 70dcbd9): five real live sessions live in Supabase. Workbook-content integrity confirmed after a seed round-trip scare ===

- Context / why this was done:
  Oscar ran the C2 prompt; Cursor shipped it and seeded Supabase. This entry verifies it and records a seeding hazard Cursor discovered.

- Commits: 536540a "fix: replace placeholder live sessions with real syllabus sessions" · 70dcbd9 "chore: add live-sessions-only seed script".
- Files changed (per Cursor): content/live-sessions.ts (5 real sessions), lib/program-completion.ts (LIVE_SESSION_COUNT 4→5), components/program/program-completion-celebration.tsx (copy 4→5), scripts/generate-seed-sql.ts (comment), NEW scripts/seed-live-sessions.ts (live-only upsert by module_code), package.json (`seed:live`). Historical migration NOT edited, as instructed.

- SEEDING HAZARD DISCOVERED AND HANDLED (important for future passes — record this):
  `npm run seed:content` rewrites ALL 14 modules from the Phase-3 `content/*.ts` files — i.e. running it would REPLACE the faithful Pass 1 workbook bodies with the old AI-generated approximations. Cursor ran it once, recognised the risk, then created `scripts/seed-live-sessions.ts` (`npm run seed:live`) for live-session-only upserts and re-ran `npm run seed:workbook` to restore the workbook bodies.
  SEEDING MAP (now unambiguous — three distinct scripts, do not confuse them):
  · `seed:workbook` (scripts/seed-workbook-content.ts) → the 14 workbook modules from workbook-content-seed.md; skips live sessions (is_live_session=false). THE source of truth for module bodies.
  · `seed:live` (scripts/seed-live-sessions.ts) → live sessions only, upsert by module_code from content/live-sessions.ts. NEW.
  · `seed:content` → rewrites all 14 modules from Phase-3 content/ files. ⚠ DESTRUCTIVE to Pass 1 content — avoid; if ever run, immediately re-run `seed:workbook`.

- Verification performed (live, as student@test.com, post-deploy):
  1. Dashboard live-sessions list shows FIVE sessions with the real syllabus titles: LS1 Identity Q&A + Purpose Coaching, LS2 Resume + LinkedIn Workshop, LS3 Communication Lab, LS4 Warm Networking Lab, LS5 Recruiting Strategy Hot Seat. No stale invented titles remain. PASS ✓
  2. WORKBOOK INTEGRITY AFTER THE seed:content ROUND-TRIP — checked rather than assumed, since a failed restore would have silently reverted Pass 1:
     · P1 rendered payload contains the real workbook bodies (Identity Gap concept_block text verbatim, Student-Mode Detector, Identity Flywheel, the full anchors list incl. "Connector of people and information"). Phase-3 marker strings absent ("Why Stack" false, "signal audit" false). PASS ✓
     · P11 intact: 10-Week Audition timeline present incl. Week 10, six qualities render as exactly 6 rows, Maya's story card present. PASS ✓
     Conclusion: the restore worked; no content regression.
  3. Note observed (not a defect): P1's stored video_url is a real YouTube id, but SHOW_PLACEHOLDER_VIDEO_STRIP=true so the slim "coming soon" strip still renders — expected behaviour.

- Decisions made: none new. C2 closed.

- Open questions / things needing Oscar's input (unchanged, still open):
  1. Module-numbering reconciliation: Notion final syllabus (P14/P15 + Master Module P12+P13) vs the app's P1–P14.
  2. Whether to re-map module unlock weeks to the syllabus rhythm (modules odd weeks, live sessions even, week 12 capstone). NOTE: now partly visible — live sessions sit on weeks 2/4/6/8/10 while modules still use the old week mapping, so the two rhythms don't yet line up on the timeline.

- Next step (the single concrete next action):
  Oscar runs the remaining two prompts as separate commits — C1 (P13 exercise fix, then `npx tsx --env-file=.env.local scripts/seed-workbook-content.ts`) and E1.4 (landing/live-session/Curriculum reskin) — then I browser-verify both.

---

=== LOG UPDATED: 2026-08-16 21:58 (America/Detroit) — C3 scoped: live sessions become non-blocking timeline milestones. Analysis showed this is a SMALL change, not a rebuild. Found a certification gate that contradicted the decision ===

- Context / why this was done:
  Oscar asked whether seeding live sessions "directly into the curriculum" (each on its own even week, creating weeks where none exist) was worth the coding load, noting Notion already has the content so nothing new needs authoring.

- ANALYSIS — the load is small; the structure already exists:
  1. Live sessions are ALREADY rows in the `modules` table with `unlock_week` 2/4/6/8/10 and a pillar, flagged `is_live_session: true`. The "weeks" exist in data — `lib/program.ts` simply filters them out of the feed (`!is_live_session` in several places). Showing them is removing a display filter, not building a system. No new data model, no new content.
  2. Module weeks ALREADY match the Notion syllabus almost exactly. Full comparison of all 14: P1,P2 wk1 ✓ · P4,P5 wk3 ✓ · P6,P7 wk5 ✓ · P8,P9 wk7 ✓ · P10,P14 wk9 ✓ · P13 wk11 ✓ · P12 wk12 ✓ — only TWO are wrong: **P3 is on week 2** (colliding with LS1, syllabus says week 1) and **P11 is on week 11** (syllabus says week 12). Fixing those two values yields the syllabus rhythm automatically: modules on odd weeks, live sessions alone on even weeks, week 12 capstone.
  3. Bonus: the Notion "P14/P15" vs app "P13/P14" numbering difference is a LABEL-ONLY mismatch — weeks and content align. So the renumbering question (open item from 20:52) is cosmetic and can wait indefinitely; it does NOT block launch. Downgrading its priority accordingly.

- DECISION (Oscar): live sessions are **NON-BLOCKING**. "Involvement will not be driven by CA, that will be a responsibility of the organization and data will be reported to them of who attended." So: attendance is captured and reported to the institution, but never gates advancement or certification.

- ⚠ CONFLICT FOUND WITH THAT DECISION (would have shipped silently):
  `lib/program-completion.ts` → `checkProgramCompletion()` currently requires `liveComplete` — EVERY live session marked complete — plus a `LIVE_SESSION_COUNT` check, before setting `program_completed_at` and issuing the certificate. Under the non-blocking rule this is wrong twice over: it makes CA enforce attendance it just said it won't own, and a student who misses a single live session could NEVER be certified. C3 removes live sessions from the certification gate (completion requires the 14 content modules only).

- What was attempted (specific): drafted CURSOR-PROMPT-C3-live-sessions-in-timeline.md — (1) two seed week edits (P3 2→1, P11 11→12, nothing else touched); (2) `lib/program.ts` split so progress/pace/unlock math KEEPS excluding live sessions while the visual timeline INCLUDES them, with live-session-only weeks rendering as their own weeks; (3) certification gate fixed per above; (4) existing attendance capture left intact, with an instruction to FLAG (not build) whether attendance reaches the institutional export at app/api/admin/[institution-id]/export. Re-seed required (seed:workbook only — explicit warning not to run seed:content).

- Files changed: BUILD-LOG.md only. Build/deploy/seed: none this entry.

- Open questions / things needing Oscar's input:
  1. (Downgraded) Module renumbering to Notion's P14/P15 + Master Module labels — cosmetic only, weeks/content already align. Not launch-blocking.
  2. Whether attendance should flow into the institutional export (Cursor will report if it currently doesn't) — likely needed since attendance data is promised to institutions.

- Next step (the single concrete next action):
  Oscar runs THREE separate Cursor commits in this order: C3 (timeline + weeks + certification gate, then re-seed with seed:workbook), C1 (P13 exercise fix, then re-seed), E1.4 (reskin). Then I browser-verify all three: P3 in Week 1, weeks 2/4/6/8/10 as live-session weeks, certificate not blocked by live sessions, P13 two scorecards /25 + reflection, dashboard completion bar + Curriculum tab with P10–P14 ordered.

---

=== LOG UPDATED: 2026-08-16 22:14 (America/Detroit) — C3 SHIPPED & VERIFIED (0c1654d): live sessions are timeline milestones, weeks aligned to syllabus, certification un-gated. One minor ordering bug found ===

- Commit: 0c1654d. Files (per Cursor, 11): workbook-content-seed.md; content/pillar-1.ts + content/pillar-3.ts (kept in sync with the two week changes); lib/workbook-seed-parser.ts; scripts/seed-workbook-content.ts (now also writes unlock_week from the seed file — good catch, previously weeks were not re-seeded); lib/program.ts; lib/program-completion.ts; lib/modules-queries.ts; components/dashboard/program-feed.tsx; components/dashboard/continue-learning.tsx; app/(protected)/dashboard/page.tsx; components/program/program-completion-celebration.tsx. Supabase re-seeded.

- Verification performed (live, as student@test.com):
  1. P3 → Week 1 CONFIRMED (sidebar "P3 · Wk 1"; timeline Week 1 contains P1, P2, P3). PASS ✓
  2. P11 → Week 12 CONFIRMED (sidebar "P11 · Wk 12" alongside P12 · Wk 12). PASS ✓
  3. Week 2 renders as a LIVE-SESSION-ONLY WEEK in the timeline: "LIVE SESSION · WEEK 2 / LS1 · Identity Q&A + Purpose Coaching / Join session →" with a distinct broadcast icon and card treatment. This is exactly the requested behaviour — a week that exists only because a live session occupies it. PASS ✓
  4. Side "Live sessions" card removed from the dashboard. PASS ✓
  5. Progress remains content-only: "0 of 14 modules". Live sessions do not inflate or affect the count. PASS ✓
  6. Cursor added explanatory copy to the program card — "Live sessions appear as milestones and do not block completion." Unprompted and correct; keeps the non-blocking rule legible to students. PASS ✓
  7. Certification gate: code-verified in the diff (liveComplete + LIVE_SESSION_COUNT removed from the completion condition); cannot be exercised end-to-end without completing all 14 modules on the test account. Accepted as verified-by-diff.

- MINOR BUG FOUND (cosmetic, not blocking): within-week ordering in the timeline. Week 1 renders P1, **P3**, **P2** — P3 before P2 — because the feed sorts within a week by order_index (or insertion) rather than by P-number. Introduced by moving P3 into week 1. Same family as S4. RECOMMENDATION: fold the ascending-P-number sort that E1.4 already applies to the Curriculum page into the timeline's within-week ordering too. Added to the E1.4 scope rather than a separate commit.

- ATTENDANCE GAP CONFIRMED (Cursor reported, as asked): the institutional export CSV (app/api/admin/[institution-id]/export) contains name/email/completion/xp/rank/quiz/login/flag — live-session attendance is NOT included. Capture still works on the join page, but the data Oscar has promised institutions ("data will be reported to them of who attended") does not currently reach them. NOT built (out of scope for E1/restyle). Now a tracked pre-cohort item: attendance must reach institutional reporting before a real cohort runs, since attendance is the institution's responsibility to drive.

- Decisions made: none new. C3 closed.

- Open questions / things needing Oscar's input:
  1. Attendance → institutional export: schedule this as its own small pass before the first cohort? (Recommend yes; it's a promise to the buyer, not a nice-to-have.)
  2. (Still open, downgraded) Module renumbering to Notion labels — cosmetic only.

- Next step (the single concrete next action):
  Oscar runs C1 (P13 exercise fix → re-seed with seed:workbook), then E1.4 (reskin, now also including the timeline within-week P-number sort). I verify both.

---

=== LOG UPDATED: 2026-08-16 22:36 (America/Detroit) — E1.4 SHIPPED & VERIFIED (c4099bf). S4 CLOSED after being open since the first session. Only C1 remains outstanding ===

- Commit: c4099bf "feat: extend Campus Indigo lift to dashboard, live sessions, and Curriculum".

- PROCESS NOTE (my error, recorded so it isn't repeated): I checked the repo immediately after Oscar's push and reported that E1.4 "isn't in the repo" — the sandbox mount was serving a stale snapshot (app-sidebar.tsx showed a June mtime, no "Curriculum" string). Oscar's `git log` showed c4099bf present on main and origin. Re-reading the same files seconds later showed the changes correctly. LESSON: the /sessions mount can lag a fresh push; if a just-pushed change appears missing, re-read before concluding anything, and prefer the live site + Oscar's git output as ground truth. I sent Oscar to the terminal unnecessarily.

- Verification performed (live, as student@test.com, commit c4099bf):
  DASHBOARD:
  1. Progress % REPLACED by a completion bar — "Program progress · 0 of 14 modules complete" with a full-width track under the greeting. Bare percentage gone. PASS ✓
  2. Welcome header restyled as a hero: institution chip ("DEMO UNIVERSITY") above the student name in serif display. The "university grounds" cue Oscar wanted. PASS ✓
  3. Stat cards (Total XP / Streak / Rank) restyled in v2 language with gold reserved for achievement values. PASS ✓
  4. Pace banner reframed from the alarming amber "Behind pace" block to a calm card: "Week 1 of 8 · pick up where you left off". PASS ✓
  5. Timeline within-week ordering FIXED — Week 1 now reads P1, P2, P3 (was P1, P3, P2). PASS ✓
  6. LS1 card in Week 2 now shows status: "Upcoming · Join →" with the LS1 chip and Live session label. PASS ✓
  CURRICULUM TAB:
  7. Renamed everywhere — page heading "Curriculum", sidebar and mobile nav labels. Route still /program. PASS ✓
  8. **S4 FIXED**: Pillar 3 now lists P10, P11, P12, P13, P14 in ascending order (was P10, P14, P11, P13, P12). This standing item has been open since the original handoff brief. CLOSED ✓
  9. Overview layout live: pillar eyebrow + weeks range ("PILLAR 1 · WEEKS 1–4"), a pillar description, and module cards with P-number chips, status chips (IN PROGRESS / NOT STARTED), and one-line descriptions derived from each module's stored overview text — no invented copy. PASS ✓

- Decisions made: E1.4 closed. S4 removed from standing items.

- Open questions / things needing Oscar's input: none blocking.

- Next step (the single concrete next action):
  C1 remains the only unrun prompt (P13 exercise fix → then `npx tsx --env-file=.env.local scripts/seed-workbook-content.ts`). In parallel, Oscar approved drafting the attendance-reporting pass (live-session attendance → institutional export), which is now the next scoped work after C1.

---

=== LOG UPDATED: 2026-08-16 22:52 (America/Detroit) — Oscar's E1.4 review: reskin the SHELL and the PROFILE. R1 (attendance) + E1.5 (shell/profile) drafted as separate prompts ===

- Context / why this was done:
  Oscar reviewed E1.4 live. Verdict: "so far, looking pretty good… the reskin made it to the content pretty well." Three follow-ups:
  1. VISUAL BUG: "the confidence in P3 on the your program tile, the text breaks the space of its own block… looks kinda sloppy" — module titles overflow their timeline cards.
  2. THE SHELL IS STILL OLD: "it looks like a fancy slideshow between the covers of an old dusty book. Like, we gotta update the bindings of this piece." I.e. the content is lifted but the sidebar/header/nav chrome around it is still the original build.
  3. Extend the reskin to the PROFILE page.
  He suggested folding this into the R1 attendance prompt.

- DECISION (mine, with reasoning given to Oscar): keep them SEPARATE. R1 is admin/reporting plumbing (export + admin table); E1.5 is the student-facing shell. Merging them would produce one commit that can't be partially rolled back and would muddy verification. Oscar's phrasing was "maybe," not insistent; recommendation stands unless he overrides.

- ROOT CAUSE identified for the overflow bug (grounded in code, not guessed): components/dashboard/program-feed.tsx ~line 143 renders the title as a single `<p>` containing an inline rounded chip span (`px-2 py-0.5`) followed by `<span className="ml-2">{mod.title}</span>`. Inline chip + text inside a narrow flex column wraps badly and spills past the card edge. Fix specified structurally (flex row: non-shrinking chip + `min-w-0` wrapping title, or chip on its own line), plus an instruction to audit the same pattern on Continue Learning, Curriculum module cards, live-session cards, and profile entries.

- What was attempted (specific): two prompts drafted and delivered.
  · CURSOR-PROMPT-R1-attendance-reporting.md — live-session attendance into the institutional export (one column per session sourced from live-session rows by unlock_week, not hardcoded, plus an "N of 5" count) and an attendance indicator on the admin students view. Explicit scope guard that attendance must NOT gate progression or certification (protecting the 0c1654d decision). Critically, it requires Cursor to CONFIRM where attendance is actually persisted first and STOP if it isn't durable, rather than inventing a table; any migration must be written but NOT applied.
  · CURSOR-PROMPT-E1.5-shell-profile-reskin.md — (1) fix the overflow bug + audit sibling surfaces; (2) reskin the shell: sidebar nav rows with real hover/active states, clearer pillar-vs-module hierarchy in the tree, per-module status affordance, restyled top header (brand, role badge, notifications, sign out) and mobile nav; (3) reskin the profile + public profile in Campus Indigo — identity hero, restyled form inputs, clearer pillar→module→exercise grouping so each answer's SOURCE is obvious (also closes the standing "hard to tell where answers come from" item from the priorities doc), restyled visibility badges/toggle, stat cards matching the dashboard. Behavior explicitly frozen: saves, toggles, avatar upload, RLS/query filtering unchanged.

- Files changed: BUILD-LOG.md only. Build/deploy/seed: none this entry.

- Open questions / things needing Oscar's input: none blocking — three prompts now queued.

- Next step (the single concrete next action):
  Run order recommended: C1 (P13 exercise → re-seed) → E1.5 (shell + profile + overflow, the most visible improvement) → R1 (attendance reporting). Separate commits; I verify each.

---

=== LOG UPDATED: 2026-08-16 23:00 (America/Detroit) — C1 (29363ac), E1.5 (d37c1d2), R1 (fa49aca) ALL SHIPPED. Student-side verification PASS with 2 new cosmetic bugs. Admin items pending admin login ===

- Commits: 29363ac "fix: correct P13 opportunity comparison exercise structure" · d37c1d2 "feat: reskin app shell and profile; fix timeline title overflow" · fa49aca "feat: report live-session attendance in institutional export and admin roster".

- R1 STORAGE FINDING (Cursor confirmed as instructed, no invention): attendance was ALREADY persisted — `student_progress` rows keyed by student_id + live-session module_id (modules.is_live_session = true); `markLiveSessionAttended` sets is_complete/completed_at/xp_earned/video_watched. No new table, NO MIGRATION needed. New file components/admin/live-attendance-indicator.tsx.

- Verification performed (live, as student@test.com):
  C1 — P13:
  1. Exercise chips read "Exercise 1 of 5" … "5 of 5" — the split landed. PASS ✓
  2. Two scorecards: "Opportunity Comparison — Role A" and "— Role B", each with the five P10 Fit Table criteria (Manager Quality, Skill Development, Learning Velocity, Environment/Team Culture, Brand/Career Trajectory = 10 criteria rows total) and **Total: 0 / 25** each. The /15 three-row version is gone. PASS ✓
  3. "Your Direction Decision" reflection present. PASS ✓
  4. SAVE WORKS: set Role A Manager Quality = 4 → "Saved ✓" chip + "Total: 4 / 25". PASS ✓
  E1.5 — shell:
  5. THE "OLD DUSTY BOOK" BINDING IS GONE. Sidebar is now light with a bold indigo active row, per-module status dots, and a real hierarchy (PILLAR n eyebrow + pillar name, then module rows with "P4 · WEEK 3" metadata above the title). Top header restyled to match. Profile moved to the bottom of the nav with the Curriculum tree hanging off Curriculum (Cursor's call — correct, the tree belongs to Curriculum not Profile). PASS ✓
  6. Timeline title overflow FIXED — titles now wrap inside their cards (P-chip on its own line). PASS ✓
  E1.5 — profile:
  7. Living workbook reskinned: every answer card now carries a P-number chip + module name (e.g. "P1 · Student → Pre-Professional Identity Shift") above the exercise title, grouped under pillar/module headers. THIS CLOSES the standing "hard to tell where answers come from" item from CA-LMS-priorities-post-pass3.md Theme 5 #13. PASS ✓
  8. Visibility badges restyled (indigo PUBLIC / muted PRIVATE) and the toggle still works: clicked "Make public" on the P2 brain dump → counts moved 3 public → 4. Behavior unchanged. PASS ✓
  9. Before→after pairs, fill_blank sentence rendering, and timestamps all intact on the profile. PASS ✓

- 2 NEW COSMETIC BUGS FOUND (minor, not blocking; candidates for a small E1.6 polish):
  N3. MID-WORD BREAK: timeline card titles break inside words — "Student → Pre-Professiona / l Identity Shift". Verified at both 960px and 1512px window widths, so it is NOT viewport-specific: the overflow fix appears to use `break-all` (or equivalent) rather than `break-words`/`overflow-wrap: anywhere`. Should break at word boundaries only.
  N4. NARROW TIMELINE COLUMNS: the week columns render as fixed narrow cards (~160px) that do not expand to fill the available content width, so titles wrap to 4+ lines even on a wide screen while the right side of the panel sits empty. Week columns should flex to fill.

- NOT YET VERIFIED (needs an institution-admin or super-admin session; my session is the test student):
  · R1 item 4 — export CSV contains LS1–LS5 columns + "Live sessions attended" count in week order with real data.
  · R1 item 5 — admin roster shows "N of 5"; a student with 0 attendance still shows full module completion.

- Decisions made: N3/N4 logged as polish, not treated as E1.5 failures — the substantive asks (shell, profile, overflow containment) all landed.

- Open questions / things needing Oscar's input:
  1. Admin verification: log in as super admin (oscarg@corpacad.com) so I can verify the export CSV + roster, or confirm yourself.
  2. Fold N3/N4 into a small E1.6 polish pass?

- Next step (the single concrete next action):
  Oscar provides an admin session (or self-verifies) for R1 items 4–5; I draft E1.6 (mid-word break + timeline column width) if approved. Remaining pre-cohort items unchanged: Supabase paid plan, service_role key roll, quiz content review.

---

=== LOG UPDATED: 2026-08-17 19:07 (America/Detroit) — CONTENT PROVENANCE AUDIT COMPLETE. Two further bodies of invented content found (56 quizzes; the onboarding diagnostic). E1.6 drafted. NO fixes applied — awaiting Oscar's decisions ===

- Context / why this was done:
  New pass brief: content integrity chunk. Rationale accepted — two rounds of invented Phase-3 content have already been caught (module bodies at Pass 1, the four fake live sessions at C2), so the base rate of lurking fake content is not zero. Audit first, fix after Oscar decides.

- METHOD: inventoried every surface that renders text to a student, then traced each to the workbook (workbook-content-seed.md) and Notion. Applied the "BLUF test" — distinctive named terms with ZERO occurrences in either source. Quizzes audited programmatically across all 14 modules (56 questions parsed and option counts measured), not sampled.

- FULL REPORT delivered as CONTENT-PROVENANCE-AUDIT.md. Findings:

  ✅ CLEAN (3 surfaces):
  · Module bodies + exercises (14 modules) — real workbook content; distinctive framework names (Identity Gap, Student-Mode Detector, Identity Flywheel, Fit Table, 10-Week Audition, Maya) all trace. Re-verified intact after the C2 seed round-trip.
  · Live sessions (5) — real since C2, from the Notion syllabus.
  · Curriculum/dashboard descriptions — generated at render time from stored workbook overviews; inherit real provenance, invent nothing.

  🔴 FINDING 1 — ALL 56 QUIZ QUESTIONS ARE INVENTED. No quiz source exists anywhere: the workbook uses **Completion Checks**, not quizzes, and a Notion search returns module pages whose assessment element is likewise a Completion Check. The handoff brief flagged this in Section 5 and it was never resolved. So 56 questions + their options + their correct-answer keys are all Claude's invention, currently shipped as graded assessment that awards XP ("Perfect quiz bonus") and gates the "Continue to quiz" flow. Students are marked wrong against an invented key. This is the highest-exposure content item in the product.
    · Sub-finding 1a — 15 of the 56 also have OPTION SPRAWL, quantified: P2Q4=10, P3Q4=12, P4Q2=16, P5Q1=7, P5Q2=16, P6Q2=12, P8Q2=6, P8Q4=6, P9Q2=12, P10Q2=20, P11Q2=24, P11Q3=6, P12Q4=16, P13Q2=12, P13Q4=12, P14Q4=5. Root cause is AUTHORING as much as parsing: each intended option is itself a comma-list (e.g. "[Manager, skills, velocity, Salary, brand name, location, …]"), so the comma delimiter is ambiguous. Fix requires either changing the option delimiter in the seed format + parser, or re-authoring the 15 questions so no option contains a comma. NOTE: fixing sprawl is moot if the quizzes are removed (see decision below).

  🔴 FINDING 2 — THE ONBOARDING DIAGNOSTIC IS INVENTED, AND THE REAL INSTRUMENT ISN'T IN THE PRODUCT. lib/onboarding-content.ts ships 7 generic self-assessment questions that gate Week 1, are stored once, and are never used again — no scoring, no domains, no post-measure. Nothing in the workbook or Notion matches ("diagnostic", "self-assessment", "intake" = 0 hits in the workbook).
    What actually exists (Notion: "CAPRI System — How to Use", "Service Model & Delivery Method", "Accountability Method"): **CAPRI — Corporate Academy Professional Readiness Index**, a pre/post assessment across five domains (Professional Identity · Judgment & Decision-Making · Communication & Executive Presence · Social Capital & Relationship Management · Execution & Reliability), run Week 1 (baseline) and Week 12 (post), currently a Google Form paired by CA ID. Notion describes it as "the program's primary measurement instrument and the source of every outcome claim made to institutions" — it feeds cohort domain-improvement analysis, the participation metric, and institutional sales case studies.
    So the product's only assessment-shaped feature is fake, while the instrument generating the outcome claims sold to institutions lives entirely outside the product.
    · Sub-finding 2a — TAXONOMY MISMATCH: CAPRI measures FIVE domains; the product is built on THREE pillars. Different taxonomies. The mapping needs a deliberate answer before institutional reporting is built.
    · BLOCKER: the Notion CAPRI page carries its own caveat that the live Google Form questions were unreadable when it was drafted. Cowork could not read the form either. Oscar must supply it before any CAPRI work.

  🟡 FINDING 3 — ONBOARDING WALKTHROUGH COPY unsourced and now factually stale: names the pillars as "Identity & Brand, Communication & Relationships, Opportunity Strategy" (not the product's actual pillar names) and tells students to "complete videos… to earn XP" when videos are placeholders and the video gate is off. First screen a new student reads; cheap to fix once 1 and 2 settle.

  ☠ FINDING 4 — THE PHASE-3 INVENTED CONTENT IS STILL IN THE REPO AND ONE COMMAND FROM PRODUCTION. content/pillar-1.ts (708 lines) + pillar-2.ts (565) + pillar-3.ts (706) = ~1,979 lines of the original AI approximations Pass 1 replaced. They are the source for `npm run seed:content`, which overwrites all 14 modules. This nearly fired during C2 (seed:content was run; Pass 1 content survived only because it was caught and seed:workbook re-run). Worse, C3 deliberately kept pillar-1.ts and pillar-3.ts IN SYNC with the two week changes — the codebase is currently maintaining a known-invented content set as a parallel source of truth. RECOMMENDATION: delete content/pillar-*.ts and the seed:content script, or rename it unmistakably (seed:DANGER-phase3-legacy) with a confirmation prompt.

- What was also drafted: CURSOR-PROMPT-E1.6-polish.md — replace the aggressive break (`break-all`) introduced in E1.5 with word-boundary wrapping (`break-words` + min-w-0) everywhere it was applied, and make timeline week columns flex/grid to fill the panel width. Small, presentation-only.

- Files changed: BUILD-LOG.md only. No code, no seed, no deploy this session — per the brief, the audit reports and Oscar decides before large replacements.

- Open questions / things needing Oscar's input (DECISIONS, numbered):
  1. QUIZZES — (a) remove them until real ones exist (Completion Check is the workbook's actual assessment and already ships; drops the Perfect-quiz XP bonus), (b) Oscar authors real questions, or (c) keep and fix only the sprawl while knowingly accepting invented content attributed to CA. Sprawl work only matters under (b) or (c). NO RECOMMENDATION IMPOSED — this is a product-honesty call that is Oscar's alone.
  2. CAPRI — supply the live Google Form so the real instrument can be represented in-product (even a Week 1/Week 12 link + completion tracking is low-build and directly supports the institutional reporting promise). And decide the 5-domain ↔ 3-pillar mapping.
  3. PHASE-3 FILES — approve deletion/neutralisation of content/pillar-*.ts + seed:content?
  4. R1 items 4–5 still unverified — need an admin session.
  5. Module renumbering (Notion P14/P15 + Master Module) — still recommended DEFER until Notion settles.

- Next step (the single concrete next action):
  Oscar reviews CONTENT-PROVENANCE-AUDIT.md and answers decisions 1–3. E1.6 can run independently at any time (no dependencies). Pre-cohort blockers unchanged: Supabase paid plan, service_role key roll — plus quiz resolution is now arguably a fourth.

---

=== LOG UPDATED: 2026-08-17 19:37 (America/Detroit) — E1.6 SHIPPED & VERIFIED at three widths. E1 VISUAL WORK NOW FULLY COMPLETE. Content decisions remain the only open work ===

- Context: Oscar ran E1.6 and pushed. Cursor's approach: a shared `.lift-text-wrap` utility in globals.css (overflow-wrap: break-word; word-break: normal; min-width: 0) replacing every E1.5 `break-words` on card titles, plus a responsive week grid (1 col mobile / 2 cols md / 3 cols xl) with w-full min-w-0 so cards stretch. 8 files: globals.css, program-feed.tsx, continue-learning.tsx, program/page.tsx, program-nav-tree.tsx, living-workbook-section.tsx, profile-identity-header.tsx, profile-editor.tsx.
  Cursor's diagnosis of the root cause was also correct and worth recording: the mid-word breaks came from ~160px text columns (sidebar + a 3-up grid at ~960px), i.e. the aggressive break was compensating for columns that were too narrow — fixing the layout removed the need for it.

- Verification performed (live, as student@test.com, THREE viewport widths):
  1. ~960px: week columns render 2-up and fill the panel; "Student → Pre-Professional Identity Shift" breaks at the hyphen/word boundary (correct) with NO mid-word split; module descriptions now show two readable lines; the "Live session" chip renders inline and legible beside the LS1 code and week. PASS ✓
  2. 480px (mobile): single column, full title on one line, cards full-width, reskinned bottom nav with indigo active state. PASS ✓
  3. 1512px: restored; layout fills evenly. PASS ✓
  No mid-word breaks observed at any tested width. No behavior changes.

- Decisions made: E1.6 closed. **The E1 experience lift is now COMPLETE end to end** — 14 module pages, dashboard, Curriculum, app shell (sidebar/header/mobile nav), profile + public profile, and now responsive polish. No visual work outstanding.

- Open questions / things needing Oscar's input (UNCHANGED — all content, none visual):
  1. QUIZZES: remove / author real ones / keep-and-fix-sprawl. (56 invented questions, 15 with option sprawl.)
  2. CAPRI: supply the live Google Form; decide the 5-domain ↔ 3-pillar mapping.
  3. PHASE-3 FILES: approve deleting content/pillar-*.ts + seed:content (the ☠ landmine).
  4. R1 items 4–5: needs an admin session to verify export CSV + roster.
  5. Module renumbering: still recommend DEFER.

- Next step (the single concrete next action):
  Oscar answers content decisions 1–3 from CONTENT-PROVENANCE-AUDIT.md. Nothing else is blocked — the build is visually finished and content-clean except for the invented quizzes and diagnostic. Pre-cohort blockers: Supabase paid plan, service_role key roll, quiz resolution.

---

=== LOG UPDATED: 2026-08-17 20:34 (America/Detroit) — QUIZZES CANONIZED INTO NOTION (15 pages created, add-only). SEVERE DEFECT FOUND: 9 questions mark WRONG answers correct in production. GATE A FAILED — renumbering STOPPED. Q1 + D1 prompts drafted ===

- Context: pass brief = quiz canonization → sprawl fix → Phase-3 cleanup → gated renumber. CAPRI explicitly out of scope (separate thread).

- STEP 1 — CANONIZATION COMPLETE (deliverable shipped, in Notion, add-only as instructed):
  · Created **"Canonical Quiz Bank — All 14 Prep Modules"** under Product Development (id 3c0a01c5-6cc2-8116-ae1f-cdbc64a2b1d9): status/decision note, full scoring behaviour, the defect explanation, and an index table of all 56 questions with options-rendered vs intended and a defect column.
  · Created a child page **"Quiz Questions (Canonical)"** inside EACH of the 14 existing module pages (P1–P14), each documenting every question, all four canonical options with ✅ CORRECT / ❌ Incorrect marking, the scoring consequence of a correct vs incorrect answer, and precisely what the app does today per question.
  · HARD BOUNDARY RESPECTED: no existing Notion page or content was edited. Only new child pages were added.

- ⚠️⚠️ SEVERE DEFECT DISCOVERED DURING CANONIZATION (this is the headline finding):
  Root cause verified in lib/workbook-seed-parser.ts → parseQuizLine(). Options are split on EVERY comma; the answer key is then matched against the fragments; and when nothing matches it **silently falls back to option index 0** (`correct_answer: correctOption?.id ?? "0"`).
  Result: 16 questions render mis-split, and **9 of them currently mark a WRONG ANSWER AS CORRECT in production** — several teaching the exact opposite of the module:
    · P3 Q4 → marks "Talent" correct (module: confidence does NOT come from talent)
    · P5 Q1 → marks "Talent" correct
    · P8 Q2 → marks "Professors and deans" correct (module is about near-peers)
    · P8 Q4 → marks "They talk the most" correct (module: introverts win by listening)
    · P10 Q2 → marks "Salary" correct (module's core argument is against optimizing for salary/prestige)
    · P11 Q3 → marks "To be perfect" correct (module explicitly: "your job isn't to be perfect")
    · P13 Q2 → marks "Manager" correct (manager quality is what the module says matters MOST)
    · P14 Q4 → marks "The role is filled" correct (the misconception the module corrects)
    · P4 Q1 → malformed key containing an author's note "(reverse: strong = ...)" that matches no option; resolves to option 0, correct only by luck.
  A student who understands the material is scored INCORRECT and loses the +25 XP perfect-quiz bonus. Every one of these is documented per-question in the Notion child pages.

- STEP 2 — Q1 PROMPT DRAFTED (CURSOR-PROMPT-Q1-quiz-options-and-answer-keys.md): change the seed's quiz option delimiter from comma to pipe (`|`) inside the brackets; parse the bracketed substring first then split on `|`; make the parser STRICT — exact match, then normalised match, and **throw naming the module/question if unmatched instead of defaulting to "0"** so a bad key fails loudly at seed time; re-author all 16 affected lines from the canonical Notion bank; fix P4 Q1's malformed key. Acceptance: 56 questions × exactly 4 options, zero fallbacks, with an assertion that fails the seed if violated.

- STEP 3 — D1 PROMPT DRAFTED (CURSOR-PROMPT-D1-deprecate-phase3.md): rename content/pillar-{1,2,3}.ts → DEPRECATED-DO-NOT-USE-*, add a warning header, remove `seed:content` from package.json and add a hard guard that refuses + exits 1 before touching the DB, and confirm no live code path imports them (STOP and report if any does). content/live-sessions.ts explicitly protected — it is real (C2).

- STEP 4 — ⚠️ **GATE A FAILED. RENUMBERING NOT EXECUTED.** Notion is NOT settled; three numbering schemes coexist:
  1. **Module content pages** (Pillar 1/2/3 Modules → the detailed, authoritative module pages): **P1–P14, with P13 = Opportunity Mapping and P14 = Hidden Job Market — IDENTICAL TO THE APP.**
  2. **"Curriculum & Pillars"** (2025-12-07): "MODULE P15 — Hidden Job Market Strategy".
  3. **Syllabus + Video TOC** (2025-12-22/24): P14 = Opportunity Mapping, P15 = Hidden Job Market, plus "Master Module (P12 + P13 Combined)".
  Additional evidence of flux: DUPLICATE module pages exist with different IDs and dates (two "MODULE P14 — HIDDEN JOB MARKET" pages, two P7s, two P10s), and the P12 content page is itself subtitled "(Combined P12 + P13 — Finalized Edition)" — i.e. the merge is already reflected in the content page while the app and the module list still show P12 and P13 separately.
  **CONCLUSION: renumbering now would be renumbering against a moving target, and the app ALREADY matches the most authoritative Notion source (the module content pages). Step 4a NOT executed. Step 4b (the P12+P13 merge) NOT planned — it is a structural content merge that would ripple into exercises, quizzes, progress tracking and the "N of 14" completion count, and it needs Oscar's explicit confirmation AND a settled Notion first.**

- Files changed in the repo: BUILD-LOG.md only. No code, no seed, no deploy this session (canonization was Notion-side; Q1/D1 await Oscar running them).

- Open questions / things needing Oscar's input:
  1. Run Q1 (quiz options + answer keys) — recommended NEXT and with priority, because it is a live correctness bug, not cosmetics.
  2. Run D1 (Phase-3 deprecation).
  3. Renumbering: settle Notion first (consolidate duplicate module pages and pick one scheme), then revisit. Recommend continuing to DEFER.
  4. HARD GATE STILL OPEN: R1 items 4–5 (export CSV + admin roster) need an admin session before the next pass.

- Next step (the single concrete next action):
  Oscar runs Q1 (then re-seed with seed:workbook) and D1 as separate commits; I verify both live. Then the R1 admin gate must be cleared before any further pass.

---

=== LOG UPDATED: 2026-08-22 04:16 (America/Detroit) — Two correction-working pages created in Notion per Oscar's request. Q1 prompt HELD until he finishes the line-by-line pass. Content itself verified sound ===

- Context / why this was done:
  Oscar's direction: before fixing anything in the app, produce (a) a Notion page detailing every question that fragments, has the wrong answer, or deviates from its module — listed with answers so he can correct line by line — and (b) a summary of the Gate A source inaccuracies so he can delete false sources or update pieces. He then supplies fix instructions, the master Bank is updated, and only then does the app get sourced from it. He also asked whether this makes for a better Q1 prompt — YES, and Q1 is now explicitly ON HOLD (see decisions).

- NEW VERIFICATION PERFORMED THIS SESSION (content accuracy, beyond the parse defects):
  1. DEVIATION CHECK — for all 56 questions, tested whether the intended correct answer's key terms actually appear in that module's own body text. Result: **0 of 56 weakly grounded.** Every intended answer echoes its module.
  2. FACTUAL SPOT-CHECK of the claim-bearing questions, each traced to the source line: P6 Q4 "tone is 80% of your impression" ✓ · P14 Q1 "up to 70% of early-career roles are filled quietly" ✓ · P4 Q4 "GPA (if above 3.3)" ✓ · P9 Q4 "tier 3 quarterly" ✓ · P13 Q1 "3 out of 5 = a realistic early-career win" ✓ · P12 Q3 Ownership Ladder ✓.
  CONCLUSION: **the questions do not contradict the modules. The contradictions students see are caused 100% by the parser defect.** This materially narrows the correction job — it is confirm-and-approve, not rewrite.

- DELIVERABLE 1 — "⚠️ Questions Requiring Correction — Working Page" (id 3c4a01c5-6cc2-81cb-acff-fbcad2482370), created as a CHILD of the Canonical Quiz Bank. Categorised, with full option sets and intended answers, structured for line-by-line markup:
  · CATEGORY A (8) — a WRONG answer is currently marked correct: P3 Q4 (marks "Talent"), P5 Q1 ("Talent"), P8 Q2 ("Professors and deans"), P8 Q4 ("They talk the most"), P10 Q2 ("Salary"), P11 Q3 ("To be perfect"), P13 Q2 ("Manager"), P14 Q4 ("The role is filled"). Each entry states intended vs currently-marked, fragment count, and why it matters against the module.
  · CATEGORY B (7) — shattered options, correct only by luck (first fragment = first word of the right answer): P4 Q2, P5 Q2, P6 Q2, P9 Q2, P11 Q2 (24 options, worst), P12 Q4, P13 Q4.
  · CATEGORY C (1) — P2 Q4: shattered (10 options) but still scores correctly (answer contains no commas).
  · CATEGORY D (1) — P4 Q1: malformed key containing an author's note "(reverse: strong = …)"; resolves correctly only by accident. Flagged that the question/option wording is itself confusing and worth a rewrite.
  · TOTAL 17 of 56 need correction; the other 39 are clean (4 options, exact key match).
  NOTE: earlier entries said "9 mark a wrong answer correct" — corrected here to **8**, with P4 Q1 reclassified as a malformed key that happens to resolve correctly. The 17-question total is unchanged.

- DELIVERABLE 2 — "⚠️ Source Conflicts & Module Numbering — Reconciliation Needed" (id 3c4a01c5-6cc2-81d9-8f79-e3f90ccdfa0a), created under Product Development. Documents four conflicts with a decisions table:
  · CONFLICT 1 — three coexisting numbering schemes (module content pages P1–P14 = the app ✓ · Syllabus + Video TOC P14/P15 · Curriculum & Pillars P15). Recommends keeping P1–P14 and correcting the other pages, as the smallest change.
  · CONFLICT 2 — the "Master Module (P12+P13)" merge is half-applied: the Syllabus/TOC describe it, the P12 content page is subtitled "(Combined P12 + P13 — Finalized Edition)", but Pillar 3 Modules and the app still show them separately. Flagged as the ONLY structural (non-cosmetic) item — it would ripple into exercises, quizzes, progress and the "N of 14" counter.
  · CONFLICT 3 — DUPLICATE module pages: an unlinked Dec-11 generation (IDs `2c6a…`) shadows the index-linked Dec-8 set (`2c1a…`/`2c2a…`). Confirmed pairs for P3, P7, P10, P14. Warned that the new canonical quiz child pages were attached to the INDEX-LINKED set and would need moving if the other generation is promoted.
  · CONFLICT 4 — the Syllabus page contains BOTH the Prep syllabus and a second product (CORPORATE ACADEMY GRAD, modules G1–G15, 6 live sessions). Recommends splitting, since either a person or a tool can conflate them.
  · Also recorded what is verified CORRECT and needs no action: module weeks, the five live sessions, and module content provenance — so the disagreement is only about labels and page currency, not what the program teaches.

- Decisions made:
  1. **Q1 (quiz options + answer keys) is ON HOLD** until Oscar completes the working page. Rewriting it afterwards is strictly better: it can re-author from HIS approved wording rather than from questions we already know are defective, and it avoids doing the seed edit twice. The parser hardening half of Q1 (pipe delimiter + fail-loudly on unmatched key) is independent and could ship earlier if desired.
  2. D1 (Phase-3 deprecation) remains ready and is unaffected by any of this — it can run at any time.

- Files changed in the repo: BUILD-LOG.md only. No code, no seed, no deploy.

- Open questions / things needing Oscar's input:
  1. Work through the Questions Requiring Correction page (confirm/edit the 17), then tell me the fixes → I update the master Bank → then I rewrite Q1 against it.
  2. Source Conflicts page decisions 1–3 (numbering, the merge, the duplicate pages); #4 (split GRAD) is low-risk anytime.
  3. Run D1 whenever convenient.
  4. HARD GATE STILL OPEN: R1 items 4–5 (export CSV + admin roster) need an admin session.

- Next step (the single concrete next action):
  Oscar reviews the two Notion working pages and returns his corrections/decisions. Then: update the master Quiz Bank → rewrite Q1 from it → run Q1 + D1 → verify live → clear the R1 admin gate.

---

=== LOG UPDATED: 2026-08-22 04:32 (America/Detroit) — Oscar's line-by-line quiz decisions captured in Notion; Q1 REWRITTEN (v2) against his approved wording. One open item (A8 options) ===

- Context: Oscar worked through the "Questions Requiring Correction" page and gave per-question direction. His framing principle for the wrong options: they should "sound like a real answer to give them an opportunity to think" rather than obvious throwaways like "Talent".

- OSCAR'S DECISIONS (recorded verbatim in intent):
  · A1 P3 Q4 — "solid, just needs to be fixed", bolded option correct → parsing only.
  · A2 P5 Q1 — content good, but strengthen the wrong options; his examples: "gaining a vast network", "securing an executive board position", "ranking high in your classes / GPA / testing curve".
  · A3 P8 Q2 — "that's a good one, let's just fix the parsing".
  · A4 P8 Q4 — replace "They talk the most" → "people are naturally attracted to them"; replace "They know more people" → "they understand hiring psychology".
  · A5 P10 Q2 — "good, I have no problem with that" → parsing only.
  · A6 P11 Q3 — replace "To be perfect" → "fulfilling the job description"; replace "To make friends" → "gaining a network".
  · A7 P13 Q2 — "I like the content and questions there, just gotta fix the parsing".
  · A8 P14 Q4 — bolded answer correct; wants better wrong options but had none in mind → asked Cowork to propose.
  · Category B (7) and C (1) — no input needed, fix only.
  · Category D P4 Q1 — flip "I contributed"/"I participated", and check for others like it.

- CHECK REQUESTED BY OSCAR — COMPLETED: scanned all 56 questions for (1) answer keys containing author notes/meta-instructions, (2) "versus/vs" questions where option order may contradict the question, (3) options containing parentheses. RESULT: **P4 Q1 is the only case on all three counts.** The one other parenthesis found — P13 Q3 "Manager fit (who you'll learn from)" — is a legitimate clarifier. Confirmed one-off; no systemic issue.

- COWORK'S PROPOSED REVISIONS (drafted to Oscar's brief, all recorded in Notion):
  · P5 Q1 wrong options → "Building a large professional network" / "Securing an executive board position" / "Ranking near the top of your class".
  · P8 Q4 → "People are naturally drawn to them" / "They understand hiring psychology better" / "They attend more networking events".
  · P11 Q3 → "To fulfill the job description exactly as written" / "To build a network across the company" / "To prove how much you already know" (third grounded in the module's own line that managers aren't evaluating how much you know).
  · P14 Q4 (A8, PROPOSED — awaiting Oscar) → "Recruiters stop reading applications after the first few days" / "Applicant systems screen you out on keywords before a human sees it" / "The salary band is locked before the posting goes live". RATIONALE RECORDED: the original distractor "The role is filled" was actively bad because the module itself teaches that up to 70% of roles ARE filled quietly before posting — so it reads as arguably true and competes with the real answer. The replacements are plausible job-market claims that are NOT the module's stated reason.
  · P4 Q1 → options flipped to `"I contributed" vs "I participated"` (matching the question's strong-versus-weak order), author's note stripped from the key.

- DELIVERABLE — Notion page "✅ APPROVED FINAL — Revised Questions (2026-08-22)" (id 3c4a01c5-6cc2-81ac-bebe-ef06bd1f03ff), created as a child of the Canonical Quiz Bank. Contains the decisions table, the exact final wording for every revised question, the completed one-off check, and the list of 13 questions that need parsing-only conversion. This page is now the authoritative wording the app will be built from.

- DELIVERABLE — CURSOR-PROMPT-Q1v2-quiz-fix.md (supersedes the earlier Q1 draft, which was written before Oscar's review and is now obsolete). Part 1: pipe delimiter in the seed + parse the bracketed substring first + STRICT key resolution that throws naming the module/question instead of the silent `?? "0"` fallback (the guard that would have caught this originally) + convert all 56 lines. Part 2: apply the five approved content revisions verbatim. Acceptance: 56 questions × exactly 4 options, zero fallbacks, plus a test/assertion that fails the seed if violated.

- Files changed in the repo: BUILD-LOG.md only. No code, no seed, no deploy this session.

- Open questions / things needing Oscar's input:
  1. **A8 (P14 Q4)** — confirm or swap the three proposed wrong options. This is the ONLY open item blocking a clean Q1v2 run; if he wants different wording it is a one-line edit to the prompt before running.
  2. Source Conflicts page decisions 1–3 (numbering / the P12+P13 merge / the duplicate Dec-11 module pages); #4 (split GRAD onto its own page) is low-risk anytime.
  3. D1 (Phase-3 deprecation) — ready, unaffected, run anytime.
  4. HARD GATE STILL OPEN: R1 items 4–5 (export CSV + admin roster) need an admin session.

- Next step (the single concrete next action):
  Oscar confirms the A8 options → runs Q1v2 in Cursor → build → commit/push → `npx tsx --env-file=.env.local scripts/seed-workbook-content.ts` → I verify live (4 options everywhere; P3 Q4 marks "Reps, wins, identity"; P10 Q2 marks the manager-quality option; the five revised questions show new wording).

---

=== LOG UPDATED: 2026-08-22 04:41 (America/Detroit) — A8 CONFIRMED. All 17 quiz corrections settled. Q1v2 is unblocked and ready to run ===

- Oscar confirmed the three proposed P14 Q4 (A8) wrong options. That was the last open content item.
- Notion "✅ APPROVED FINAL — Revised Questions (2026-08-22)" updated in place: A8 marked CONFIRMED in both the decisions table and the section heading, and the next-steps list updated to record that all 17 questions are settled with no open items. (Updated a Cowork-created page only; no pre-existing Notion content touched.)
- STATUS: the quiz content question set is now fully canonized and approved in Notion. CURSOR-PROMPT-Q1v2-quiz-fix.md requires no further edits and can be run as-is.

- Files changed in the repo: BUILD-LOG.md only.

- Open questions / things needing Oscar's input (none blocking Q1v2):
  1. Source Conflicts page decisions 1–3 (numbering / P12+P13 merge / duplicate Dec-11 module pages); #4 split GRAD — low risk anytime.
  2. HARD GATE: R1 items 4–5 (export CSV + admin roster) need an admin session before the next pass.

- Next step (the single concrete next action):
  Oscar runs Q1v2 in Cursor → `npm run build` → commit/push → `npx tsx --env-file=.env.local scripts/seed-workbook-content.ts` (NEVER seed:content) → I verify live. Then D1 (Phase-3 deprecation) as a separate commit.

---

=== LOG UPDATED: 2026-08-22 05:55 (America/Detroit) — Q1v2 (02931e6) + D1 (57fa785) SHIPPED & VERIFIED. All 56 quiz questions correct. MODULE NUMBERING RESOLVED by Oscar — no renumbering needed ===

- Commits this round: 02931e6 (Q1v2 quiz parser + 56-question conversion + 5 approved revisions, re-seeded) and 57fa785 (D1 Phase-3 deprecation). E1.6 also confirmed as c8999ec.

- Q1v2 VERIFICATION — PASS, exhaustive (not sampled):
  1. Parsed all 14 modules from the updated seed: **56 questions, every one with exactly 4 options, every answer key matching an option exactly. ZERO problems.** (Previously: 16 questions mis-split, 8 marking a wrong answer correct.)
  2. Live DOM on P11: **16 radio inputs = 4 questions × 4 options** (was 38+). Q2's six-qualities answer renders as ONE option, not 24 fragments.
  3. The 8 previously mis-teaching keys are all corrected: P3 Q4 → "Reps, wins, identity" (was "Talent") · P5 Q1 → "Ownership, responsibility, reliability, growth" (was "Talent") · P8 Q2 → "Seniors, recent grads, and students with offers" (was "Professors and deans") · P8 Q4 → "They're intentional, consistent, and good listeners" (was "They talk the most") · P10 Q2 → the manager-quality list (was "Salary") · P11 Q3 → "To be coachable, consistent, and visible" (was "To be perfect") · P13 Q2 → "Salary, brand name, location" (was "Manager") · P14 Q4 → "You're filtering against hundreds, not competing" (was "The role is filled").
  4. Oscar's 5 approved revisions are live and verified in the DOM (P11 Q3's new distractors confirmed rendering).
  5. Cursor also added `assertQuizBank` invoked from `loadWorkbookSeedFromFile()` plus 5 parser tests — the seed now ABORTS on a bad key rather than silently defaulting. This is the guard that would have prevented the original defect.

- D1 NOTABLE FINDING (Cursor reported, worth recording): the Phase-3 files were reachable from MORE places than the audit identified — beyond `seed:content`, there was a live **POST /api/seed-content** route and the **superadmin content page** importing `seed-to-db` transitively. All neutralised (route now returns 410; superadmin import removed; files renamed DEPRECATED-DO-NOT-USE-* with warning headers; `seed:content` removed from package.json and the script refuses + exits 1 before touching the DB). `content/live-sessions.ts` untouched; `seed:workbook` and `seed:live` unaffected. So the landmine was larger than the audit found — good outcome from the "STOP and report if any live path imports these" instruction.

- ⚠️ MODULE NUMBERING — **RESOLVED BY OSCAR. NO RENUMBERING NEEDED. The app was right all along.**
  Oscar's explanation: the program originally had **15 modules**; he then **condensed two into one** — old P12 + old P13 became the single "The First 90-Day Professional Playbook" = **P12**. That merge shifted everything after it down by one: Opportunity Mapping P14 → **P13**; Hidden Job Market P15 → **P14**.
  Consequences:
  · CONFLICT 1 RESOLVED — P1–P14 is final. The app and the module content pages are correct; the Syllabus, Video TOC and Curriculum & Pillars pages are showing the OLD pre-merge numbering and are stale documentation.
  · CONFLICT 2 RESOLVED — the "Master Module (P12 + P13 Combined)" is not a pending structural change; it is a merge that ALREADY HAPPENED. P12 IS the merged module, its content-page subtitle is correct, and the app's "N of 14" counter is right. **The structural merge I flagged as risky is a non-issue — nothing to build.**
  · Remaining Notion cleanup is documentation-only: update Syllabus / Video TOC / Curriculum & Pillars to current numbering.
  Recorded as a "✅ RESOLVED 2026-08-22" callout at the top of the Source Conflicts page.

- Files changed in the repo: BUILD-LOG.md only (Cowork does no git ops).

- Open questions / things needing Oscar's input:
  1. Notion doc cleanup: update Syllabus / Video TOC / Curriculum & Pillars to P1–P14 (documentation only, no product impact).
  2. Conflict 3 — delete/archive the unlinked Dec-11 duplicate module pages (note: the canonical quiz child pages were attached to the index-linked Dec-8 set).
  3. Conflict 4 — split the GRAD syllabus onto its own page.
  4. HARD GATE STILL OPEN: R1 items 4–5 (export CSV + admin roster) need an admin session. NOTE: a CAPRI Google Form tab is now open in the browser — CAPRI belongs to the separate content-development thread, not this one.

- Next step (the single concrete next action):
  Clear the R1 admin gate (admin session needed) — it is the last item blocking the next pass. Remaining pre-cohort blockers: Supabase PAID plan, service_role key roll.

---

=== LOG UPDATED: 2026-08-22 06:01 (America/Detroit) — Notion documentation renumbered under one-time editing clearance. Conflicts 1 & 2 CLOSED in product AND docs. Edit segment closed; moving to R1 ===

- Context: Oscar granted a ONE-TIME clearance to edit existing Notion pages (the standing rule is add-only). Scope was limited to correcting the stale module numbering on three documentation pages. Dependency question answered first: nothing in the product reads Notion — the app is seeded from workbook-content-seed.md — so there was no functional dependency; the risk was purely that the next reader gets misled, which had ALREADY cost a cycle (it caused the Gate A stop). The Video TOC also carried a genuine future dependency as the map for wiring real videos.

- EDITS APPLIED (3 pages, surgical, content preserved):
  1. **Curriculum & Pillars** — Prep Pillar 3 renumbered. Former P12 "Becoming Pro-Ready" + former P13 "First 90 Days: Pre-Professional Edition" merged into **P12 — The First 90-Day Professional Playbook**, with ALL bullets from both preserved and a note explaining the merge is why Prep has 14 modules not 15. Opportunity Mapping → **P13**, Hidden Job Market → **P14**, each annotated with its former number. **The GRAD section (G1–G15) was deliberately NOT touched** — different product, not part of the merge.
  2. **Syllabus w/ Videos and Workbook** — Week 9 → P14 Hidden Job Market; Week 11 → P13 Opportunity Mapping; Week 12 → P11 + P12 (replacing "Master Module (P12 + P13 Combined)").
  3. **Video Table of Contents** — module headings and video labels renumbered (P15.1/.2 → P14.1/.2; P14.1/.2 → P13.1/.2; Master Module → P12).

- INCIDENTAL FINDING WORTH RECORDING: the Video TOC was **already internally contradictory** — its linked child pages were titled "Video P14.1 — The Hidden Job Market" and "Video P13.1 — Opportunity Mapping" (i.e. already on the NEW numbering) while the headings above them used the OLD numbering. So part of the workspace had already been migrated and part hadn't; the edit resolved that. This also explains why the numbering looked "mid-renumber" during Gate A — it genuinely was, but only in the documentation layer, never in the product.

- VERIFICATION: re-fetched the Video TOC after editing and confirmed Week 9 = P10 + P14, Week 11 = P13, Week 12 = P11 + P12, with video labels matching their linked pages. Source Conflicts page updated with a "✅ DOCUMENTATION FIX APPLIED" record.

- STATUS: **Conflicts 1 and 2 are now closed in both the product and the documentation.** Remaining Notion items are Conflict 3 (the unlinked duplicate tree — note it is a FULL parallel branch: "Pillar 1/2/3 Modules (1)" with their own module children, not scattered pages) and Conflict 4 (split the GRAD syllabus onto its own page). Neither blocks anything.

- Files changed in the repo: BUILD-LOG.md only.

- Next step (the single concrete next action):
  **R1 verification — the last item blocking the next pass.** Needs an institution-admin or super-admin session in the browser so Cowork can confirm (a) the export CSV contains LS1–LS5 attendance columns in week order plus "Live sessions attended N of 5", and (b) the admin roster shows "N of 5" per student, with a zero-attendance student still showing full module completion. Cowork never enters credentials — Oscar signs in, then Cowork verifies. After that: Supabase PAID plan and the service_role key roll are the remaining pre-cohort blockers.

---

=== LOG UPDATED: 2026-08-23 07:13 (America/Detroit) — R1 GATE CLEARED. Root-caused and fixed a CRITICAL latent defect: `profiles.last_login` column never existed, silently emptying every admin roster and export ===

- Context: Oscar reset the super-admin password via SQL (the documented reset-email path is unreliable in this project due to the known redirect loop) and signed in as Super Admin so Cowork could complete R1 items 4–5.

- ⚠️⚠️ CRITICAL DEFECT FOUND AND FIXED — `profiles.last_login` DID NOT EXIST IN THE DATABASE.
  Symptom: both institution rosters rendered "0 student(s) · No students enrolled yet" despite two students existing.
  Diagnosis path (recorded because the failure was well-disguised): ruled out RLS (`/superadmin/users` reads the same table with the same user-scoped client and returned all 3 profiles); ruled out a data mismatch (SQL confirmed Test Student → ffc653d3 Demo University, Demo Student → 60b990ac Demo Preview, both `role = 'student'`); ruled out Next.js caching (cache-busted reload, same result); confirmed RLS policies are correct via pg_policies ("Super admins read all profiles" / "Super admins see all institutions"). Then tested each column the roster query selects against information_schema — **`last_login` = false, every other column = true.**
  ROOT CAUSE: `lib/cohort-analytics.ts` line ~108 selects `last_login`. Postgres rejects the unknown column, the query returns an error, and the code destructures **only `data`, never `error`** — so `students` becomes `[]` and the UI renders a confident, plausible-looking empty state.
  BLAST RADIUS (all silently broken, for every institution, since introduction):
   · Every admin/institution student roster.
   · The institutional export CSV (the R1 deliverable — it was emitting headers with no rows).
   · `app/actions/activity.ts` writes `last_login` on every sign-in — that write has been failing silently too.
   · The student-detail page and student dashboard read it.
  Notably `types/database.ts` DECLARES last_login, so TypeScript never caught it — the generated types are out of sync with the actual database.
  FIX APPLIED by Oscar in the SQL editor: `alter table public.profiles add column if not exists last_login timestamptz;`

- R1 VERIFICATION — BOTH ITEMS PASS (post-fix):
  1. **Admin roster** — Demo University now shows "1 student(s)": Test Student, XP 0, Rank —, Completion 0%, **"Live sessions: 0 of 5"** with the five-dot indicator, status "Behind pace". Matches the R1 spec exactly. PASS ✓
  2. **Export CSV** — fetched `/api/admin/<id>/export`: HTTP 200, `text/csv`, headers `name, email, completion_percent, xp, rank, quiz_average, last_login, flag_status,` then **"LS1 Identity Q&A + Purpose Coaching (Wk 2)", "LS2 Resume + LinkedIn Workshop (Wk 4)", "LS3 Communication Lab (Wk 6)", "LS4 Warm Networking Lab (Wk 8)", "LS5 Recruiting Strategy Hot Seat (Wk 10)", "Live sessions attended"** — five session columns in week order with the real syllabus titles, values "Not attended", trailing count "0 of 5". Column list is DB-sourced, not hardcoded. PASS ✓
  3. **Non-blocking rule holds** — a student with 0 of 5 attendance appears normally with completion tracked independently; attendance does not gate. PASS ✓

- **THE R1 HARD GATE IS NOW CLEARED.** The pass may advance.

- OUTSTANDING FOLLOW-UPS FROM THIS FIX (recommend a small Cursor pass, NOT yet run):
  1. Add `supabase/migrations/<ts>_add_profiles_last_login.sql` containing the ALTER, so the schema is reproducible — otherwise any new environment reintroduces this exact bug.
  2. **Stop swallowing query errors in `getCohortAnalytics`** (and audit for the same `const { data } = await …` pattern elsewhere). A schema mismatch presented as a credible "no students enrolled" — an institution admin would have concluded their cohort never signed up. Check `error` and surface a real failure state. This is the silent-zero defect flagged earlier, now with a confirmed cause.
  3. Regenerate `types/database.ts` from the live schema so generated types and the database agree.

- Files changed in the repo: BUILD-LOG.md only.

- Open questions / things needing Oscar's input:
  1. Approve the small follow-up pass (migration + error handling + type regen)?
  2. Notion Conflicts 3 & 4 (duplicate tree; split GRAD) — optional cleanup.

- Next step (the single concrete next action):
  With R1 cleared, the remaining pre-cohort blockers are: **Supabase on a PAID plan**, **roll the exposed service_role key**, and the follow-up pass above. Recommend the follow-up pass first since it is small and prevents a repeat of a defect that silently misrepresents cohort data to institutions.

---

=== LOG UPDATED: 2026-08-23 07:22 (America/Detroit) — CORRECTION to the previous entry's framing, per Oscar. Plus: testing phase added to the roadmap ===

- **CORRECTION (Oscar's, and he is right).** The previous entry characterised the missing `profiles.last_login` column as a "critical latent defect" that had "silently shipped" and would have "misrepresented cohort data to institutions". That framing is wrong and is hereby corrected. **The column's absence was KNOWN and expected — it was outstanding work that had not been built yet. Running the ALTER was simply finally implementing it, not repairing a regression.** No institution ever saw a misleading roster, because no institution has ever used the product. Cowork overstated both the severity and the customer impact.
- What remains factually accurate from that entry, and is worth keeping: the technical diagnosis (the roster query selects `last_login`; the column did not yet exist; the query errored; `const { data } = await …` swallows the error and yields an empty roster), the blast-radius list of code paths that depend on the column, and the R1 PASS results. Only the severity framing was wrong.
- The genuinely useful engineering note that survives the correction, at its correct (lower) severity: **unchecked `error` destructuring is a pattern worth auditing** — not because it caused customer harm, but because it makes unbuilt or misconfigured things look like legitimate empty states, which costs diagnosis time. That is a code-quality improvement, not an incident.

- **NEW ROADMAP ITEM (Oscar):** after the site is finalized, enter a **dedicated TESTING PHASE** before onboarding a real cohort. This is now a distinct phase in the sequence rather than something folded into feature passes. Scope to be defined, but it is the natural home for: end-to-end student journey testing, admin/institution flows, the error-handling audit above, schema/type reconciliation, and anything else that wants deliberate QA rather than spot-verification.

- Files changed in the repo: BUILD-LOG.md only.

- Updated sequence: finalize site → **TESTING PHASE** → pre-cohort blockers (Supabase PAID plan, service_role key roll) → marketing/front end + first cohort → Pass 4 social layer.

---

=== LOG UPDATED: 2026-08-29 12:43 (America/Detroit) — ADMIN/REPORTING ASSESSMENT COMPLETE (assessment only, nothing built). Full report delivered as ADMIN-REPORTING-ASSESSMENT.md ===

- Context: assessment + planning pass. NO student-side changes, NO feature building. Purpose: map the admin/reporting situation so building happens in the right order, and so CAPRI-dependent reporting isn't built twice. Decided direction recorded: **v1 reporting is PUSH** — Oscar sends reports; institutions do NOT log in. v1 is a report generator, not an institutional portal.

- PART A — PROPAGATION AUDIT (live as Super Admin + code read of all 11 admin surfaces). Headline: **functionally better than expected, cosmetically worse.**
  · R1 live-session work and C3 timeline work DID propagate — attendance appears on the roster, the export, and student detail; student detail interleaves live sessions in week order correctly.
  · **Cosmetic propagation is ZERO** — a search for experience-lift / lift-chip / lift-text-wrap / v2 components across app/(protected)/admin and /superadmin returns nothing. Entire admin side is pre-E1. Expected (E1 was student-scoped) but it is Oscar's daily surface.
  · **Biggest gap: the living workbook is absent from every admin view.** The product's differentiator is invisible to the person selling and reporting on it.
  · /superadmin overview self-describes as scaffolding ("full management tools arrive in Phase 5"; "Create institutions in Supabase"; "Upload rosters … in Phase 5").
  · Strongest pages: /admin/[id]/dashboard (pace tracker, cohort health, rankings, per-module breakdown) and student detail. Weakest: institutions list (no comparative data), users (read-only), reports (empty shell).
  · BUGS FOUND: (A3) module ordering wrong on 3 admin surfaces — P1,P3,P2 … P10,P14,P13,P11,P12; the S4 fix never reached admin. (A4) cohort week unclamped — Demo University shows **"Cohort Week 15"** on a 12-week program; reads as broken in front of a buyer. (A5) content page shows `Quiz (4): —` for every module despite quizzes existing and being correct post-Q1. (A6) no time-series anywhere — everything point-in-time, so no "since last report" delta. (A7) snapshot generation is passive (fires only on dashboard load) — unreliable trigger for scheduled reporting. (A8) no in-product institution/roster creation — onboarding a real cohort currently requires hand-written SQL.

- PART B/C — ESSENTIALS CHECKLIST, every item tagged [IND] CAPRI-independent / [PUSH] push plumbing / [CAPRI] waits on CAPRI Thread 1.
  · Oscar-needs (O1–O12): cross-institution overview, cohort health, per-student drill-down, attendance, intervention list, **workbook activity**, quiz performance, roster mgmt, institution creation, pacing controls, snapshots, CAPRI completion tracking.
  · Institution-receives (R1–R12), derived by writing the target report sentence first and working backward: cohort identity, participation, completion, attendance, **delta since last report**, students needing attention, engagement depth, a sendable artifact, scheduled generation, and the CAPRI lift story.
  · Scope consequence recorded: because v1 is push, **no institution-facing login, self-serve dashboard, permissions work, or institution-admin onboarding is required** — a large correct deferral. The /admin/[institution-id]/* pages are therefore **Oscar's internal tooling, not a customer portal**, so they need internal-grade polish, not customer-grade.

- RECOMMENDED SEQUENCE (CAPRI-independent + push plumbing only):
  Stage 0 quick wins — clamp cohort week; ascending P-number sort on the 3 admin surfaces; fix the quiz status indicator; plus the carried-over R1 follow-ups (last_login migration file, regenerate types/database.ts, stop swallowing query errors in getCohortAnalytics).
  Stage 1 data gaps [IND] — workbook/exercise activity metrics (biggest gap + the differentiator); per-student quiz performance; "needs attention" with reasons; cohort-level attendance summary.
  Stage 2 push plumbing [PUSH] — make snapshot generation deliberate (explicit action and/or scheduled job) rather than a page-load side effect; snapshot diffing for deltas; report artifact generation. **Design note carried to the CAPRI thread: build the generator with a pluggable outcomes section so CAPRI drops in without rework.**
  Stage 3 operational [IND] — in-product roster management/invite, institution creation, cross-institution overview.
  WAITING ON CAPRI (do not build): O12, R10, R11, R12.
  Suggested first pass: **Stage 0 + workbook metrics.**

- PART D — DEMO UNIVERSITY SEED PLAN: SQL for 8 varied test students (completion 100%→0%, XP spread, inactivity 0–40 days, two without diagnostic, attendance deliberately UNCORRELATED with completion so the non-blocking rule shows up in reports). Marked test data (@demo.test, "Demo" name prefix), Demo-University-scoped, idempotent, with a cleanup script. Includes a STEP 0 pre-check for a profiles.id → auth.users foreign key, with instructions to stop and report if it exists (no auth users are created, so seeded students cannot log in — intended for reporting fixtures). Oscar runs the SQL.

- Files changed in the repo: BUILD-LOG.md only. No code, no build, no deploy — assessment pass as scoped.

- Open questions / things needing Oscar's input:
  1. Review the assessment and confirm the build sequence (esp. that Stage 0 + workbook metrics is the right first pass).
  2. Run STEP 0 of the seed, then the seed itself if no FK blocks it.
  3. Confirm the framing that /admin/[institution-id]/* is internal tooling, not a customer portal — it changes the polish bar.

- Next step (the single concrete next action):
  Oscar reviews ADMIN-REPORTING-ASSESSMENT.md and runs the Demo University seed; building begins in a later pass informed by this map.

---

=== LOG UPDATED: 2026-08-29 13:44 (America/Detroit) — DEMO UNIVERSITY SEED LOADED + two admin bugs root-caused. Supabase & Vercel MCPs connected ===

- **Tooling change:** Oscar connected Supabase and Vercel MCPs. I can now run SQL and read deployments directly instead of handing Oscar queries to paste. This removes the round-trip failure mode that produced four wrong calls during the seed (invalid hex in the UUID prefix, a bad Step 2 join, a wrong "trigger didn't fire" diagnosis, and an insert that should never have been run). **Root cause of all four: I treated the SQL editor's empty result set from an UPDATE as failure and theorized instead of running one cheap SELECT.** Rule going forward: verify before diagnosing.

- **Seed loaded into Demo University (`ffc653d3-da74-4141-afa5-be70d6eaf1c8`).** 8 students, IDs `dee00000-0000-4000-a000-00000000000{1..8}`, emails `@demo.test`, names prefixed "Demo", and **`is_demo = true`** (schema already had the flag — better marker than the email pattern; use it for exclusion filters).
  · Completion spread 14/14 → 0/14 (100%, 86%, 71%, 50%, 36%, 21%, 7%, 0%); students 2–7 each carry one in-progress module (video watched, exercises not submitted) so partial states render.
  · Inactivity 0–40 days; Gray and Harper have `diagnostic_complete = false`; quiz averages 77–87.
  · **Attendance deliberately uncorrelated with completion** — Casey is 71% complete with 0/5 sessions, Gray is 7% complete with 5/5. This is the case that proves the non-blocking rule in reports.
  · `handle_new_user` DID fire on direct SQL inserts and populated role/institution/full_name from `raw_user_meta_data`, as designed.

- **Attendance storage confirmed:** there is no separate attendance table. Attendance is a `student_progress` row against an `is_live_session` module with `is_complete = true`. Worth stating plainly since reporting will query it.

- **BUG A4 root-caused (cohort week):** Demo University's `cohort_start_date` is 2026-05-23 — 14.1 weeks before today, so the week counter honestly computes 15. The data is right; the display is unclamped. Fix is `least(computed_week, 12)` at the display layer, NOT a data edit.

- **BUG A3 root-caused (module ordering):** `modules.order_index` only ever holds 1 or 2 and is not unique within a week, so sorting by `(unlock_week, order_index)` produces exactly the reported P1,P3,P2 and P10,P14,P13,P11,P12. Confirmed against the table: week 1 = P1(1), P3(1), P2(2); week 9 = P10(1), P14(2); week 11 = P13(2); week 12 = P11(1), P12(1). **The admin sort is not arbitrary — it is faithfully reproducing bad `order_index` data.** Two possible fixes: renumber `order_index` to be unique and correct within each week (data fix, benefits every surface), or sort by numeric module_code at the display layer (cosmetic only). Recommend the data fix. Note P13 sits at week 11 with no order_index 1, and P11/P12 share week 12 — worth confirming those are intended before renumbering.

- Files changed in the repo: BUILD-LOG.md only. Database changed: profiles (is_demo + progress fields on 8 demo rows), student_progress (seeded). No application code touched.

- Next step: Oscar looks at `/admin/ffc653d3-da74-4141-afa5-be70d6eaf1c8/dashboard` with real spread in it, then we scope Stage 0 + workbook metrics.

---

=== LOG UPDATED: 2026-08-29 14:05 (America/Detroit) — STAGE 0 SCOPED. order_index data fix APPLIED. Cursor prompt S0 drafted. A3 diagnosis CORRECTED ===

- **CORRECTION to the A3 finding logged at 13:44.** I recorded that the admin order `P10, P14, P13, P11, P12` was wrong. **It is not.** That IS the correct chronological order — `workbook-content-seed.md` puts P14 in week 9, P13 in week 11, and P11/P12 in week 12, because the 15→14 renumber left module numbers no longer tracking the calendar. The real defect was narrower: **`order_index` was not unique within a week** (P1 and P3 both 1; P11 and P12 both 1), so ties resolved arbitrarily and week 1 rendered P1, P3, P2. I over-scoped the bug from one visibly-wrong week to the whole sequence.

- **Root cause of the stale ordering:** `order_index` is only ever written by `20240526200000_seed_phase3_all_modules.sql` — the deprecated Phase-3 migration. `seed:workbook` writes `unlock_week` but **never** writes `order_index`. So when C3 moved the weeks, the ordering data was left behind with no mechanism to catch it.

- **GATE — Oscar's decision (asked because student and admin sides disagreed):** `lib/program-nav.ts` sorts students by P-number, admin sorts by week; these produce different sequences and only one can be right. **Oscar chose: `unlock_week` is truth, ascending P-number as the within-week tie-break.** Consequence accepted: module numbers appear out of sequence to students (P14 before P13 before P11). Also chose to fold the three R1 follow-ups into the same commit.

- **APPLIED to production** (migration `fix_module_order_index_week_truth`): canonical `order_index` for all 19 rows. Structure now reads clean — self-paced modules on odd weeks, live sessions on even weeks: wk1 P1·P2·P3 / wk2 LS1 / wk3 P4·P5 / wk4 LS2 / wk5 P6·P7 / wk6 LS3 / wk7 P8·P9 / wk8 LS4 / wk9 P10·P14 / wk10 LS5 / wk11 P13 / wk12 P11·P12. Verified by re-query.

- Migration files written to the repo (Oscar to commit): `20240602000000_profiles_last_login.sql` (idempotent; records the column R1 added directly in Supabase so repo and DB stop disagreeing) and `20240602100000_fix_module_order_index.sql` (documents the applied data fix).

- **A4 (cohort week) re-checked and downgraded.** Clamping is a *display* fix only — `targetWeek` at 15 vs 12 selects the same module set (nothing unlocks past week 12), so `pacePercent` was never wrong. My 13:44 note implied a pace defect; there isn't one.

- **A5 (quiz indicator) root-caused:** `app/(protected)/superadmin/content/page.tsx` tests `quizCount >= 5`, but every module has exactly 4 questions post-Q1 (56 ÷ 14). Stale Phase-3 threshold. Confirmed all 14 modules have exactly 4 in the DB.

- **CURSOR-PROMPT-S0-stage0-admin-fixes.md** drafted, six items: (1) `PROGRAM_LENGTH_WEEKS` + `displayWeek`, clamping display only and explicitly NOT `getProgramWeek()` (drip unlocking needs the raw value); (2) sort by `(unlock_week, order_index)` in `program-nav.ts`, plus **add `order_index` to the seed file/parser/seeder and assert loudly on duplicate `(week, order_index)` pairs** so this cannot go stale a third time; (3) quiz threshold → `QUIZ_QUESTIONS_PER_MODULE = 4`; (4) stop discarding Supabase `error` in `cohort-analytics.ts` — an empty cohort and a failed query must never look identical; (5) regenerate `types/database.ts`; (6) exclude `is_demo` rows from cross-institution rollups only.

- Files changed in the repo: BUILD-LOG.md, two migration files, CURSOR-PROMPT-S0. Database: `modules.order_index` (19 rows). No application code touched — that is Cursor's job.

- Next step: Oscar runs S0 in Cursor, builds, commits, re-seeds, then we verify live and move to Stage 1 (workbook activity metrics).

---

=== LOG UPDATED: 2026-08-29 14:32 (America/Detroit) — S0 VERIFIED (partial). Commit 70bb580 live. Q1 quiz integrity survived the re-seed ===

- Deployment confirmed via Vercel API: `dpl_Bv1LWFmMPAqnx2wHVkhfgiY3Nnjy`, commit **70bb580**, target production, state READY, aliases include `ca-lms.vercel.app`. **Zero runtime errors in the last 24h.**

- **DATABASE VERIFIED after `seed:workbook`** — the re-seed now writes `order_index` and the values survived intact. All 19 rows still read: wk1 P1·P2·P3 / wk2 LS1 / wk3 P4·P5 / wk4 LS2 / wk5 P6·P7 / wk6 LS3 / wk7 P8·P9 / wk8 LS4 / wk9 P10·P14 / wk10 LS5 / wk11 P13 / wk12 P11·P12.

- **Q1 QUIZ INTEGRITY RE-VERIFIED.** `seed:workbook` deletes and re-inserts every quiz row, so the re-seed was a genuine regression risk for the Q1 answer-key fix. Ran a full integrity query across all 56 questions: **0 questions with ≠4 options, 0 unmatched answer keys.** Spot-checked all 8 previously-corrupted questions — P3 Q4 "Reps, wins, identity" ✓, P10 Q2 the manager-quality option ✓, P5 Q1 "Ownership, responsibility, reliability, growth" ✓, P8 Q4 "They're intentional, consistent, and good listeners" ✓, P11 Q3 "To be coachable, consistent, and visible" ✓, P14 Q4 "You're filtering against hundreds, not competing" ✓, P4 Q1 the flipped `"I contributed" vs "I participated"` ✓, P13 Q2 ✓. Nothing regressed.

- **`/superadmin/content` VERIFIED LIVE.** Order now renders P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P14, P13, P11, P12 and every module shows `Quiz (4): ✓`. Both S0 fixes confirmed on a real surface.

- **PROCESS NOTE — near-miss.** My first two reads of that page showed the OLD state (P1, P3, P2 and `Quiz (4): —`), including one after an explicit reload. On the evidence I had, "S0 didn't take" was the natural conclusion — and it is exactly the wrong conclusion I reached during the E1.4 incident. Instead I checked the repo source (fix present), checked the Vercel alias (pointing at 70bb580), and re-fetched with a fresh cache-buster, at which point the page rendered correctly. **It was Chrome's cache, not a failed deploy.** The rule that held: when the live surface disagrees with the source and the deployment record, suspect the observation before the work.

- **NOT VERIFIED — `/admin/[id]/dashboard` cohort week.** The Chrome extension began failing on this route ("Cannot access a chrome-extension:// URL of different extension") and repeated navigations returned stale text. The `displayWeek` / `programComplete` / `cohortWeekLabel` work is unverified on a live surface. Everything Cursor reported is plausible and the code path was reviewed, but it has not been seen rendering. **This is the one open item from S0.**

- Also unverified for the same reason: student nav + Curriculum ordering, and the analytics-error-vs-empty-cohort distinction (the latter needs a deliberately broken query to test properly — worth doing in the testing phase, not now).

- Item 5 carried forward: `supabase gen types` was blocked by a missing access token, so `types/database.ts` was not regenerated. Cursor confirmed `last_login` is already present and no drift is known. Low risk, but it means the types file is hand-maintained rather than generated — worth closing during the testing phase.

- Open question for Oscar: **eyeball `/admin/ffc653d3-da74-4141-afa5-be70d6eaf1c8/dashboard` and confirm the cohort week reads "Week 12 of 12 · program complete" rather than 15.** That is the last unconfirmed S0 acceptance criterion.

- Next step: once the cohort-week label is confirmed, start Stage 1 — workbook activity metrics, the biggest admin gap and the product's differentiator.

---

=== LOG UPDATED: 2026-08-29 14:33 (America/Detroit) — ADMIN DASHBOARD 500 root-caused and FIXED. Two missing Phase-4 tables created. Migration drift discovered ===

- **Symptom:** Oscar reported the admin dashboard failing to load. Vercel runtime logs showed **six 500s** on `/admin/[id]/dashboard`, all identical:
  `[cohort-analytics] login_events: Could not find the table 'public.login_events' in the schema cache`

- **S0 item 4 did its job.** The `login_events` query has been failing for as long as it has existed; the error was silently discarded, so the page rendered and `weeklyEngagementScore` was quietly always 0. Making queries throw converted a *silent wrong number* into a *loud 500* — which is the correct trade and caught a second missing object within an hour of shipping. This is the same failure class as the `last_login` blocker.

- **Investigation found more than one missing table.** `login_events`, `reports`, and `recalculate_cohort_ranks()` are all declared in `supabase/migrations/20240527000000_phase4_gamification_admin.sql` and **none of them exist in production**. That migration was only partially applied.

- **ROOT CAUSE — repo/database migration drift.** The applied migration history in Supabase reads `20260525205200 … 20260526054305` (plus my `20260829175412` from today). The repo's files are all `20240525…`–`20240601…`. **The version numbers do not correspond at all** — `supabase/migrations/` has never been the source of truth for this database; it was built by another route. This explains `last_login`, `login_events`, `reports`, and `recalculate_cohort_ranks` all being absent despite being "in the repo". It is a systematic problem, not four separate oversights.

- **Oscar's decisions:** apply the fix directly via MCP now (dashboard was down); schedule the full repo-vs-database diff for the **testing phase** rather than blocking Stage 1.

- **APPLIED** (migration `create_missing_phase4_login_events_and_reports`): created `login_events` and `reports` with their indexes, RLS enabled, and policies mirroring the existing `flags`/`notifications` patterns via `current_user_role()` / `current_user_institution_id()` — users insert and read their own login events, admins read within institution scope, reports are admin-only and institution-scoped with no student access. Verified: both tables exist, RLS on, 3 policies on `login_events` and 1 on `reports`. Supabase security advisor reports **no new findings** (the four existing WARNs are pre-existing and unrelated).
  · `recalculate_cohort_ranks()` deliberately NOT created — nothing calls it; ranks are set directly. Revisit only if rank recalculation is wired up.

- Back-filled 32 `login_events` rows across the 8 demo students, consistent with their `last_login` values. Weekly engagement now computes honestly: **4 of 8 active in the last 7 days.** Before today that number was structurally 0 for every cohort.

- Repo file written for Oscar to commit: `supabase/migrations/20240602200000_create_missing_phase4_tables.sql`, idempotent, with the drift explained in the header.

- **STILL UNVERIFIED:** no request has hit `/admin/[id]/dashboard` since the fix was applied (last logged request 18:26:21 UTC, fix applied ~18:30). The Chrome extension went unreliable mid-verification — stale text extraction and cross-tab confusion — so I could not force a fresh request myself. Oscar to reload; I will confirm from runtime logs.

- Next step: Oscar reloads the admin dashboard. Confirm 200 + "Week 12 of 12 · program complete", then Stage 1 (workbook activity metrics).

---

=== LOG UPDATED: 2026-08-29 14:47 (America/Detroit) — S0 FULLY VERIFIED LIVE. Dashboard restored. My seed had a units bug (quiz_score). One real reporting defect found ===

- Chrome extension updated and working; dashboard loads clean. **All S0 acceptance criteria now confirmed on a live surface:**
  · `Week 12 of 12 · program complete · 9 students` — A4 fixed, no more "Cohort Week 15".
  · Module completion breakdown renders **P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P14, P13, P11, P12** — A3 fixed on the admin dashboard, matching `/superadmin/content`.
  · Weekly engagement **44%** — `login_events` reads successfully; this metric has a real value for the first time.
  · Cohort rankings, behind-pace list, roster, and pace tracker all populated with the seeded spread.

- **MY BUG — `quiz_score` units.** Dashboard showed **"Avg quiz score 1577%"**. Cause was my Demo University seed, not the app: `quiz_score` stores a **raw correct-answer count (0–4)**, set by `app/actions/module-progress.ts` (`if (answers[qId] === correctAnswers[qId]) score += 1`). I seeded percentages (60–100). `cohort-analytics.ts` computes `quiz_score / questionCount * 100`, so 80 became (80/4)×100 = 2000%. Arithmetic confirmed exactly: per-student averages ÷ 4 × 100, meaned over 9 students = 1576.7 → **1577**. Rescaled the 52 seeded rows to the 0–4 scale (now 2s, 3s and 4s); display corrected to **63%**.
  · Lesson: I invented plausible-looking values without checking the column's units against the code that writes it. Same category as assuming an empty UPDATE result meant failure — assuming instead of reading. The dashboard surfaced it immediately, which is itself evidence the S0 error work is paying off.

- **REAL DEFECT FOUND (app, not seed) — `averageQuizScore` counts non-takers as zero.** `cohort-analytics.ts` sums each student's `quizAverage` and divides by **all** students, so students who have taken no quiz contribute 0. Demo University: true average among the 7 students who have taken quizzes is **81%**, but the dashboard reports **63%** (81 × 7/9). A cohort where half have not started therefore looks like a comprehension problem when it is actually a participation problem — and this is exactly the kind of number that would go into an institutional report. **Fix: average only over students with at least one completed quiz, and show the denominator ("81% across 7 of 9 students").** Added to Stage 1.

- Minor, logged not fixed: roster ordering is unstable — "Test Student" (a real non-demo row with rank NULL) sorted differently between two loads of the same page. Likely an unstable sort with NULL ranks. Worth a look in Stage 1.

- Files changed in the repo: BUILD-LOG.md, `supabase/migrations/20240602200000_create_missing_phase4_tables.sql`. Database: created `login_events` + `reports` with RLS, back-filled 32 login events, rescaled 52 demo `quiz_score` values.

- Next step: **Stage 1** — workbook activity metrics (the differentiator, still absent from every admin view), per-student quiz performance, "needs attention" with reasons, plus the `averageQuizScore` denominator fix and the roster sort.

---

=== LOG UPDATED: 2026-08-31 (America/Detroit) — STAGE 1 SCOPED. Demo workbook answers seeded. CURSOR-PROMPT-S1 drafted ===

- **TABLE TRAP FOUND BEFORE BUILDING — there are two exercise tables.**
  · `exercise_answers` — **LIVE**. Pass 2 living workbook. `user_id`/`module_id`/`exercise_key`, `answer` jsonb `{values:{}}`, `is_public`, `updated_at`. Written by `app/actions/exercise-answers.ts`.
  · `exercise_responses` — **LEGACY**, flat `response` text, keyed `student_id`, written only by `app/api/create-user/route.ts`, **0 rows**.
  Pointing admin metrics at `exercise_responses` would have reported zeros forever with no error — the identical failure shape to `login_events` and `last_login`. Called out explicitly at the top of the S1 prompt.

- **Catalog shape:** 31 exercises across 14 modules, unevenly distributed (P8/P9/P10 have 1 each; P13 has 5). Input types: reflection ×10, fill_blank ×9, rewrite_pairs ×5, scorecard ×3, tier_map ×2, anchor_select ×1, star ×1. Denominator must be computed from `modules.exercises`, never hardcoded — and per-module percentages will read noisily where a module has a single exercise.

- **Key reuse decision:** "answered" must go through the existing `isAnswerEmpty()` in `lib/exercise-answers.ts`, which already encodes per-input-type rules (anchor pairs, rewrite pairs, fill_blank blank-key derivation, scorecard score/notes). A row existing ≠ a row having content — that exact distinction caused the Pass 2 save bugs. Reimplementing it would reintroduce them in the reporting layer.

- **GATE — Oscar's two decisions:**
  1. **Answer privacy: COUNTS ONLY.** Admins see counts and recency, never answer text — not even `is_public` answers, not even for super_admin. The workbook holds identity anchors, confidence, purpose, career doubts; students wrote it for themselves and their own profile, not for their institution. Recorded in the prompt as a one-way door: counts can be loosened later, exposed reflection cannot be un-seen. RLS on `exercise_answers` must NOT be widened — a count-only path (SECURITY DEFINER aggregate or a view excluding `answer`) instead.
  2. **Metric shape: DEPTH + RECENCY** — "24 of 31 exercises · last activity 2 days ago", not a bare percentage. A student at 80% who stopped three weeks ago and one at 80% who wrote yesterday are different situations and the report must distinguish them.

- **SEEDED 102 `exercise_answers` rows** across the 8 demo students, built per input_type so they register as non-empty under `isAnswerEmpty()` (fill_blank uses the derived `${exerciseKey}_blank_${i}` keys; scorecards get `_score`/`_notes`; anchor and rewrite pairs get all field keys). Spread: Avery 31/31, Blake 26/31, Casey 19/31, Devon 9/31, Emerson 6/31, Frankie 3/31, Gray 1/31, Harper 0. 27 marked `is_public` so portfolio-sharing behaviour is visible. Activity dates staggered 3–24 days back so the recency half of the metric has something to show.

- **CURSOR-PROMPT-S1-workbook-metrics.md** drafted — seven items: (0) read the right table; (1) workbook metrics per student and cohort, incl. a zero-activity intervention list; (2) counts-only privacy with explicit RLS instruction; (3) `averageQuizScore` denominator fix — average only over students who have taken a quiz, return the denominator, return `null` not `0` for no-data, and add a comment noting that `overallCompletionRate` including everyone is deliberate and different; (4) per-student quiz display with a `QUIZ_SCORE_IS_RAW_COUNT` comment at the read site; (5) needs-attention reason chips in priority order, with attendance explicitly excluded as a reason; (6) cohort attendance summary presented beside — not blended into — completion, since Casey (71%/0-of-5) and Gray (7%/5-of-5) are deliberately uncorrelated; (7) roster sort stability with a total ordering.

- Files changed in the repo: BUILD-LOG.md, CURSOR-PROMPT-S1-workbook-metrics.md. Database: 102 `exercise_answers` rows seeded. No application code touched.

- Still uncommitted from earlier passes: `20240602000000_profiles_last_login.sql`, `20240602100000_fix_module_order_index.sql`, `20240602200000_create_missing_phase4_tables.sql`.

- Next step: Oscar runs S1 in Cursor, builds, commits; then verify live and move to Stage 2 (push plumbing — deliberate snapshot generation, diffing, report artifact with the pluggable CAPRI section).

---

=== LOG UPDATED: 2026-08-31 (America/Detroit) — S1 SHIPPED (c274c1f) AND VERIFIED LIVE. The living workbook is now visible to admin. Two seed defects of mine found and repaired ===

- Deployment `dpl_EZU96wK6VJxs5nfBj1FvWAichqjp`, commit **c274c1f**, production, READY. Verified on `/admin/ffc653d3-…/dashboard` (cache-buster required again — Chrome served the S0 page twice before I got a true read; same trap as last pass, checked rather than concluded).

- **VERIFIED LIVE:**
  · `Avg quiz score 80% · 7 of 9 students` — the 63% understatement is fixed and the denominator is shown.
  · `Avg workbook completion 37%` and a zero-activity count — the differentiator is finally on an admin surface.
  · Live-session attendance broken out per session (LS1 44%, LS2 44%, LS3 56%, LS4 44%, LS5 44%) under an explicit "Attendance is tracked separately from module completion" caption — kept beside completion, not blended, as specified.
  · Attention chips carry real reasons: Harper shows *No workbook activity · Inactive 43 days · Behind pace · Diagnostic incomplete*; Gray shows *Inactive 30 days · Behind pace · Diagnostic incomplete*. Attendance correctly absent as a reason.
  · Roster gained Workbook and Live-session columns, rendering depth + recency ("19 of 31 exercises · last activity 9 days ago") and "No workbook activity" for Harper.
  · **No answer text anywhere.** Approach: service-role client, institution-scoped, `answer` JSON read server-side only to run `isAnswerEmpty()`; counts and `updated_at` alone reach the UI. No RLS widening, no migration. Route guard verified — `requireRole(["institutional_admin","super_admin"])` plus an explicit `profile.institution_id !== institutionId` check, and the service-role query is scoped to `studentIds` that came from the RLS-respecting profiles query. Sound.

- **MY SEED DEFECT #1 — fill_blank key derivation.** Cursor reported Avery at 26/31 and attributed it to `isAnswerEmpty()` excluding empty rows. Half right: the rows had content, but under the **wrong keys**. `fillBlankValueKeys()` only uses derived `${exerciseKey}_blank_${i}` keys when the template actually contains `___`; otherwise it falls back to field keys. **Five fill_blank exercises have no blanks in their template** (P6 `clean_update_drill`, P7 `build_your_tmay_draft`, P7 `handling_silence`, P13 `direction_statement`, P14 `value_follow_up_script_draft`) — they are multi-field forms wearing a fill_blank label. My seed always wrote blank keys, so those 15 rows read as unanswered. Repaired to field keys; Avery now correctly reads 31/31 and the ladder is 31/26/19/9/6/3/1/none.

- **MY SEED DEFECT #2 — trigger clobbered recency.** The repair above fired `set_exercise_answers_updated_at`, resetting four students to "last activity today" and flattening the recency half of the metric I had just argued for. Restored the intended stagger (3/6/9/12/15/18/21 days) with the trigger briefly disabled. Worth remembering: **any UPDATE on `exercise_answers` rewrites `updated_at`**, so recency cannot be back-dated through a normal update.

- **Not a bug — Test Student's 7 workbook answers are real**, entered by Oscar in July/August testing. A genuine human-entered set passing `isAnswerEmpty()` alongside the synthetic ones is a useful independent check on the metric. (The earlier "1 row" reading from `list_tables` was a stale `reltuples` estimate, not a count.)

- **Fixed directly (one-line):** the zero-activity card read "1 students". Now singular/plural correct in `app/(protected)/admin/[institution-id]/dashboard/page.tsx`. Needs Oscar to build + commit with the next batch.

- Files changed in the repo: BUILD-LOG.md, dashboard page (pluralization). Database: 15 `exercise_answers` rows repaired to field keys, `updated_at` restored across the demo cohort.

- Still uncommitted: the three migration files from earlier passes plus this pluralization fix.

- Next step: **Stage 2 — push plumbing.** Make snapshot generation deliberate rather than a page-load side effect (`maybeGenerateReportSnapshot` currently fires on dashboard render), add snapshot diffing for "since last report" deltas, and build the report artifact with a pluggable CAPRI section. The `reports` table now exists and is empty, so the schema is ready.

---

=== LOG UPDATED: 2026-08-31 (America/Detroit) — STAGE 2 HELD. S1.5 inserted after Oscar's review found four issues, two of them correctness. CURSOR-PROMPT-S1.5 drafted ===

- Oscar reviewed the live dashboard and raised four concerns. Investigated each against the code and database; **two are presentation, two are correctness, and one directly changes Stage 2's design.** Stage 2 is held until these land — snapshotting a misleading metric only preserves it.

- **(1) The module completion donut is mathematically broken, not merely ugly.** Three independent defects: the `colors` array holds **8 entries cycling across 14 modules**, so P1/P9, P2/P10, P3/P11, P4/P12, P5/P13 and P6/P14 render in identical colors with no legend; and the geometry is invalid — `strokeDasharray` uses each module's completion rate as arc length with a cumulative `offset`, so the 14 rates (summing to ~574) wrap a 100-unit ring five times and overpaint. A module at 78% draws an arc covering 78% of the whole circle by itself. **A donut is the wrong chart type in principle here** — module completion rates are independent percentages, not parts of a whole. Replacing with an ordered, labeled bar list; keeping the click-to-expand interaction, which Oscar explicitly likes.

- **(2) Attention lists are a hardcoded `slice(0, 5)`** with no expansion, and the S1 reason chips are display-only. Oscar went looking for a way to see everyone with an incomplete diagnostic and correctly could not find one. Making chips clickable filters with per-reason counts.

- **(3) No diagnostic reporting exists.** `diagnostic_responses` has **0 rows**; questions live in `app/actions/onboarding.ts`; `profiles.diagnostic_complete` is the only signal. This is the Week-1 baseline — without it there is no before/after story for institutions later, and it is adjacent to CAPRI. Adding completion reporting only; individual answers stay private under the same rule as the workbook.

- **(4) Live-session attendance — Oscar's instinct was right, but the mechanism does exist.** `components/modules/live-session-attendance.tsx` renders a **"Mark attendance (+50 XP)"** button: attendance is **student self-reported AND rewarded with XP**, so a student can claim it without attending. That is not credible evidence to hand an institution, and it is a metric already promised as a deliverable (R4). All five `stream_url`s are `https://www.youtube.com/live_placeholder`. **The 44–56% rates now on the dashboard are entirely my seed data — no real attendance exists.**
  · **Oscar's decision: keep self-report, add an admin override.** New `attendance_source` column distinguishing `self_reported` from `admin_confirmed`, admin wins, and all reporting must state the source — never present self-reported attendance as verified.

- **(5) Module completion means ONLY "quiz passed".** `moduleCompletionPrerequisitesMet()` computes `videoOk = !VIDEO_GATE_ENABLED || video_watched`, and **both gates in `lib/module-gates.ts` are `false`**. Video watching and workbook exercises are recorded but required by nothing. A buyer reading "50% complete" would reasonably assume the work was done; it means half the quizzes were passed.
  · **Oscar's decision: leave the gates off, report the components separately** — quiz, workbook and video shown side by side rather than blended into one figure. `completionPercent` stays for pace math but gets relabelled in the UI.

- **(6) Video reporting is a false green.** All 14 modules share ONE placeholder URL (`youtube.com/watch?v=Z7dXDfqy0e8`), and `getModuleContentStatus` only checks `video_url` non-null — so `/superadmin/content` shows `Video: ✓` for all 14. Treating duplicate/placeholder URLs as not-real, with a content-readiness banner.

- **DIRECT IMPACT ON STAGE 2 — answering Oscar's question about uploading videos.** Flipping `VIDEO_GATE_ENABLED` to `true` changes the *definition* of "complete" mid-programme. Existing `is_complete` rows stay true, so before/after figures stop being comparable and Stage 2's "since last report" deltas would show movement that never happened. S1.5 therefore adds a `COMPLETION_DEFINITION_VERSION` constant that changes when either gate changes, and **Stage 2 must store it in every snapshot.** Without that, the first video upload silently corrupts the delta story for every institution.

- **CURSOR-PROMPT-S1.5-usable-reporting.md** drafted covering all six items, plus a reminder to include the pluralization fix and the three still-uncommitted migration files.

- Files changed in the repo: BUILD-LOG.md, CURSOR-PROMPT-S1.5-usable-reporting.md.

- Next step: Oscar runs S1.5, then Stage 2 with the completion-definition versioning baked in from the start.

---

=== LOG UPDATED: 2026-08-31 (America/Detroit) — S1.5 SHIPPED (8a6e5b6) AND VERIFIED LIVE. attendance_source migration applied. One redundancy to clean up ===

- Deployment `dpl_2ZY1cMLGQ1MDeCB3db8TNw6dF8NC`, commit **8a6e5b6**, production, READY. 20 files changed.

- **MIGRATION APPLIED BY ME** via Supabase MCP: `student_progress_attendance_source` (Cursor had no CLI or DB URL). Adds `attendance_source` with a CHECK constraint (`self_reported` | `admin_confirmed` | NULL) and `attendance_confirmed_by` FK to profiles. Backfill verified: **21 live-session rows → `self_reported`, 72 content-module rows → NULL**, exactly as intended — the column applies only to live sessions. `20240602200000_create_missing_phase4_tables.sql` was already applied earlier and is idempotent.

- **VERIFIED LIVE — all six S1.5 items:**
  · Donut gone. Module completion is a curriculum-ordered bar list (P1…P10, P14, P13, P11, P12) with "click a row to expand". Readable for the first time.
  · `Modules passed (avg) 41%` replaces the blended "Overall completion", with the explainer *"A module counts as complete when its quiz is passed"* on the health block and again above the roster.
  · **Week-1 diagnostic section** — "7 of 9 students completed", the two who have not, days enrolled, and an explicit caption that individual answers are not shown to admins.
  · Attendance reads *"4 of 9 attended · 4 self-reported"* with *"Self-reported attendance is shown separately and is not verified"*, plus per-session **Manage attendance** links. `/admin/{id}/attendance` renders the session list correctly.
  · Reason chips are now counted filters — `No workbook activity (1) · Inactive (5) · Behind pace (7) · Diagnostic incomplete (2)` — and the 5-item cap is replaced by "Show all 7".
  · `/superadmin/content` placeholder-video honesty shipped.
  · `COMPLETION_DEFINITION_VERSION = "quiz-only"` exported — **Stage 2 must stamp this into every snapshot.**
  · The "1 students" pluralization fix landed.

- **FOUND — redundant columns.** The roster now shows **"Modules passed" and "Quiz" as separate columns holding identical values** (14 of 14 / 14 of 14, 12/12, 10/10 …). That is unavoidable while both gates are off, because completion IS quiz-passed — the two columns are the same measurement by definition. It reads as noise and widens the roster for no information. Options: collapse to one column until the definitions diverge, or keep both with a note that they will separate when a gate flips. **Not urgent; fold into the next pass.**

- Also noted: the roster has no Video column (video appears only on student detail as "not yet tracked"). Correct behaviour while every module uses the placeholder URL, but worth confirming it reappears when real videos land.

- Files changed in the repo: BUILD-LOG.md. Database: `attendance_source` + `attendance_confirmed_by` columns added, 21 rows backfilled.

- **Reporting is now honest.** Every number on the admin surface either states its definition, states its source, or states that it is not tracked. That was the precondition for Stage 2 — a snapshot of a misleading number just preserves the misleading number.

- Next step: **Stage 2 — push plumbing.** (1) Make snapshot generation deliberate — `maybeGenerateReportSnapshot` still fires as a side effect of dashboard render, which is an unreliable trigger for scheduled reporting. (2) Snapshot diffing for "since last report" deltas, keyed on `COMPLETION_DEFINITION_VERSION` so a definition change can never masquerade as progress. (3) The report artifact itself, with the pluggable CAPRI section. The `reports` table exists and is empty.

---

=== LOG UPDATED: 2026-09-05 (America/Detroit) — STAGE 2 HELD AGAIN. Oscar's question about quiz/completion divergence exposed that there is NO QUIZ PASS THRESHOLD. S1.6 scoped ===

- Oscar reasoned that quiz and "modules passed" are identical today but must diverge once video lands, and asked why the living workbook does not contribute to completion. Investigating both questions surfaced a defect neither of us had named.

- **FINDING — submitting a quiz IS passing a quiz.** `app/actions/module-progress.ts` → `submitQuiz` computes `score`, then sets `quiz_completed: true` **unconditionally**; `moduleCompletionPrerequisitesMet()` checks only that boolean and never looks at the score. **There is no pass threshold anywhere in the codebase.** Verified in data: three module rows scored **2 of 4 (50%)** and all three are `is_complete = true`. Oscar's stated intent ("we don't want to pass anybody who doesn't get all questions right") was not partially implemented — the opposite was true.
  · The underlying conflation: "quiz" names two different things — `quiz_completed` (binary: submitted) and `quiz_score` (quality: how many right). Completion consumed the binary and discarded the quality.

- **FINDING — the workbook gate exists and is simply switched off.** `markExercisesReadyForQuiz()` already bridges the living workbook to `student_progress.exercises_submitted`; `EXERCISE_SUBMIT_GATE_ENABLED = false` is all that stands between the workbook and completion. So including it is a config decision, not a build.
  · **But the bridge is weak in the same way three earlier bugs were:** it verifies only that a **row exists** per exercise key, not that the answer is non-empty. Blank saves would satisfy it. Worse, S1 reporting uses `isAnswerEmpty()`, so gate and report would disagree — the roster could show "3 of 31 exercises" beside a module marked complete. Fixed in S1.6 by pointing the gate at the same function.

- **FINDING — an impossible quiz score is already in the data.** Demo Student / P1 holds `quiz_score = 5` on a module that now has **4** questions, seeded 2026-05-26 by `app/api/create-user/route.ts` before Q1 canonized every quiz to 4. It computes to **125%**. Contained to the Demo Preview institution so Demo University's figures are unaffected, but it demonstrates that the quiz denominator has already silently changed once — the same class of defect as the completion definition.

- **GATE — Oscar's decisions:**
  1. **Quiz passing threshold 75%** (3 of 4), retakes allowed. Chosen over 100%-mastery after I flagged the hidden cost: enforcing 100% with unlimited retakes drives every score to 100%, which **destroys "average quiz score" as an outcome metric** — you would have to report attempts-to-mastery instead. A 75% threshold keeps scores varying and therefore keeps the metric reportable, while still preventing anyone passing on 1 of 4.
  2. **Module complete = all workbook exercises answered + quiz passed.** Enable the exercise gate **now**; leave the video gate off until real videos exist, then change the definition a second time.
  · Consequence accepted: **two definition breaks rather than one.** `COMPLETION_DEFINITION_VERSION` exists to record both — `quiz-only` → `workbook+quiz75` → a third value when videos land. Timing note: there is no live cohort yet, so this is the last moment the change is cheap.

- **Explicitly NOT doing: no retroactive revocation.** Existing `is_complete` rows stay complete, including the three that passed at 50%. Revoking a completion a student earned under the old rule is wrong and would corrupt historical reporting; the definition version is what explains the discontinuity instead.

- **CURSOR-PROMPT-S1.6-completion-definition.md** drafted: threshold + retakes, exercise gate on with `isAnswerEmpty()`, version bump with documented history, no revocation, clamp/log impossible percentages and fix the hardcoded score in `create-user`, student-facing copy that guides rather than blocks, and reporting follow-through (the "complete when its quiz is passed" explainer becomes wrong and must be updated).

- Also queued for after S1.6 lands: **I need to re-align the Demo University fixtures** — the three sub-threshold completions would misrepresent the new rule in any demo or screenshot.

- Files changed in the repo: BUILD-LOG.md, CURSOR-PROMPT-S1.6-completion-definition.md.

- Next step: Oscar runs S1.6; I re-align demo fixtures; then Stage 2 with `COMPLETION_DEFINITION_VERSION` stamped into every snapshot from the first one.

---

=== LOG UPDATED: 2026-09-05 (America/Detroit) — S1.6 SHIPPED (05a5fdd). Demo fixtures realigned to the new definition and re-anchored to today ===

- Commit **05a5fdd**, 11 files. Cursor's explicit decisions: retakes keep the **latest** score (not best-of), video gate still `false`, no `is_complete` revoked, and no new column — `quiz_score` records every attempt while `quiz_completed` now means **passed**.

- **VERIFIED LIVE.** The explainer now reads *"A module counts as complete when every workbook exercise is answered and the quiz is scored at or above 75%"* — on the cohort-health block and again above the roster. `COMPLETION_DEFINITION_VERSION = "workbook+quiz75"`.

- **FIXTURE REALIGNMENT — three parts, all mine to fix, none of them app defects.**
  1. **Sub-threshold completions.** Three demo rows sat at 2 of 4 and were marked complete under the old rule. Raised to 3. These are fixtures, not student history — the no-retroactive-revocation rule protects real completions, not demo props that would misrepresent the current rule in a screenshot.
  2. **Completed modules with unanswered exercises.** My original seed answered a *subset* of exercises per student, so Devon had 7 modules "complete" while 9 of 31 exercises were blank — impossible under the new definition and exactly the inconsistency S1.6's acceptance criteria forbid. Rebuilt the fixtures on the correct model: **every exercise of every completed module, plus partial work on the one in-progress module.** New ladder 31 / 27 / 20 / 17 / 12 / 7 / 3 / 0, avg workbook 37% → **45%**. Verified with a query: **0 unanswered exercises inside any completed module.**
  3. **Time decay.** Weekly engagement had fallen to 11% and eight of nine students read as "Inactive" — not a bug, just fixtures aging seven days since seeding. Re-anchored `last_login`, `last_active_date`, `login_events` and `exercise_answers` timestamps to today, restoring the intended 0/1/2/5/9/16/27/40-day ladder.

- **Standing issue worth naming: demo fixtures rot.** Every day that passes makes Demo University look more abandoned, because recency is stored, not computed. Before any real sales demo the fixtures need re-anchoring — this should become a small seed script (`seed:demo-cohort`) rather than ad-hoc SQL, otherwise Oscar will one day open the demo in front of a buyer and find a dead cohort.

- Note on the duplicated "Modules passed" / "Quiz" columns: they remain identical **only because no fixture student has failed a quiz**. Under the new rule they genuinely can diverge (quiz passed but exercises incomplete). Worth seeding one such student so the distinction is demonstrable.

- Files changed in the repo: BUILD-LOG.md. Database: 3 quiz scores raised, 117 `exercise_answers` rebuilt, 32 `login_events` rebuilt, profile recency re-anchored.

- Next step: **Stage 2 — push plumbing**, with `COMPLETION_DEFINITION_VERSION` stamped into the very first snapshot. (1) Deliberate snapshot generation instead of the dashboard-render side effect. (2) Diffing for "since last report", refusing to diff across definition versions. (3) The report artifact with the pluggable CAPRI section.

---

=== LOG UPDATED: 2026-09-05 (America/Detroit) — STAGE 2 SCOPED. Snapshot generation found to be duplicating and period-incoherent. Demo-decay problem solved without demo-only logic ===

- **INSPECTED `lib/reports.ts` BEFORE WRITING THE PROMPT — it is worse than "fires on render".** Confirmed against the live table:
  · **Five identical snapshots were written for Demo University on 2026-08-29**, minutes apart, by my own repeated dashboard loads during S0 verification. `maybeGenerateReportSnapshot` does a check-then-insert via `maybeSingle()` with **no database constraint**, so concurrent loads each passed the existence check.
  · **"Cadence" is only a start delay, not a period.** `daysSinceStart < cadenceWeeks * 7` blocks before week 4 and then passes forever, so after that every dashboard load on a new day writes a snapshot whose `period_end` is *whatever day someone opened the page*. Report periods were being determined by browsing behaviour. Rows exist with period_end 08-29, 08-31 and 09-05 for the same institution.
  · **Four unconditional silent `return`s** (no admin client, no institution, no cohort start, no analytics). A reporting pipeline that silently does nothing is the exact failure mode already hit three times — `last_login`, `login_events`, `exercise_responses`.
  · Snapshots stored the **raw** `currentWeek: 15` / `16`, i.e. the pre-S0 unclamped value. A report artifact would have said "Week 16 of 12".

- **APPLIED** (migration `reports_dedupe_and_unique_period`): deleted all 7 accidental rows — every one a page-load artifact, none real reporting history — and created unique index `reports_institution_period_end_idx` on `(institution_id, period_end)`. The guard that should have existed from the start now exists, so duplicates cannot accumulate while S2 is being built.

- **OSCAR'S DEMO-DECAY PROBLEM — solved without violating his constraint.** He noted the demo will always look abandoned, but explicitly did not want demo-specific code paths diverging from production. Resolution: **the fix is data, not logic.**
  1. `scripts/seed-demo-cohort.ts` (`npm run seed:demo`) rebuilds Demo University fixtures **relative to `now()`**, idempotent, scoped to `is_demo`, and refusing to run against any institution containing non-demo students. Optionally wired to the same cron so the demo never goes stale. The application reads the same columns the same way — nothing about runtime behaviour differs.
  2. The fixtures must satisfy the *current* completion definition (all exercises answered, quiz ≥ 3 of 4), and must include **one student who passed a quiz but has not finished their exercises**, so "Modules passed" and "Quiz" visibly diverge. They read identically today only because no fixture student occupies that state.

- **His second observation is a real product gap, not a demo problem.** *"It looks abandoned until it's actually used"* is equally true of a genuine cohort in week 1 — and the first report an institution receives should not read like a disaster. S2 therefore adds honest early states: pre-start shows "Cohort starts in N days" and flags nobody; weeks 1–2 do not mark anyone "behind pace" before there is anything to be behind on; zero-data metrics render "—" with "no data yet" rather than `0%` (the same zero-vs-absent rule S1 applied to `averageQuizScore`). This helps real institutions and fixes the demo's worst look as a side effect, with no demo-specific branching.

- **CURSOR-PROMPT-S2-push-plumbing.md** drafted, six sections, suggested as two commits: (0) the verified defects; (1) deliberate generation — remove the render-path call, add an explicit action plus a cron route secured with `timingSafeEqual`, and **derive period boundaries from `cohort_start_date` + cadence** so late generation still produces the correct period; (2) a versioned snapshot envelope carrying `snapshotVersion`, `completionDefinition`, `generatedAt`, `generatedBy` and the **clamped** `displayWeek`; (3) deltas that **refuse to render a completion comparison across differing `completionDefinition` values** — stated as a hard rule, not a warning beside a number, since that refusal is the whole purpose of the constant; (4) the report artifact with an absent-safe pluggable CAPRI section; (5) the demo seed script; (6) early-cohort states.

- Files changed in the repo: BUILD-LOG.md, CURSOR-PROMPT-S2-push-plumbing.md. Database: `reports` cleared, unique index added.

- Oscar to set `CRON_SECRET` in Vercel before the scheduled route goes live.

- Next step: Oscar runs S2. I verify snapshot generation, duplicate prevention, period boundaries and the cross-version delta refusal directly against the database.

---

=== LOG UPDATED: 2026-09-05 (America/Detroit) — S2 SHIPPED (bb19967 + b761fa0) AND VERIFIED END TO END. Reporting pipeline is real ===

- No migration needed; the unique index applied earlier is what provides idempotency (`23505` treated as already-exists).

- **VERIFIED — the dashboard no longer writes reporting history.** Loaded `/admin/…/dashboard` three times with distinct cache-busters; `reports` row count stayed at 0 before and after. This was the defect that produced five duplicate snapshots on 2026-08-29.

- **VERIFIED — cron route is properly closed.** `GET /api/cron/generate-snapshots` returns **401 `{"error":"Unauthorized"}`** with no header and with a wrong bearer token. `CRON_SECRET` still needs setting in Vercel before the Monday 12:00 UTC schedule goes live — **until then the cron will 401 every week silently**, so set it or the scheduled path is dead.

- **VERIFIED — period boundaries derive from cohort start, not from today.** Demo University (start 2026-05-23, 4-week cadence) produced exactly: P1 05-23→06-20, P2 06-20→07-18, P3 07-18→08-15. P4 (08-15→09-12) correctly not offered, since today is 09-05 and the period has not closed.

- **BETTER THAN SPECIFIED — generation backfills instead of duplicating.** I clicked Generate four times. It created P3, then P2, then P1 — walking back to fill missing periods — and on the fourth click, with every period present, it offered *"Period 3 already has a snapshot. Confirming will regenerate it in place"* rather than silently creating a duplicate or silently doing nothing. Three rows total, one per period. The prompt only asked for idempotency; gap-filling plus an explicit regenerate confirmation is a stronger answer.

- **VERIFIED — snapshot envelope.** `snapshotVersion: 1`, `completionDefinition: "workbook+quiz75"`, `generatedBy: "manual"`, `cohortSize: 9`, and `displayWeek: 12`. Note: `currentWeek` is also stored as 12 rather than the raw 15/16 — a small deviation from the prompt (raw is no longer recoverable), but correct for a report artifact and arguably better. Worth remembering only if we ever need to prove a cohort ran past its 12 weeks.

- **VERIFIED — the cross-version delta refusal actually fires.** This is the single most important rule in the pass and it could not be tested with real data, since all three snapshots share one definition. I temporarily rewrote the previous period's `completionDefinition` to `"quiz-only"` in the database and reloaded the later report. It rendered:
  · a banner — *"Completion definition changed — not comparable (quiz-only → workbook+quiz75)"*
  · and in place of the completion number — **"definition changed — not comparable"**, with **no figure at all**
  · while workbook, quiz, engagement and attendance deltas still rendered normally, exactly as scoped.
  **Tamper reverted immediately**; all three snapshots are back to `workbook+quiz75`. This is the guard that stops the first video upload from silently manufacturing progress.

- **VERIFIED — the report artifact.** Renders as a sendable page: header with period, week, cohort size, generation provenance and definition; participation and completion with its explainer; workbook depth; quiz performance with denominator and threshold stated; attendance per session with source labels and *"Self-reported attendance is never presented as verified"*; since-last-report deltas; students needing attention with reasons; **"Outcomes (CAPRI) — Not yet available"** via the pluggable provider; and a closing line stating counts-only and that attendance is separate from completion. No answer text anywhere.

- Database state: 3 report rows, one per closed period, all `workbook+quiz75`.

- **Open items:** set `CRON_SECRET` in Vercel · consider `SEED_DEMO_ON_CRON=true` so Demo University stops decaying · `npm run seed:demo` not yet exercised (worth running once before any buyer demo) · the three earlier migration files may still be uncommitted.

- Next step: with the reporting pipeline honest and working, the remaining roadmap is Oscar's **testing phase**, then pre-cohort blockers (Supabase paid plan, roll the service_role key), then front end and first cohort. CAPRI proceeds in its own thread and drops into the reserved outcomes section without generator changes.

---

=== LOG UPDATED: 2026-09-06 (America/Detroit) — CRON LIVE AND VERIFIED. CRON_SECRET rotated after accidental exposure ===

- **SECURITY — credential exposed and rotated.** While testing the endpoint from the terminal, the `read -rs` idiom I suggested did not capture the value as intended (a leading `#` made zsh treat the line as a comment), so the secret was echoed to the terminal and pasted into the session in plaintext. Flagged immediately; Oscar generated a new secret, replaced it in Vercel, and redeployed. Severity was low — the endpoint only triggers snapshot generation and cannot read student data or alter content — but it was a credential and it was rotated.
  · **Lesson: do not route secrets through the shell when a UI path exists.** The correct method, used for the retest, is Vercel's own **Settings → Cron Jobs → Run** button: Vercel attaches the `Authorization: Bearer $CRON_SECRET` header itself, so the secret never touches the clipboard, the shell, or this session. It is also a truer test, exercising exactly the path the Monday schedule uses rather than a hand-built curl that resembles it.
  · Secondary lesson: `vercel crons` returned nothing because there is **no `.vercel/` directory** — the CLI was never linked to the project, since every deploy comes through the GitHub integration. Not a cron fault.

- **CRON VERIFIED WORKING.** Cron Jobs settings shows `/api/cron/generate-snapshots` · `0 12 * * 1` · *At 12:00 PM, only on Monday* · feature toggle Enabled. Manual Run produced three new rows stamped **`generatedBy: "cron"`** — proof the secret authenticated, since the route 401s without it.

- **The run also confirmed multi-institution behaviour.** It correctly skipped Demo University (all three closed periods already present, `generatedBy: "manual"`) and **backfilled Demo Preview**, which had never been generated: periods 05-21→06-18, 06-18→07-16, 07-16→08-13, `cohortSize: 1`. Six report rows total, no duplicates, every one `workbook+quiz75`. The cadence-derived period boundaries differ correctly between the two institutions because their cohort start dates differ (05-21 vs 05-23) — exactly the behaviour that was broken before S2, when `period_end` was whatever day someone happened to load a page.

- Note for later: Vercel Hobby applies a **1-hour flexible window** to scheduled times, stated on the Cron Jobs page. Irrelevant for weekly reporting.

- **Stage 2 is complete and the reporting pipeline is fully operational**: deliberate generation, cadence-anchored periods, backfill without duplication, versioned snapshots, cross-definition delta refusal, a sendable artifact, and a working schedule.

- Remaining open items: `npm run seed:demo` still unexercised (run once before any buyer demo) · consider `SEED_DEMO_ON_CRON=true` so Demo University stops decaying · three earlier migration files may still be uncommitted · Demo Preview now has report rows for a 1-student fixture institution, harmless but worth pruning before real institutions exist.

- Next step: Oscar's **testing phase**, then pre-cohort blockers (Supabase paid plan, roll the service_role key — now doubly warranted), then front end and first cohort.

---

=== LOG UPDATED: 2026-09-06 (America/Detroit) — seed:demo working. STAGE 3 SCOPED. Two blockers found: a privilege-escalation endpoint, and Supabase email that cannot reach students ===

- **`npm run seed:demo` verified.** The guard fired first and correctly refused: *"institution has non-demo students (Test Student)"*. Test Student is Oscar's real login (`student@test.com`, last sign-in 2026-07-06) with **7 genuine workbook answers** — marking it `is_demo` would have satisfied the guard and then let the seed overwrite the only real human-entered workbook data in the system. **Moved it to Demo Preview instead** (non-destructive, one-line reversal recorded in chat). Demo University is now purely the 8 fixtures.
  · Post-seed check: **Devon Park now reads Modules passed 6 · Quizzes passed 8** — the two columns visibly diverge for the first time, which was the missing fixture case from S2.

- **BLOCKER 1 (security) — `/api/create-user` is a privilege-escalation endpoint.** It accepts `role: "super_admin"`, takes a plaintext password, can **delete** any auth user via `recreate: true`, and compares `CREATE_USER_SECRET` with `===`. Anyone holding that one env var owns the platform. Given a secret leaked into a chat window the previous day, this is not theoretical. Oscar had no preference (fair — the question was too technical as I first put it), so **I made the call: strip `super_admin` from allowed roles, remove the delete path, use `timingSafeEqual`, and 404 in production unless `ALLOW_DEV_USER_API=true`.** It stays usable locally for test accounts.

- **BLOCKER 2 (launch) — Supabase's built-in email cannot deliver to students at all.** Checked their docs rather than assuming. Verbatim: *"Supabase Auth will refuse to deliver messages to addresses that are not part of the project's team… All other addresses will fail with the error message Email address not authorized."* Also *"not meant for production use"*, and invites are explicitly named as requiring custom SMTP.
  · **This is a hard rejection, not a rate limit** — every student invite would fail outright. It would have surfaced on cohort day one, as a roster of "pending" students who never received anything.
  · Fix is an account setup, not code: configure custom SMTP (Supabase names Resend, Postmark, AWS SES, SendGrid, Brevo). Custom SMTP then starts at **30 messages/hour**, adjustable under Authentication → Rate Limits — fine for 25 students, worth raising before a large cohort.
  · **Added to the pre-cohort blocker list alongside the paid plan and the service_role key roll.** S3's invite flow is buildable now but untestable until this is done, so the prompt requires the UI to name this specific cause when a send fails rather than showing a generic error.

- **GATE — Oscar's decisions:** student accounts via **email invites** (he never handles a password); **only Oscar** creates institutions and uploads rosters, since institutions do not log in under the push model and institution-facing tooling would have no user.

- **CURSOR-PROMPT-S3-roster-and-institutions.md** drafted: (0) the SMTP prerequisite stated as a blocker with explicit failure-message handling; (1) institution create/edit replacing the stale "Phase 5" scaffolding copy, with a warning when editing `cohort_start_date` on an institution that already has report rows — it moves every future report period; (2) CSV roster upload with a preview before sending, invites via `inviteUserByEmail` carrying `role`/`institution_id`/`full_name` for the **already-verified** `handle_new_user` trigger, and per-row send results where partial failure is never reported as success; (3) invite status derived from `auth.users.last_sign_in_at` rather than a maintained flag that would drift, with "not yet accepted" folded into the existing attention reasons; (4) a real cross-institution overview excluding demo students; (5) the create-user lockdown; (6) add-never-replace roster semantics and confirmation counts on every sending action.

- Hard rule carried into the prompt: **no code path may set, display, or email a student password.** Cursor must confirm this explicitly.

- Files changed in the repo: BUILD-LOG.md, CURSOR-PROMPT-S3-roster-and-institutions.md. Database: Test Student moved to Demo Preview; Demo University fixtures rebuilt by `seed:demo`.

- Next step: Oscar runs S3 while the CAPRI thread develops the instrument. Then testing phase → pre-cohort blockers (paid plan · service_role key · **custom SMTP**) → front end → first cohort.

---

=== LOG UPDATED: 2026-09-21 (America/Detroit) — 15-DAY GAP. Status check after inactivity. Supabase now PRO. S3 not yet run. Cron ran unattended and worked ===

- Oscar returned after ~2 weeks and re-pasted the **S2** Cursor summary, thinking it might be CAPRI-related. It is not — that message is from 2026-09-05, already shipped (`bb19967` + `b761fa0`) and verified end to end. Nothing in it is outstanding.

- **Supabase org is now `plan: "pro"`** (verified via API). This closes the auto-pause blocker — free projects pause after ~a week idle, which previously broke login and required a manual restore. A paused project under a live cohort would have locked every student out.
  · **It does NOT close the email blocker.** Custom SMTP is a separate configuration, not a plan feature. Invites still cannot reach students until an email provider is wired into Supabase Auth.

- **S3 has not been run.** No Vercel deployments since 2026-09-06; `CURSOR-PROMPT-S3-roster-and-institutions.md` is still waiting in the repo.

- **The cron worked unattended for two weeks — first real proof of the S2 pipeline.** It fired Monday 2026-09-07 and generated two Demo University periods (07-12→08-09, 08-09→09-06), both stamped `generatedBy: "cron"`. It correctly did **nothing** on 09-14 and 09-21, because the next period does not close until 10-04. Silence was the right answer and the system produced it without supervision.

- **`seed:demo` moved `cohort_start_date` from 2026-05-23 to 2026-07-12** — by design, since it re-anchors the demo cohort to now. Demo University now reads **week 11 of 12** instead of "week 16 · program complete", which is a far better state to show a buyer.
  · **Side effect worth recording:** the three original manual snapshots sit on the old 05-23 period grid, so `reports` now holds **two mismatched period grids for one institution**. Harmless for fixtures. In production it would be a real problem — and it is exactly the hazard the S3 prompt already warns about when editing `cohort_start_date` on an institution that has report rows. The demo has now demonstrated it. Worth considering whether `seed:demo` should also clear that institution's stale reports.

- **Demo fixtures have decayed again**: 0 of 8 students active in the last 7 days, inactivity spanning 15–55 days. One `npm run seed:demo` fixes it. This is the recurring cost of stored-not-computed recency, as logged on 2026-09-05.

- Current blocker list for first cohort: ~~Supabase paid plan~~ (done) · **custom SMTP** (blocks S3 invite testing) · **roll the service_role key** · three earlier migration files possibly still uncommitted.

- Next step: `npm run seed:demo` → configure custom SMTP → run S3 in Cursor. CAPRI continues in its own thread.

---

=== LOG UPDATED: 2026-09-23 (America/Detroit) — CUSTOM SMTP CONFIGURED. Email blocker closed. S3 part B shipped ===

- **DNS finding that redirected the whole setup.** Oscar assumed DNS lived in Squarespace; I queried the live zone and found nameservers `ns-cloud-c1..c4.googledomains.com`. Both turned out to be true — Squarespace acquired Google Domains and kept the Google nameservers for migrated domains, so the records resolve via Google while the editing UI is Squarespace. My initial instruction to use `admin.google.com` was wrong and Oscar corrected it.

- **Subdomain choice paid off.** Root `corpacad.com` carries exactly one SPF record, `v=spf1 include:_spf.google.com ~all`, for Google Workspace. Because sending was scoped to `mail.corpacad.com`, Resend's records landed on the subdomain and **root SPF and MX were never touched** — Workspace mail is unaffected. Had the root domain been used, Resend would have had to be *merged* into that single SPF line; adding a second SPF record silently breaks real email. The subdomain avoided the trap entirely.

- **Corrected Resend's own instruction.** Resend supplied the DMARC record as `_dmarc`, which resolves to `_dmarc.corpacad.com` — the **root** domain — applying a DMARC policy to all Google Workspace mail. Checked first: no DMARC record existed, so nothing would have broken (`p=none` is monitor-only), but it was out of scope for what Oscar was doing. Changed to `_dmarc.mail`, which receivers check first for subdomain mail.

- **All four records verified independently against public DNS before Resend confirmed**, ruling out the classic Squarespace failure where the console appends the domain and produces `…corpacad.com.corpacad.com`:
  · `resend._domainkey.mail` TXT — DKIM value matches exactly
  · `send.mail` CNAME → `send.forge.rmta.net`
  · `rsend.mail` CNAME → `rsend.forge.rmta.net` (the `rsend`/`send` pair looks like a typo and is not)
  · `_dmarc.mail` TXT → `v=DMARC1; p=none;`

- **Supabase custom SMTP configured** (`smtp.resend.com`:465, user `resend`, sender `noreply@mail.corpacad.com`). **This closes the blocker that would have surfaced on cohort day one** — the built-in service refuses every address outside the project team, so all student invites would have failed silently.

- **S3 part B shipped**: commit `cc32c16` — cross-institution overview on `/superadmin` excluding demo students, and the `/api/create-user` lockdown (no super_admin creation, no user deletion, `timingSafeEqual`, 404 in production unless explicitly enabled). The privilege-escalation endpoint is closed.

- **Pre-cohort blocker list now:** ~~Supabase paid plan~~ · ~~custom SMTP~~ · **roll the service_role key** (outstanding) · confirm the three earlier migration files are committed · **SMTP delivery still untested end to end**.

- Next step: send one real invite to a non-team address to prove delivery, then finish S3 (roster upload + invites) and move into the testing phase.

---

=== LOG UPDATED: 2026-09-23 (America/Detroit) — INVITE FAILURE ROOT-CAUSED (one-word typo). CAPRI schema landed from the parallel thread — context re-synced ===

- **Invite failure diagnosed from Supabase auth logs, not guesswork.** Error: `550 "The email.corpacad.com domain is not verified."` The Supabase **Sender email** had been entered against `email.corpacad.com`; the verified Resend domain is `mail.corpacad.com`. One word. Everything else was correct — the SMTP connection authenticated, proving host, port, username and API key are all good. Fix is a single field.
  · Logs also confirm the rate-limit change took effect: `GOTRUE_RATE_LIMIT_EMAIL_SENT ... from 2/1h to 30`.
  · **Two auth users were created anyway** (`oscarshulu@gmail.com`, `oscarthegreat99@gmail.com`) — Supabase creates the user first and sends second, so a send failure does not roll back the user. Retrying the same address will collide. Cleanup offered.

- **CONTEXT RE-SYNC — the CAPRI thread has been building in the same database.** I no longer assume I know the schema; surveyed it directly.
  · **Six new tables**, all RLS-enabled: `capri_instruments`, `capri_items`, `capri_administrations`, `capri_responses`, `capri_answers`, `capri_scores`.
  · Instrument **v2.0 active, 33 items**. Structure: 3 pillars × 3 sub-dimensions (1A–3C) × 3 likert5 items = 27 **core**, plus 2 `frequency_band` **behavioral** items per pillar = 6. Behavioral items use a banded stem ("Thinking about the last 30 days only —") with buckets 0 / 1–2 / 3–5 / 6–10 / 11+ — deliberately banded to blunt the incentive to inflate a precise number.
  · **Design decisions visible in the schema that match the kickoff brief's warnings**: item IDs are permanent (rewording means a new id under a new instrument version, never an in-place edit) and Week 1 answers freeze on submit — both guard longitudinal comparability, the same class of protection as `COMPLETION_DEFINITION_VERSION` on the LMS side.
  · The Week 12 **retrospective** lives on the Week 12 response as rows with `rating_context = 'retrospective'`, which is how response-shift bias gets handled — the exact confound flagged in `CAPRI-THREAD-KICKOFF.md`.

- **The CAPRI seam I reserved in S2 has been filled.** `lib/capri/outcomes-provider.ts` implements the `CapriOutcomesProvider` interface from `lib/capri-outcomes.ts` — no change to the report generator was required, which is what the pluggable design was for.
  · It runs under the **service role deliberately**, because institutional admins cannot read individual scores; cohort aggregation happens server-side and nothing student-identifiable leaves the function. Same pattern as `exercise_answers` in S1.
  · **It withholds claims below a minimum pair count** (`MIN_N_COHORT_CLAIM`) and reports participation only — a small-n guard that matches the kickoff brief's caution about small cohorts.
  · Outputs are carefully hedged: raw gain, **gain index** (headroom closed), **adjusted gain** (response-shift corrected), **calibration gap** with an explicit verdict including *"inconclusive — behaviour did not move with it"*, behavioural evidence change, band migration, and material improvement. The headline leads with **measured behaviour** where available and only then self-assessed readiness — the distinction I pushed for in the kickoff brief.

- **Also shipped from that thread:** `app/(protected)/capri/[administration]/page.tsx`, `components/capri/capri-assessment.tsx`, `app/actions/capri.ts`, `lib/capri/scoring.ts` + tests, and changes to the onboarding/diagnostic path — suggesting the CAPRI-vs-onboarding-diagnostic question from the kickoff brief has been resolved in favour of CAPRI.

- **Current data state:** `capri_instruments` 1 · `capri_items` 33 · `capri_administrations` 0 · `capri_responses` 0 · `capri_answers` 0 · `capri_scores` 0. **The instrument exists; no one has taken it.** So the report's CAPRI section still renders its absent-safe path, and no snapshot yet carries CAPRI data.

- Next step: fix the Sender email field, prove delivery, then decide whether Demo University needs CAPRI fixtures so the outcomes section can be seen working before a real cohort.

---

=== LOG UPDATED: 2026-09-23 (America/Detroit) — CAPRI fixtures seeded. Two blockers found: CAPRI commit undeployed, and a reporting contradiction on the invite-status chip ===

- **Sender-email fix confirmed working.** Auth log error moved from `email.corpacad.com` to `mail.corpacad.com`, proving Supabase now sends as the right domain. Remaining failure is purely Resend's side: `550 "The mail.corpacad.com domain is not verified"`. DNS re-checked and still correct (`send.mail` → `send.forge.rmta.net`), so the domain simply has not been marked Verified in Resend yet.

- **CAPRI FIXTURES SEEDED for Demo University**, computed to match `lib/capri/scoring.ts` exactly rather than invented: `likertMeanToScore = ((mean-1)/4)*100`, `bandMeanToScore = (mean/4)*100`, sub-dimension = mean of its 3 items, pillar = mean of its 9 core items, composite = mean of the 3 pillar scores.
  · 2 administrations (baseline, post) · 16 responses · **792 answers** (528 current, 264 retrospective) · **336 scores** across subdimension/pillar/composite/bei.
  · Gains deliberately correlate with engagement: Avery 41.7 → 83.3, Casey 50.0 → 83.3, Gray 41.7 → 50.0, **Harper 41.7 → 41.7 (no movement)**.
  · **Retrospective is rated below the original baseline for every student** (e.g. Avery 41.7 → retro 33.3), which is the response-shift pattern the instrument exists to detect — so the calibration-gap path has data to exercise.

- **KNIFE-EDGE FOUND: `MIN_N_COHORT_CLAIM = 8` and Demo University has exactly 8 students.** All outcome claims are withheld below 8 paired responses, so **a single student missing their Week 12 post suppresses the entire outcomes section.** Acceptable for a 24-person cohort; a genuine product constraint for a small honors or Greek cohort of 10–12, where two non-responders silently erase the outcome story. Worth deciding whether the floor should scale with cohort size or whether small cohorts get a differently-worded section rather than nothing.

- **BLOCKER — the CAPRI commit is not deployed.** Local HEAD is `26a9cdf` (*"native CAPRI v2 readiness instrument replaces entry diagnostic"* — which also answers the kickoff brief's first question: CAPRI **replaces** the onboarding diagnostic). The live Vercel deployment is still `cc32c16`. The provider wiring exists in `app/(protected)/admin/[institution-id]/reports/[report-id]/page.tsx` (`setCapriOutcomesProvider(capriOutcomesProvider)`), but that file is not on the deployed build — which is why the report still renders **"Outcomes (CAPRI) — Not yet available"** despite the data now existing. Needs a push/deploy.

- **BUG FOUND — the report contradicts itself on invite status.** Every student showed *"Invite not accepted after 129 days"*, including **Demo Avery Chen with 14 of 14 modules passed and 31 of 31 workbook exercises**. Cause: S3 derives acceptance from `auth.users.last_sign_in_at`, and the demo auth users were created by SQL and had never signed in.
  · Fixture side repaired: `last_sign_in_at` set to each student's recorded `last_login`.
  · **But the logic flaw is real and stays.** "Invite not accepted" should be suppressed when there is any evidence of activity — progress rows, workbook answers, XP. A report that says a student never logged in *directly above* their completed coursework destroys confidence in every other number on the page. Flagging for the next pass rather than fixing blind, since S3 is Cursor's code.

- Next step: deploy `26a9cdf` so the CAPRI section renders, click Verify in Resend, then re-check the report end to end.

---

=== LOG UPDATED: 2026-09-24 (America/Detroit) — FULL STATE AUDIT after two parallel coworks and closed terminals. CAPRI commit was UN-COMMITTED; nothing lost ===

- Oscar reported two Cowork sessions running against one repo and some Cursor terminals closed mid-flight. Audited git, disk, deployment and database rather than assuming.

- **Resend domain `mail.corpacad.com` is now VERIFIED.** The SMTP chain should be complete; delivery still unproven end to end.

- **KEY FINDING — commit `26a9cdf` no longer exists.** Yesterday it was local HEAD ("native CAPRI v2 readiness instrument replaces entry diagnostic"). It has been un-committed, almost certainly a soft reset while the two sessions worked the same branch. **Nothing is lost:** every CAPRI file is present on disk and **staged**, now sitting on top of a different parent. It simply needs committing again.
  · Staged CAPRI work: `lib/capri/{scoring,queries,outcomes-provider,scoring.test}.ts`, `app/actions/capri.ts`, `app/(protected)/capri/[administration]/page.tsx`, `components/capri/capri-assessment.tsx`, two migrations, plus modifications to the report page, diagnostic page, onboarding, certificate and `types/database.ts`.
  · `components/diagnostic/diagnostic-form.tsx` is **staged for deletion** — consistent with CAPRI replacing the entry diagnostic.

- **New unpushed commit from the other session: `d273f52` "feat(reporting): make every institutional metric self-explaining"** — 13 files, +643 lines. Touches the admin dashboard, report artifact, `cohort-analytics`, `admin-reporting`, `report-deltas`, cross-institution overview, and adds `lib/admin-reporting.test.ts` (+162) with a new `npm run test:reporting` script. Also adds **`docs/institutional-summary-prompt.md`** — a template for generating the written cover note that accompanies a report ("The report gives an institution the numbers. This gives them the meaning"), explicitly warning against vendor-metric puffery. That is the narrative layer the push model needs and it was not on my roadmap.

- **Branch state:** `origin/main` = `cc32c16`. Local = `d273f52`, **1 commit ahead, 0 behind**, plus the staged CAPRI set. So **two bodies of work are unpushed** — one committed, one staged.

- **Database is AHEAD of the repo, again.** Both new migrations have already been applied to production: `capri_v2_instrument` (verified earlier) and `reconcile_phase4_profile_columns` — all four columns (`program_completed_at`, `streak_milestones_awarded`, `earned_badges`, `last_active_week`) confirmed present. The second migration's own comment records the same drift class found on 2026-08-29: *"phase4_gamification_admin never landed in full on the live database… which makes /certificate 404 for every student."* That is a **third** independent discovery of the repo-vs-database migration drift, and it was breaking the certificate page for every student.

- **Risk to name plainly:** two sessions committing to one branch produced a vanished commit within a day. Not destructive this time, but the pattern will eventually lose work. Worth one of: separate branches per session, or a rule that only one session commits.

- Current state summary — **CAPRI instrument built and seeded, reporting narrative layer built, neither deployed.** Live site still runs `cc32c16`, which is why the report continues to show "Outcomes (CAPRI) — Not yet available".

- Next step: re-commit the staged CAPRI work, then push both commits; Vercel deploys on push. Then verify the CAPRI section renders and prove one invite delivers.

---

=== LOG UPDATED: 2026-09-24 (America/Detroit) — DEPLOYED. CAPRI outcomes render live. My "vanished commit" call was WRONG — correction recorded ===

- **CORRECTION to yesterday's entry.** I recorded that commit `26a9cdf` had been un-committed and lost. **That was wrong.** The two Cowork sessions had each created a *branch* — `feat/capri-v2-native` (26a9cdf) and `feat/reporting-clarity` — and I was reading one branch's history, so the other's commit was simply invisible from where I stood. Nothing was ever lost. Branch isolation was already in place, which is the practice I had been about to recommend.
  · This also explains `git push origin main` reporting *"Everything up-to-date"*: local `main` was still `cc32c16` and matched origin. The work was on `feat/reporting-clarity`, never pushed. Git was accurate; the wrong branch was being asked.
  · Resolved by fast-forwarding `main` and pushing. **Deployment `dpl_8KXRxEPk…`, commit `6e146a4`, production, READY.** Build passes with 19 routes including `/capri/[administration]`, `/superadmin/institutions/new`, and the attendance pages.

- **CAPRI OUTCOMES NOW RENDER LIVE** against the seeded fixtures. Headline: *"Measured professional behaviour rose +21.9 points across the cohort, alongside a +20.8-point move in self-assessed readiness."* Gain index 36% of headroom, adjusted gain +31.3, calibration gap +10.4 *"corroborated by behaviour change"*, band migration 63%, material improvement 75%, 8 paired responses. **The pluggable seam from S2 required no generator change** — exactly what it was built for.

- **The other session's reporting work is visibly strong.** Every metric now carries its own explanation, including the honest caveat on *Modules passed*: *"Mid-program this has a ceiling — a cohort exactly on pace will read well below 100% — so read it as absolute progress, not performance."* Deltas render as `previous → current (change)` in percentage points. `docs/institutional-summary-prompt.md` supplies the narrative cover note. This closes the gap I flagged on 2026-08-29 about numbers arriving without meaning.

- **MY FIXTURE DEFECT — all three pillars read identically** (42.7 → 63.5 on each). Cause: my first seed applied one base and one gain to every item regardless of pillar, so the three pillar means were arithmetically forced to match. On a report that reads as fabricated data. **Rebuilt with per-pillar offsets** reflecting a week-9 cohort: P1 Identity 52.1 → 81.3 (early content, largely done), P2 Communication 41.7 → 62.5, P3 Career Navigation 35.4 → 44.8 (weeks 9–12 content, still in progress). Now tells a coherent story instead of three identical numbers.

- **NOT a bug — the "Invite not accepted after 129 days" chips.** They appear on all 8 students including Avery at 14/14 modules, but the report being viewed is a **snapshot generated 2026-09-23 06:16**, before I repaired `last_sign_in_at`. Verified live: `last_sign_in_at` is now correctly populated, and `invitePendingDays()` returns null whenever it is set. Frozen historical data is correct snapshot behaviour. A newly generated report will not carry the chips.
  · The underlying logic flaw still stands as a recommendation: "invite not accepted" should be suppressed when there is other evidence of activity, so a stale or missing sign-in timestamp can never contradict completed coursework on the same line.

- **Small defect for the next pass:** the report artifact reads *"No workbook activity — 1 students"*. The same pluralization fix was applied to the dashboard earlier; the report component has its own copy.

- Outstanding: prove one invite delivers now the Resend domain is verified · roll the service_role key · commit BUILD-LOG and the untracked prompt/kickoff docs · decide whether `MIN_N_COHORT_CLAIM = 8` should scale for small cohorts.

- Next step: generate a fresh report to confirm the invite chips clear and the new pillar spread reads correctly, then send one real invite.

---

=== LOG UPDATED: 2026-10-02 (America/Detroit) — BACKEND PHASE CLOSED. S3.1→S6 shipped. Two privilege-escalation holes found and closed ===

- **S3.1 (`73e72ae`) — invite acceptance and passwords.** Before this there was **no way for anyone to set a password**: `auth.updateUser` was never called anywhere, and `/auth/callback` was the only auth route. An invited student would land signed-in with no password and be unable to return; anyone who forgot a password was permanently locked out. **That was a gap in my S3 spec** — I required that Oscar never handle a password but never required the page where a student sets one.
  · Cursor also found the root cause of the dead invite link: `inviteUserByEmail` returns the session in the URL **fragment**, which never reaches the server, and the old callback only read `code`. Invites could never have worked, independent of the expiry.
  · SMTP chain debugging, in order: Resend rejected `email.corpacad.com` (sender typo) → then `mail.corpacad.com` not yet verified → then `html/template … ends in a non-text context`, an unterminated `href="` after the email template was edited. **My instruction caused the last one** — I gave a bare URL to paste rather than a complete template. Each failure was read from the Supabase auth logs rather than guessed.

- **S4 (`34fba79`) — no-cohort guard.** A student invited from the Supabase dashboard gets `institution_id = null` and every page rendered blank: modules are cohort-scoped and CAPRI threw. Now a clear "not assigned to a cohort" page on every student route, a self-explaining CAPRI page, and a "No cohort" badge on `/superadmin/users`. Created a **Pilot Cohort** institution starting today so the real day-one student journey can be walked.

- **S5 (`aa8ce03`) — quiz integrity.** Verified before acting: `page.tsx` selected `correct_answer`, passed it to the browser, and `submitQuiz` graded against whatever the browser sent back. **Students could read every answer or post a perfect score having answered nothing** — and since completion gates the certificate and feeds every report figure, fabricated completion became a false claim to a paying institution. Grading moved server-side, answer key removed from client payloads, column privileges revoked, and `quiz_answers` added so per-question analysis (O7, the last gap from the August assessment) could finally be built.

- **S6 (`de479c9`) — the hole S5 exposed.** Cursor flagged it; I confirmed it in production. `student_progress` carried `"Students manage own progress"` as **`FOR ALL`**, so one line against the REST API with the public anon key set `is_complete`, `quiz_score` and `xp_earned`. `profiles` allowed table-wide UPDATE — including **`role`** and **`institution_id`**, i.e. self-promotion to `super_admin` or moving into another institution's cohort to read its data. **Every control built across S1.6 and S5 was bypassable.**
  · Migration applied and independently verified by me: `student_progress` now has SELECT-only policies and **no write privileges**; `quiz_answers` the same; `profiles` table-wide UPDATE revoked with column grants limited to `bio, default_answer_visibility, full_name, grad_year, linkedin_url, profile_picture_url`.
  · Cursor revoked **privileges as well as policies** — a missing policy silently affects zero rows, a missing privilege fails loudly. Right instinct, and it matters for anything added later.
  · Probes were run on real Postgres via PGlite with production policies, and as a baseline against the live project. **Still to do: `npm run probe:student-writes -- demo@corpacad.com` against production now the migration is applied.**

- **Open findings reported by Cursor, deliberately not changed:**
  · **CAPRI:** a student can set `submitted_at` on their own open response or insert one already marked submitted. The certificate only checks that the Week 12 response is submitted, so a student could unlock it without answering CAPRI — and would then appear in the outcome report with no scores. Small fix; belongs to the CAPRI thread.
  · `login_events` is student-insertable and feeds weekly engagement, so a student could inflate their own activity figure.
  · `recalculate_cohort_ranks` is callable by any signed-in user for any institution (harmless — recomputes from real data).

- **Pattern worth recording:** three of the last four passes found that a control we had carefully built was reachable around rather than through. Answer key → server grading → direct table write. Each fix was correct and each was insufficient alone. The lesson is to ask "what else writes this?" of every rule, not just "is the rule right?"

- Remaining before a cohort: **roll the service_role key** · run the production probe · manual end-to-end (module completion, profile edit, attendance button, onboarding) · decide `MIN_N_COHORT_CLAIM` for small cohorts · CAPRI submitted_at fix.

- Next step: production probe + manual checks, then the testing phase.

---

=== LOG UPDATED: 2026-10-04 (America/Detroit) — FULL STUDENT JOURNEY WALKED END TO END in production as `garnercommercial`. Core loop works. One real defect, several observations ===

- Walked the real student path in the browser against production: login → CAPRI baseline → program start → module content → exercises → quiz fail → retake → pass → completion → profile → publish. Every claim below was confirmed against the database, not just the screen.

- **WORKS — CAPRI baseline.** Gate redirected straight to `/capri/baseline`. 33 items across 4 steps (3 pillars + "Recent activity" behavioural block with the 30-day banded stem). Submitted cleanly and **scored correctly**: 33 answers stored, composite 41.67, BEI 16.67, pillars 50.00 / 41.67 / 33.33 — matching the descending pattern I deliberately answered. The scoring maths is right end to end.

- **WORKS — completion gating, exactly as S1.6 and S5 specify.**
  · Quiz locked until every exercise is answered, and the Check station names what is outstanding: *"The quiz unlocks after every workbook exercise has an answer. Still to finish: Select Your Identity Anchors."*
  · Deliberate fail at 1 of 4 → *"You scored 1 of 4. You need 3 of 4 to complete this module — take another try when you are ready."* Non-shaming copy, retake offered. Database: `quiz_score 1`, `quiz_completed false`, `is_complete false`, `xp_earned 0`.
  · Retake at 4 of 4 → `is_complete true`, **XP 140 written through to the profile** (proving S6's service-role write path works), `completed_at` stamped.
  · **8 `quiz_answers` rows — both attempts retained**, 1 correct then 4 correct. S5 answer capture confirmed.
  · **The answer key is absent from the page.** Quiz rendered with questions and options only.

- **WORKS — living workbook → profile.** Both exercises persisted with 6 fields each, render on `/profile` grouped by pillar under "My Living Workbook", anchors shown as anchor + reason pairs. "Make public" flips `is_public` to true and the badge to PUBLIC.

- **DEFECT — `default_answer_visibility` is stored but never applied at save time.** On first save a modal asks "Workbook answer visibility: Public by default / Private by default". Choosing **Public by default** correctly writes `profiles.default_answer_visibility = true`, but both exercises still saved with **`is_public = false`** and the per-exercise "Show on my profile when public" checkbox renders unchecked. A student who explicitly opts into sharing gets a private workbook and an empty portfolio unless they also toggle every exercise by hand. Since workbook → profile → shareable portfolio is the product's headline promise, this quietly defeats it.

- **UNTESTED AND IMPORTANT — third-party profile visibility.** `/profile/<id>` shows the owner view to the owner, and redirects to `/login` when signed out. **So "does a visitor see only PUBLIC answers?" has never been verified.** It needs a second account viewing the first. Given the privacy promise made to students on the CAPRI intro screen, this should be tested before any cohort.

- **Observations, not defects:**
  · **First-run visibility modal blocks silently.** It appeared on the first save and every subsequent save no-opped with no feedback until it was dismissed. A student who ignores it will think saving is broken.
  · **Keyboard tab order interleaves the anchor chips with the reason textareas**, so tabbing between reasons lands on a chip, where a space keystroke toggles the selection off. I lost two anchors this way mid-test.
  · **Radio inputs share an empty `name`** across all 45 CAPRI options. React controls state correctly so it is not a functional bug, but arrow-key navigation within a question and screen-reader "option 2 of 5" announcements will not work.
  · `rank` stayed NULL after completing a module — may be correct for a one-student cohort, worth confirming with more than one.
  · Duplicate "P1 · Student → Pre-Professional Identity Shift" heading renders above the first exercise card on the profile.
  · Video station shows "Video lesson — coming soon" gracefully.

- **Method note:** several apparent failures during this walk were my automation, not the product — programmatic `value` setting that React ignored, a click on a hidden panel, and a mouse click that missed after a scroll. Each was checked against the database before being called a bug, and none is reported as one. The one defect above was confirmed by reading `profiles.default_answer_visibility` and `exercise_answers.is_public` directly.

- Next step: fix the default-visibility application, test third-party profile visibility with a second account, then the remaining manual checks (profile edit, attendance button) and the service-key swap.

---

=== LOG UPDATED: 2026-10-04 (America/Detroit) — S7 defects fixed (6b65cf9). S8 student portfolio shipped (0297394 + 972cdf8); migration applied ===

- **S7 — all five journey defects fixed, and two of my diagnoses were wrong in a useful way.**
  · The visibility bug was as located: `isPublic` initialised once at mount from a `defaultAnswerVisibility` that was still `null`. Fixed by lifting the default into shared parent state in `exercise-section.tsx` so sibling cards inherit it, and by sending the chosen value with the save that triggered the prompt. Verified by reading rows back: public/public, private/private, and the production failure path now public/public.
  · **I attributed the silent saves to the modal simply being open. The real cause was worse:** every card rendered its *own* prompt inside the page, and layout could push that overlay off-screen — so a student clicked Save, an invisible dialog opened, and every further click went nowhere. Now one prompt at page top level, focus-trapped, dimmed backdrop, with "Pick an option to finish saving." when a save is attempted while open.
  · **I blamed the anchor chips for the tab trap. It was the Remove (×) button** before each reason box — tabbing out of a reason landed there and a space removed the anchor. Now skipped in tab order, mouse-usable, chips announce selected state.
  · Radio groups now properly named and labelled (`capri-P1-1-current`, `quiz-<question id>`); arrow keys cycle within a question only. Duplicate profile heading removed.

- **S8 — the student portfolio document.** Resolves the tension found on 2026-10-04: `/profile/[student-id]` is behind `requireProfile()`, so "public" meant *visible to signed-in users* and a recruiter hit a login wall. Oscar's answer — a printable document the student owns — is better than making profiles web-public: no indexing risk, no consent escalation, and it survives the student losing platform access.
  · **Gated on `program_completed_at`**, same as the certificate.
  · **Student curates.** Deliberately does **not** reuse `is_public` — "visible to my cohort" and "send to an employer" are different decisions, and some exercises are reflection on confidence and doubt. Defaults to nothing ticked.
  · **CAPRI appears as direction only.** `readinessDirection()` returns improved / held_steady / declined with a 5-point steady band (≈ two Likert item-steps on a 9-item pillar). Verified by reading the code: **scores never leave `fetchPillarDirections` — only the direction does.** No composite, pillar value, gain index or percentage can reach the document. Section omitted entirely without both baseline and post.
  · No XP, streak, rank or badge. Corporate Academy named once, as issuer.
  · Real `@media print` stylesheet added — there was none before, so printing previously dragged the sidebar and app chrome onto the page.

- **Migration applied by me** (`profile_portfolio_selection`): `profiles.portfolio_selection jsonb NOT NULL DEFAULT '[]'`. Verified the default, and verified **S6's column grants held** — `portfolio_selection` is absent from the student-updatable list (`bio, default_answer_visibility, full_name, grad_year, linkedin_url, profile_picture_url`), so clients cannot write it; only the service-role action can, and it discards keys that are not that student's own saved answers.

- **Checked the privacy shape myself** since `/portfolio` sits outside `(protected)`: it calls `requireRole(["student"])` and derives the student **from the session with no id parameter**, so there is no enumeration path. Outside `(protected)` is purely to drop app chrome, not to drop auth. Sharing happens via the printed PDF, not a URL — which is the intent.

- Cursor printed real PDFs at A4 (7 pages) and Letter (8 pages) and inspected every page: no chrome, nothing clipped, name and "Page X of Y" on each page, headings not stranded.

- **Open decisions handed back:** programme name is a placeholder constant (`PORTFOLIO_PROGRAM_NAME` = "Pre-Professional Readiness Program"); no certificate reference exists so the verification line carries issuer + completion date only; scorecard exercises print the student's own "self-rated 4 of 5" but omit the "Total: 15 / 25" line.
- **Known limitation:** the name/page footer relies on Chrome/Edge 131+. Safari and Firefox print the document without it.
- **Carried, not fixed:** hydration warning in `components/layout/app-header.tsx` (likely a date rendered server- then client-side) and an existing lint error in `components/modules/v2/workbook-blocks.tsx`.

- Next step: generate a portfolio as a completed student and read the actual PDF; then the remaining manual checks and the service-key swap.

---

=== LOG UPDATED: 2026-10-05 (America/Detroit) — FULL PROJECT AUDIT, TIERED. T3.2 closed (7bd4080, migration applied). T3.3 domain registered. Marketing brief written ===

- **Full audit produced as `PROJECT-STATUS-TIERED-2026-10-05.md`**, using Oscar's categories: Tier 3 breaks a core concept or contradicts the value proposition; Tier 2 is noticeable to a judge; Tier 1 is loose threads. **Three Tier 3 items — two config/content, one a small code fix. Nothing architectural blocks selling.**
  · **T3.1 — no module videos.** 0 of 14 have a real video; all point at one placeholder. Watch is one of four stations in every module, so a quarter of the designed experience is dead across the curriculum. Not a code defect — the player, gate and editor work and `VIDEO_GATE_ENABLED` is deliberately off. Oscar has the recordings; it is an upload task.
  · **T3.2 — self-issued certificates.** Closed, see below.
  · **T3.3 — nothing a buyer can reach.** No custom domain, no login entry from the marketing site.
  · Tier 2 highlights: **cohort rank never recalculates** — `recalculate_cohort_ranks` does not exist in the database though it is defined in the repo and called from `lib/rankings.ts`, with the error caught and logged, which is why a completed student kept `rank = NULL`; repo-vs-applied migration drift (20 files vs 22 applied rows, non-corresponding versions) now the root cause of **five** production defects; placeholder live-session URLs; student-insertable `login_events` feeding the engagement figure; `MIN_N_COHORT_CLAIM = 8` on small cohorts; leaked-password protection off; demo fixture decay; untested third-party profile view.

- **T3.2 CLOSED — `7bd4080`, migration `lock_capri_response_submission` applied and independently verified by me.**
  · Student UPDATE policy dropped; INSERT replaced with one requiring `submitted_at` and `duration_seconds` null; **privileges revoked and INSERT granted back on only `administration_id, student_id`, so a student cannot even name `submitted_at`.**
  · Verified live: policies now INSERT + SELECT only, client table-level writes **NONE**, INSERT columns limited to the two, **0 submitted responses with zero answers** across all 17 existing submitted rows.
  · `hasSubmittedPost()` now requires a submitted response **with saved answers and a stored composite score**, not just a timestamp. The certificate page calls it with the service role after the existing who-can-view check, because institutional admins cannot read individual scores.
  · **Cursor planted a deliberate hollow row — completed student, post response stamped submitted, zero answers — and the certificate refused it.** That is the test that actually matters and would not have been caught by code review.
  · I checked the one way this migration could have broken production: `getOrCreateResponse` inserts exactly `administration_id` and `student_id`, matching the grant, and SELECT is unrestricted — so opening a response still works for new students.

- **T3.3 in progress.** `learn.corpacad.com` registered against the Vercel project (returns `verified: true` — ownership, not routing). **DNS does not exist yet**: no CNAME, confirmed against public DNS. Oscar to add the CNAME at Squarespace using the exact target Vercel displays, then — the step that has already broken twice — add the new origin to **Supabase → Authentication → URL Configuration** (Site URL *and* Redirect URLs) and update `NEXT_PUBLIC_SITE_URL` before redeploying.

- **`MARKETING-THREAD-KICKOFF.md` written.** Carries what is real versus in production, the push model, the strongest claims, and the hard limits — particularly that CAPRI measures **self-assessed** readiness and must never be presented as measured capability, that attendance is self-reported, that no cohort has completed so there are no outcome figures or testimonials, and that student workbook answers may not appear in marketing without specific written consent.

- **Reported by Cursor, not changed, both Tier 2:**
  · The dashboard "View certificate" banner keys on `program_completed_at` alone, so a student with a hollow row would see it, bounce back, and be unable to retake because the row counts as submitted. With S9 applied no student route can create such a row, so this is now an edge case — but the dead end has no escape hatch.
  · The INSERT policy does not check that the administration belongs to the student's own institution. A student could open an empty row in another institution's administration. Confirmed harmless to outcomes — the app always resolves administrations through `ensureAdministration` with the student's own `institution_id`, and outcome pairing requires submitted responses with composite scores — but it could inflate a "started" count.

- Next step: Oscar adds the CNAME and the Supabase URL configuration; then marketing can begin, with video upload as the real schedule driver.
