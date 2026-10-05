# CAPRI Thread — Kickoff Brief

Paste this into the CAPRI chat to start it with the context it needs from the LMS build.

---

## What this thread is for

CAPRI — the **Corporate Academy Professional Readiness Index** — is the instrument behind every outcome claim Corporate Academy makes to an institution. Five domains, a Week 1 baseline and a Week 12 post. It currently lives in a Google Form and exists nowhere in the LMS.

This thread owns the **instrument and the claim**: what CAPRI measures, how it scores, what it is honest to say about the results, and how it reaches an institution. The LMS thread owns the plumbing that carries it.

Do not start by designing screens or tables. Start with the sentence Corporate Academy wants to be able to say to a Dean, then work backward to what has to be true for that sentence to be defensible.

## Context you need from the LMS build

**The product.** A 12-week, 14-module professional-readiness programme sold to institutions — career services, honors colleges, Greek orgs, leadership nonprofits. Self-paced modules on odd weeks, five live sessions on even weeks, closing in week 12. The differentiator is the "living workbook": students fill exercises, answers build a profile, the profile becomes a shareable portfolio.

**Reporting is PUSH, not portal.** Institutions do not log in. Oscar generates reports and sends them. So CAPRI results reach an institution as a **section inside a generated report artifact**, not a dashboard they browse. Design for a page that gets emailed, not a screen someone explores.

**The report generator is being built now (Stage 2) with a pluggable outcomes section reserved for CAPRI**, so the two threads can move in parallel. What Stage 2 needs from you, in rough priority: the shape of the CAPRI section, the fields it needs, and whether results are per-student or cohort-only.

**A hard-won lesson that applies to you.** The LMS reports "module completion", which sounds like "did the work" but currently means only "passed the quiz". That gap went unnoticed for months. Separately, changing a completion setting mid-programme would have made before/after numbers incomparable while still looking like real progress. **Any metric feeding an outcome claim must have its definition written down and versioned, so a pre/post comparison is never made across two different definitions.** CAPRI is a pre/post instrument — this is your central risk, not a footnote.

**Privacy precedent already set.** Admins see *counts* of workbook and diagnostic completion, never the answers. Students write reflective content for themselves and their own profile, not for their institution. CAPRI is self-assessment about confidence and readiness — decide deliberately whether institutions see individual scores or cohort aggregates only, and expect the same default to apply.

## Open questions this thread must resolve

**1. CAPRI vs the onboarding diagnostic — are they the same instrument?**
The LMS already has an onboarding "diagnostic" (`diagnostic_responses`, currently 0 rows, questions in `app/actions/onboarding.ts`). A content audit found those questions were AI-invented with no source — they are not CAPRI. So: does the Week 1 CAPRI baseline *replace* the onboarding diagnostic, or do both exist? Two separate Week 1 questionnaires is a bad student experience and will depress completion of both. **Resolve this before anything else** — it determines whether the LMS work is "add CAPRI" or "replace the diagnostic".

**2. Google Form or in-app, for the first cohort?**
Forms is working and costs nothing to keep. In-app gives response linkage to student records, completion tracking, and reminders — but is real build work. A defensible middle path is Forms for cohort 1 with a defined import route into the report. Decide, and be explicit about what the Forms path costs in manual handling per cohort.

**3. The five domains, canonized.**
Name them, define each precisely, and fix the item wording. Put the canonical version in Notion the way the quiz bank was canonized — one source of truth, so nobody edits a question mid-cohort and breaks comparability. If the domains have ever changed wording, note which cohort used which version.

**4. Scoring.**
Per-domain scoring, and whether there is a composite index. If there is a composite, state the weighting and why. A single "CAPRI score" is easier to sell and easier to mislead with — if you build one, keep the domain detail alongside it.

**5. The claim sentence — write it first.**
Draft the exact sentence that goes in the institutional report, then check each part is supportable. For example: *"Across 24 students, self-reported readiness rose from 2.8 to 4.1 of 5, with the largest gain in Professional Communication."*
**Be accurate about what a pre/post self-assessment measures.** It captures change in self-perceived readiness — that is a legitimate and meaningful outcome, and it is not the same as measured capability. Claims should say so plainly. An institution that later discovers the index was self-reported, having been told something stronger, is a lost renewal and a reputational problem. Precision here protects the product.

**6. Known confounds, stated up front.**
Small cohorts, self-selection into completion, students who only complete the post, and response-shift bias (people who learn a domain often rate themselves *lower* afterward, because they now know what good looks like). Decide how the report handles partial data — a student with a baseline but no post should not silently vanish from the average.

**7. Timing.**
Week 1 baseline and Week 12 post are the intent. Week 12 also carries P11 and P12, so the post-assessment competes with the two final modules. Decide when it fires, what the reminder cadence is, and what happens to a student who finishes late.

## What to produce

1. A resolution on CAPRI vs the onboarding diagnostic.
2. Canonical five domains and item wording, in Notion, versioned.
3. The scoring model.
4. A one-page mock of the CAPRI section as it will appear in an institutional report, with the claim sentences written out.
5. A short list of what the LMS must build, ordered by whether it blocks the first cohort.

Item 4 is the highest-value output — it is the thing that makes the rest concrete, and it is what the Stage 2 report generator will be built against.

## Non-goals for now

Not building screens. Not designing a database schema — that follows from the decisions above. Not the social layer (Pass 4). Not anything that requires the LMS reporting work to finish first.
