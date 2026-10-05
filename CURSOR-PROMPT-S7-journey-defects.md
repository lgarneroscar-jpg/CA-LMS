# Cursor prompt — S7: defects found walking the student journey

Copy everything below the line into Cursor. **One commit, no migration.** Found by walking the real path in production: login → CAPRI baseline → module → exercises → quiz fail → retake → pass → profile → publish.

---

## 1. "Public by default" is stored but never applied *(the real defect)*

**Cause, located:** `components/modules/exercise-card.tsx`

```ts
const [isPublic, setIsPublic] = useState(
  initialSaved?.is_public ?? defaultAnswerVisibility ?? false
);
```

`isPublic` initialises **once at mount**. For a first-time student `defaultAnswerVisibility` is `null` — which is exactly why the first-save prompt appears — so `isPublic` starts `false`. When the student chooses **Public by default**, `persist(true)` updates `profiles.default_answer_visibility` on the server but still sends the stale `isPublic: false` into the `exercise_answers` upsert.

**Confirmed in production:** `profiles.default_answer_visibility = true` while both saved exercises were `is_public = false`, with the per-exercise checkbox unchecked.

Every other exercise card on the page mounted with the same stale `null`, so they all save private too.

**Fix:**
- When the first-save prompt is answered, the chosen value must apply to **that save**: use it as the effective `isPublic` and update local state, not only the profile default.
- Other already-mounted cards must pick up the new default rather than keeping `null`. Either lift the default into shared parent state (`module-experience-v2.tsx` / `exercise-section.tsx`) or `router.refresh()` after it is set. State the approach you chose.
- A student who picks "Public by default" and saves must end with `is_public = true`. Verify by reading the row back, not by reading the UI.

This matters beyond correctness: workbook → profile → shareable portfolio is the product's headline promise, and today opting in silently produces an empty portfolio.

## 2. The first-save visibility modal blocks saves silently

The modal appears on the first save attempt. Until it is answered, **every subsequent "Save exercise" click does nothing** — no error, no feedback, no network request. During testing this read as "saving is broken" for several minutes.

- While the prompt is open, make it unmistakable that it must be answered — focus it, trap focus, dim the page behind it.
- If a save is attempted while it is open, surface the prompt again rather than silently no-op.
- Give it a proper dialog role with a labelled heading so assistive tech announces it.

## 3. Tab order interleaves anchor chips with their reason fields

In the anchor exercise, tabbing from one reason textarea lands on an anchor **chip**, where a space keystroke toggles the selection off. While testing, two selected anchors were silently deselected this way mid-typing.

A student filling the form by keyboard will lose selections without noticing. Order the focus sequence so all chips come first, then all reason fields — or make the chips non-tabbable once selected and provide another route to deselect.

## 4. Radio groups have no `name`

All 45 CAPRI options share an empty `name`. React controls the state so it is **not** a functional bug — I verified two independent selections hold — but:

- arrow-key navigation within a question does not work;
- screen readers cannot announce "option 2 of 5" or group the options with their question.

Give each question's options a shared unique `name`, and confirm the options are associated with their question text (`fieldset`/`legend` or `aria-labelledby`). This applies to the CAPRI assessment and any module quiz using the same pattern.

## 5. Duplicate module heading on the profile

`/profile` renders "P1 · Student → Pre-Professional Identity Shift" twice in a row above the first exercise card — once as the group header and once on the card. Render it once.

## Not defects — verified, do not change

- **Third-party workbook privacy is sound.** RLS on `exercise_answers` is `(auth.uid() = user_id) OR (is_public = true)`, and `/profile/[student-id]` additionally calls `fetchWorkbookPortfolio(..., { publicOnly: true })`. Two independent layers. Leave both.
- Quiz grading, the 75% threshold, retake handling, answer capture and completion all behaved correctly end to end.

## Acceptance criteria

- `npm run build` passes.
- A first-time student who chooses "Public by default" ends with `is_public = true` on the exercise they just saved **and** on subsequent exercises in the same session — confirmed by reading the rows.
- Choosing "Private by default" still produces `is_public = false`.
- A save attempted while the prompt is open never silently does nothing.
- Keyboard: tabbing through the anchor exercise cannot deselect an anchor.
- Each radio question is its own named group; arrow keys move within a question only.
- No duplicate module heading on the profile.
- No changes to grading, completion rules, XP, the CAPRI instrument, reporting, or RLS.

List every file you change, and state how sibling exercise cards pick up the new default.

---

## After Cursor — REQUIRED

1. `npm run build`
2. Commit and push on `main`; say which branch if not.
3. No migration expected — flag it if that changes.
