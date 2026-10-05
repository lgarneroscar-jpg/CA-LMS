# Cursor prompt — S8: the student portfolio document

Copy everything below the line into Cursor. **One commit. No migration expected.**

---

## 0. What this is and why

The living workbook is the product's differentiator, but today it lives only inside the app. `/profile/[student-id]` sits behind `requireProfile()`, so "public" means *visible to other signed-in users* — a recruiter hits a login wall. Students also lose the value entirely once they stop using the platform.

This builds the thing they can actually keep and send: **a printable portfolio document, generated at completion, that works as a PDF with no account and no link back to us.**

Reuse the existing pattern — the institutional report is an HTML artifact plus `print-report-button.tsx` and browser print-to-PDF. There is no PDF library in this project and none should be added.

## 1. Gate it on completion

Generated only when `profiles.program_completed_at` is set — same gate as the certificate at `app/certificate/[student-id]/page.tsx`. A student mid-programme does not get one.

Entry point from `/profile`, visible once eligible. Before that, say what unlocks it rather than hiding it silently.

## 2. The student picks what goes in

**Do not reuse `is_public`.** That flag means "visible to my cohort", which is a different decision from "send this to an employer" — some exercises are personal reflection about confidence, purpose and doubt that a student may share with peers but not a recruiter.

- Present every saved exercise grouped by pillar, each with a checkbox, defaulting to **unchecked**.
- The student ticks what to include, then generates.
- Remember the selection so regenerating does not start from scratch. A small JSON column on `profiles`, or a dedicated table — your call, but say which and flag any migration.
- Make it obvious this document leaves Corporate Academy and that anything ticked can be read by anyone they send it to.

## 3. CAPRI: growth, not scores

Include a readiness-growth section, **without numeric scores**.

Show, per pillar, whether readiness improved, held steady, or declined between the Week 1 baseline and the Week 12 post — and label it plainly as **self-assessed**.

**Do not print a composite, a pillar score, a gain index, or a percentage.** A recruiter reading "78 / 100" hears assessed capability; the instrument measures self-perception. That distinction is defensible in an institutional report where it is explained at length, and indefensible on a one-page document being skimmed by a stranger. Keep the honest version.

Where a student has no post response, omit the section entirely rather than showing an empty or half-complete one.

## 4. What the document contains

In order:

1. **Identity** — name, institution, cohort dates, programme name.
2. **Completion** — modules completed of 14, with the definition stated once: every workbook exercise answered and the quiz passed at 75% or above. Live-session attendance may appear, labelled by source as elsewhere.
3. **Readiness growth** — §3.
4. **Selected work** — the chosen exercises, rendered readably: prompts as headings, answers as prose. This is the substance; give it the most room.
5. **Verification line** — a plain statement that Corporate Academy issued it, the completion date, and the student's certificate reference if one exists.

No XP, no streaks, no rank, no badges. Those are engagement mechanics and they make a professional document look like a game.

## 5. Print quality is the whole deliverable

This will be judged as a PDF, so:

- Add a real `@media print` stylesheet — **there is none in `app/globals.css` today**, so printing currently carries the sidebar and app chrome into the page. Hide nav, header, buttons and the selection UI.
- A4 and Letter both sane; margins that do not clip.
- No orphaned headings, no exercise split awkwardly across a page break where avoidable.
- Black text on white. The Campus Indigo accent may appear sparingly in rules and headings, but it must stay legible printed in greyscale.
- Page numbers and the student's name in a footer on every page.

Check the printed output, not the screen.

## 6. Tone

This is the student's professional artifact, not our marketing. Corporate Academy is named as issuer and nowhere else. No taglines, no "powered by", no calls to action, no URLs inviting the reader to sign up. A recruiter should see the student's work with our name as provenance.

## Acceptance criteria

- `npm run build` passes.
- Only a student with `program_completed_at` can generate one; others see what unlocks it.
- Selection defaults to nothing included and persists between visits.
- `is_public` is **not** used to decide inclusion, and is not modified by this feature.
- No CAPRI number appears anywhere in the document; direction and the self-assessed label do.
- A student with no CAPRI post response gets a document with no readiness section and no gap.
- Printed to PDF, no app chrome appears, and nothing is clipped at A4 or Letter.
- No XP, streak, rank or badge appears.
- No changes to grading, completion rules, reporting, RLS, or the CAPRI instrument.

List every file you change, state where the selection is stored and whether it needs a migration, and confirm no CAPRI score reaches the document.

---

## After Cursor — REQUIRED

1. `npm run build`
2. Commit and push on `main`; say which branch if not.
3. Tell me if a migration is needed — I will apply it.
4. Generate one as `garnercommercial` once they complete a module set, print it to PDF, and look at the actual file. The PDF is the deliverable; the screen is not.
