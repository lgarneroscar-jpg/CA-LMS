# Institutional Summary — Prompt & Template

The report gives an institution the numbers. This gives them the meaning.

Generate this after each report snapshot, paste the result into your email or
cover letter, and edit before sending. The point is that a dean reads two
paragraphs and understands what happened without doing arithmetic.

---

## How to use it

1. Open the report at `/admin/<institution-id>/reports/<report-id>`.
2. Fill in the figures below — every one is on that page.
3. Paste the whole thing (context + definitions + figures) into Claude.
4. Edit the output. It is a draft in your voice, not a finished send.

Paste everything from `--- PROMPT START ---` to `--- PROMPT END ---`.

---

--- PROMPT START ---

You are drafting a short written summary that accompanies a cohort report sent
from Corporate Academy to a partner institution. Write as Oscar Garner, founder.

**Audience.** A university administrator — career services director, dean, or
program lead. Smart, busy, skeptical of vendor metrics, and has seen a hundred
training reports that all claimed success. They care about whether their
students are more employable, not about our feature set.

**Voice.** Direct and plain. Short sentences. No marketing language, no
exclamation marks, no "we're thrilled to share." State what happened, say what
it means, name what needs attention. Confident but not promotional — the
numbers should carry the argument, not adjectives.

**Length.** 200–300 words. Three or four short paragraphs. No headers, no
bullet lists — this reads as a letter, not a dashboard.

**Structure.**
1. One sentence on where the cohort stands overall.
2. What the engagement and completion figures actually mean in practice.
3. The honest weak spot, named without hedging, with what we're doing about it.
4. One forward-looking sentence about the next reporting period.

**Rules.**
- Never name an individual student. Cohort level only.
- If a figure is below its reporting minimum, say so plainly rather than
  quoting it. Do not build a claim on fewer than 8 paired responses.
- Do not describe a change as significant unless it is at least 10 points.
- If completion looks weak but pace completion is strong, explain the
  difference rather than leading with the weaker number — but never hide it.
- Do not invent causes. If you do not know why something moved, say the number
  moved and what we plan to check.
- Do not promise outcomes (placements, offers, salaries). We measure readiness.

**What the metrics mean — use these definitions, do not guess:**

- **Keeping pace (%)** — average progress against what each student was
  expected to have finished by now, based on their own start date. Capped at
  100% per student. Students who never started count as 0%. This is the "are
  they keeping up" number.
- **Modules passed (%)** — average share of all 14 program modules completed,
  counting every enrolled student. Mid-program this has a structural ceiling: a
  cohort exactly on pace will read well below 100%. It is absolute progress,
  not performance.
- **Weekly engagement (%)** — share of students who signed in at least once in
  the last 7 days. Presence, not depth.
- **CAPRI baseline complete** — students who submitted the Week 1 readiness
  assessment. Required before module content opens.
- **Avg quiz score (%)** — averaged only across students who attempted at least
  one quiz. Non-starters are excluded here, unlike the completion figures,
  which count them at 0%. Pass threshold is 75%.
- **Avg workbook completion (%)** — average share of workbook exercises
  answered, across every enrolled student.
- **Avg XP** — points from module completion, perfect quizzes, on-time work,
  live sessions, and streaks. A participation intensity signal.

**This cohort:**

- Institution:
- Reporting period:
- Cohort size:
- Week of program:
- Keeping pace:
- Modules passed (of 14):
- Weekly engagement:
- CAPRI baseline complete: __ of __
- Avg quiz score: __% across __ of __ students
- Avg workbook completion:
- Students with no workbook activity:
- Avg XP:
- Students needing attention:
- Live session attendance:

**Since last report** (leave blank if this is the first):

- Keeping pace: __ → __
- Modules passed: __ → __
- Weekly engagement: __ → __
- Avg quiz score: __ → __

**CAPRI outcomes** (Week 12 reports only — leave blank otherwise):

- Paired responses:
- Cohort readiness, baseline → post:
- Adjusted gain (response-shift corrected):
- Behavioural evidence change:
- Band migration:

Write the summary now.

--- PROMPT END ---

---

## Worked example

**Figures given:** Demo University · weeks 1–4 · 8 students · keeping pace 71% ·
modules passed 24% of 14 · weekly engagement 50% · CAPRI baseline 7 of 8 · avg
quiz 85% across 7 of 8 · workbook 38% · 2 students no workbook activity · avg XP
340 · 3 need attention · first report, no deltas.

**Output:**

> Four weeks in, the Demo University cohort is broadly keeping up. Students have
> completed 71% of what they were expected to reach by this point, which is a
> reasonable position at this stage of a twelve-week program. The absolute
> figure — 24% of all fourteen modules — looks low in isolation, but only about
> a third of the curriculum has come due yet, so the two numbers are consistent
> with each other.
>
> Quiz performance is the strongest signal so far: an 85% average against a 75%
> pass threshold, across the seven students who have attempted one. Seven of
> eight have completed the CAPRI readiness baseline, which is the assessment
> we'll repeat in Week 12 to measure change.
>
> The weak spot is depth rather than attendance. Weekly sign-in sits at 50%, and
> workbook completion is 38% with two students yet to answer a single exercise.
> Students are watching and passing quizzes but not doing the written work,
> which is where most of the durable skill-building happens. We've flagged three
> students for direct follow-up this week and will reinforce the workbook in the
> next live session.
>
> The next report covers weeks five through eight, when Pillar 2 opens and the
> communication and networking material begins. I'd expect workbook engagement
> to be the number that moves most, and it's the one I'll be watching.

Note what the example does: it reconciles the two completion figures instead of
hiding the lower one, it names the weak spot in its own paragraph, and it
commits to a specific thing to watch next time. That's what makes it read as
honest rather than promotional.

---

## When there isn't enough data

If the cohort is pre-start or in its first two weeks, don't generate a
performance narrative. Send a short participation note instead: who has
onboarded, who has completed the baseline, and when the first real report will
arrive. A confident-sounding summary built on two weeks of data is the fastest
way to lose a skeptical reader.
