# Cursor prompt — S1.5: make the reporting usable and honest

Copy everything below the line into Cursor. **One commit.** This pass sits between S1 and Stage 2 because Stage 2 snapshots must capture metrics that are already correctly defined — snapshotting a misleading number just preserves it.

---

Six changes to the admin reporting surface. Four are presentation, two are correctness. No changes to student learning content.

## 1. Replace the module completion donut — it is mathematically broken

`components/admin/admin-dashboard-client.tsx` → `ModuleCompletionDonut`. Three independent defects:

- **Colors repeat.** The `colors` array has **8 entries** cycling across **14 modules**, so P1/P9, P2/P10, P3/P11, P4/P12, P5/P13 and P6/P14 render identically. There is no way to know what you clicked.
- **No legend, no labels, no tooltips.**
- **The geometry is wrong.** `strokeDasharray={`${seg.dash} ${100 - seg.dash}`}` uses each module's *completion rate* as arc length, and `offset` accumulates those rates. The 14 rates currently sum to ~574 on a 100-unit circumference, so arcs wrap the ring five times and overpaint each other. A module at 78% draws an arc spanning 78% of the entire circle on its own. **The shape encodes nothing** — module completion rates are independent percentages, not parts of a whole, so a pie/donut is the wrong chart type regardless of implementation.

**Replace with a horizontal bar list**, in curriculum order (`unlock_week`, then `order_index`):

```
P1  · Student → Pre-Professional Identity Shift   ████████░░  78%  (7 of 9)
P2  · Purpose & Your Why                          ███████░░░  67%  (6 of 9)
```

Each row shows module code, title, a bar, the percentage, and the raw count. **Keep the click-to-expand behaviour** — Oscar explicitly likes it — so clicking a row still reveals the completed/incomplete student lists below or beside it. Selected row gets a clear active state. One accent color scaled by value; no rainbow. Must work on mobile, where the donut was unusable.

## 2. Make the attention lists expandable and filterable

The behind-pace list is a hardcoded `slice(0, 5)` with no way to see the rest.

- Add "Show all N" expansion.
- Make the reason chips from S1 **clickable filters** — clicking `Diagnostic incomplete` filters the roster to those students. This is the specific thing Oscar went looking for and could not find.
- Show a count per reason so the size of each problem is visible at a glance.

## 3. Add diagnostic reporting

`diagnostic_responses` exists and currently holds **0 rows**; questions live in `app/actions/onboarding.ts`. `profiles.diagnostic_complete` is the flag.

Add a diagnostic section: how many students completed it, who has not, and how long they have been enrolled without completing it. This is the Week-1 baseline — without it there is no before/after story to tell an institution later.

Do **not** display individual diagnostic answers to admins. Same privacy rule as the workbook: counts and completion only.

## 4. Live-session attendance: keep self-report, add admin override

**Current state:** `components/modules/live-session-attendance.tsx` gives students a **"Mark attendance (+50 XP)"** button. Attendance is therefore self-reported *and rewarded with XP*, which is not credible evidence to hand an institution. All five `stream_url`s are also `https://www.youtube.com/live_placeholder`.

**Oscar's decision: keep self-report, add an admin override.**

- Build an admin attendance view per live session: the institution roster with a checkbox per student, and a save action.
- Record **who set it** — add an `attendance_source` distinguishing `self_reported` from `admin_confirmed`. Add the column via a migration; do not overload an existing field.
- Admin confirmation wins over self-report.
- In all reporting, label the metric with its source, e.g. *"4 of 9 attended · 3 admin-confirmed, 1 self-reported"*. **Never present self-reported attendance as verified.**
- Attendance still never gates certification.

**RLS blocker — read this before implementing.** `student_progress` has exactly two policies: `Students manage own progress` (ALL, `student_id = auth.uid()`) and `Admins read institution progress` (**SELECT only**). Admins therefore **cannot write** attendance rows through the user-scoped client, and this will fail silently or error the moment you wire the save action.

**Do NOT solve it by adding an admin write policy to `student_progress`.** That table also holds `quiz_score`, `quiz_completed` and `is_complete` — a broad write policy would let an institutional admin edit quiz scores and module completions for their own students, i.e. fabricate the outcomes being sold. That is the opposite of what this pass is for.

Instead, mirror the pattern S1 established for `exercise_answers`: a **server action using the service-role client**, guarded by `requireRole(["institutional_admin","super_admin"])` plus an explicit check that the target students belong to the caller's institution, and writing **only** the attendance-related fields on `is_live_session` module rows. Never accept a student ID list from the client without re-verifying institution membership server-side.

## 5. Report completion components separately — stop hiding them behind one number

**Current state:** `moduleCompletionPrerequisitesMet()` in `lib/module-gates.ts` computes `videoOk = !VIDEO_GATE_ENABLED || video_watched`, and **both `VIDEO_GATE_ENABLED` and `EXERCISE_SUBMIT_GATE_ENABLED` are `false`**. So "module completion" today means **the quiz was completed** — nothing else. Video watching and workbook exercises are recorded but required by nothing.

**Oscar's decision: leave the gates off, but stop reporting a single blended "completion" figure.** Show the components side by side:

```
Casey Novak
Quiz      10 of 14 modules
Workbook  19 of 31 exercises
Video     not yet tracked
```

- Keep `completionPercent` for pace math, but **rename its label in the UI to "Modules passed"** or similar, so nobody reads it as "did all the work".
- Add a short explainer where the number appears: *"A module counts as complete when its quiz is passed."*
- Do not flip either gate in this pass.

## 6. Tell the truth about videos

All 14 modules currently share **one placeholder URL** (`https://www.youtube.com/watch?v=Z7dXDfqy0e8`), and `/superadmin/content` reports `Video: ✓` for every one because `getModuleContentStatus` only checks that `video_url` is non-null.

- Treat a duplicate-across-modules or `*_placeholder` URL as **not a real video**. Render `Video: placeholder` in a warning style, not a green check.
- Add a content-readiness banner on `/superadmin/content`: *"14 of 14 modules using placeholder video."*
- Exclude video from student-facing reporting entirely while placeholders are in use, rather than reporting a metric that measures nothing.

**Also add a guard for later:** when `VIDEO_GATE_ENABLED` flips to `true`, the meaning of "complete" changes mid-programme. Existing `is_complete` rows stay true, so before/after figures would not be comparable and Stage 2's "since last report" deltas would show movement that never happened. Export a `COMPLETION_DEFINITION_VERSION` constant from `lib/module-gates.ts` that changes when either gate changes, so report snapshots can record which definition was in force. **Stage 2 will store it in every snapshot.**

## Acceptance criteria

- `npm run build` passes.
- No donut/pie anywhere in admin. Module completion is a labeled, ordered bar list, still click-to-expand, readable on mobile.
- Every attention reason is clickable and expandable; no hardcoded 5-item cap.
- Diagnostic completion is reported; no diagnostic answer text is shown.
- Admin can set attendance; reporting states source and never calls self-reported data verified.
- Quiz / workbook / video appear as separate figures; no single number implies all three.
- `/superadmin/content` shows placeholder videos as placeholders.
- `COMPLETION_DEFINITION_VERSION` is exported and covered by a comment explaining why.
- No changes to workbook content, quiz content, scoring, XP, or gating behaviour.

List every file you change, and state what `attendance_source` defaults to for the rows that already exist.

---

## After Cursor — REQUIRED

1. `npm run build`
2. Commit + push (e.g. `feat: usable admin reporting, attendance source, component metrics`)
3. Apply the `attendance_source` migration.
4. Note: the pluralization fix in `app/(protected)/admin/[institution-id]/dashboard/page.tsx` ("1 student" vs "1 students") is already in the working tree — include it.
5. Three earlier migration files are still uncommitted: `20240602000000_profiles_last_login.sql`, `20240602100000_fix_module_order_index.sql`, `20240602200000_create_missing_phase4_tables.sql`.
