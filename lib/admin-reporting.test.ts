import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  expectedModuleCountForWeek,
  paceCompletionPercent,
  METRIC_DEFINITIONS,
} from "./admin-reporting";
import { formatDeltaWithEndpoints, type MetricDelta } from "./report-deltas";

/** Unlock weeks for the 14 content modules, as seeded. */
const UNLOCK_WEEKS = [1, 1, 1, 3, 3, 5, 5, 7, 7, 9, 9, 11, 12, 12];

describe("expectedModuleCountForWeek", () => {
  it("counts only modules whose unlock week has been reached", () => {
    assert.equal(expectedModuleCountForWeek(UNLOCK_WEEKS, 1), 3);
    assert.equal(expectedModuleCountForWeek(UNLOCK_WEEKS, 3), 5);
    assert.equal(expectedModuleCountForWeek(UNLOCK_WEEKS, 7), 9);
    assert.equal(expectedModuleCountForWeek(UNLOCK_WEEKS, 12), 14);
  });

  it("expects nothing before the program starts", () => {
    assert.equal(expectedModuleCountForWeek(UNLOCK_WEEKS, 0), 0);
  });
});

describe("paceCompletionPercent", () => {
  it("reads 100% for a student exactly on pace", () => {
    // Week 7: 9 modules expected, 9 done. The old metric would have shown
    // 9/14 = 64% and looked like underperformance.
    assert.equal(paceCompletionPercent(9, 9), 100);
  });

  it("reads below 100% for a student who has fallen behind", () => {
    assert.equal(paceCompletionPercent(5, 9), 56);
  });

  it("caps a student who raced ahead", () => {
    // Without the cap, one over-achiever would drag the cohort average above
    // what any individual actually achieved.
    assert.equal(paceCompletionPercent(14, 9), 100);
  });

  it("scores a non-starter at zero rather than dividing by zero", () => {
    assert.equal(paceCompletionPercent(0, 3), 0);
    assert.equal(paceCompletionPercent(0, 0), 0);
  });

  it("separates a behind cohort from an on-pace one at the same absolute progress", () => {
    const completed = 5;
    const week3 = paceCompletionPercent(
      completed,
      expectedModuleCountForWeek(UNLOCK_WEEKS, 3)
    );
    const week9 = paceCompletionPercent(
      completed,
      expectedModuleCountForWeek(UNLOCK_WEEKS, 9)
    );
    // Identical 5-of-14 absolute progress: on pace at week 3, well behind by
    // week 9. The absolute metric cannot tell these apart; this one can.
    assert.equal(week3, 100);
    assert.equal(week9, 45);
  });
});

describe("metric definitions", () => {
  it("names the expected module count when one is known", () => {
    assert.match(METRIC_DEFINITIONS.paceCompletion(9), /about 9 modules/);
  });

  it("uses the singular for a single expected module", () => {
    assert.match(METRIC_DEFINITIONS.paceCompletion(1), /about 1 module\b/);
  });

  it("falls back to a generic definition with no expectation yet", () => {
    assert.doesNotMatch(METRIC_DEFINITIONS.paceCompletion(null), /about/);
  });

  it("discloses that the quiz average excludes non-starters", () => {
    assert.match(METRIC_DEFINITIONS.quizScore, /excluded/);
  });

  it("states the ceiling on the absolute completion figure", () => {
    assert.match(METRIC_DEFINITIONS.overallCompletion(14), /ceiling/);
  });

  it("gives the XP average a scale when a top score exists", () => {
    const text = METRIC_DEFINITIONS.averageXp(420, "Avery Chen");
    assert.match(text, /420/);
    assert.match(text, /Avery Chen/);
  });

  it("omits the leader when nobody has earned any XP", () => {
    assert.doesNotMatch(METRIC_DEFINITIONS.averageXp(null, null), /highest/);
  });
});

describe("formatDeltaWithEndpoints", () => {
  const base: MetricDelta = {
    key: "k",
    label: "l",
    previous: 42,
    current: 55,
    delta: 13,
    unit: "percent",
    comparable: true,
  };

  it("shows where the number came from, not just how far it moved", () => {
    assert.equal(formatDeltaWithEndpoints(base), "42% → 55% (+13 pp)");
  });

  it("signs a decline", () => {
    assert.equal(
      formatDeltaWithEndpoints({
        ...base,
        previous: 55,
        current: 42,
        delta: -13,
      }),
      "55% → 42% (-13 pp)"
    );
  });

  it("drops the percent sign for counts", () => {
    assert.equal(
      formatDeltaWithEndpoints({
        ...base,
        unit: "count",
        previous: 3,
        current: 5,
        delta: 2,
      }),
      "3 → 5 (+2)"
    );
  });

  it("shows endpoints even when the change is not computable", () => {
    assert.equal(
      formatDeltaWithEndpoints({ ...base, previous: null, delta: null }),
      "— → 55%"
    );
  });

  it("refuses to compare across a definition change", () => {
    assert.equal(
      formatDeltaWithEndpoints({ ...base, comparable: false }),
      "not comparable"
    );
  });

  it("returns a dash when neither side has data", () => {
    assert.equal(
      formatDeltaWithEndpoints({
        ...base,
        previous: null,
        current: null,
        delta: null,
      }),
      "—"
    );
  });
});
