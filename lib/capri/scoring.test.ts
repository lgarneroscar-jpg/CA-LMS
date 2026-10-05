import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  analyzeGain,
  bandForScore,
  bandMovement,
  CapriScoringError,
  interpretCalibration,
  isSuspectResponse,
  likertMeanToScore,
  readinessDirection,
  READINESS_STEADY_BAND_POINTS,
  scoreResponse,
  summarizeCohort,
  type CapriAnswer,
  type CapriItem,
  type CapriPillar,
} from "./scoring";

/** Mirrors the seeded v2.0 instrument shape: 27 core + 6 behavioural. */
function buildItems(): CapriItem[] {
  const items: CapriItem[] = [];
  for (const pillar of [1, 2, 3] as CapriPillar[]) {
    ["A", "B", "C"].forEach((letter, groupIndex) => {
      for (let n = 1; n <= 3; n++) {
        const order = groupIndex * 3 + n;
        items.push({
          id: `P${pillar}-${order}`,
          section: "core",
          pillar,
          subdimension: `${pillar}${letter}`,
          itemType: "likert5",
          prompt: `core ${pillar}${letter} ${n}`,
          orderIndex: order,
        });
      }
    });
    for (let n = 1; n <= 2; n++) {
      items.push({
        id: `B${pillar}-${n}`,
        section: "behavioral",
        pillar,
        subdimension: null,
        itemType: "frequency_band",
        prompt: `behavioral ${pillar} ${n}`,
        orderIndex: n,
      });
    }
  }
  return items;
}

function answerAll(
  items: CapriItem[],
  likert: number,
  band: number,
  ratingContext: "current" | "retrospective" = "current"
): CapriAnswer[] {
  return items.map((item) => ({
    itemId: item.id,
    ratingContext,
    rawValue: item.section === "core" ? likert : band,
  }));
}

describe("scale conversion", () => {
  it("maps the Likert endpoints onto 0 and 100", () => {
    assert.equal(likertMeanToScore(1), 0);
    assert.equal(likertMeanToScore(5), 100);
    assert.equal(likertMeanToScore(3), 50);
  });
});

describe("scoreResponse", () => {
  const items = buildItems();

  it("scores a uniform response consistently across every level", () => {
    const result = scoreResponse(items, answerAll(items, 4, 2));
    assert.equal(result.composite, 75);
    assert.equal(result.pillars[1], 75);
    assert.equal(result.pillars[2], 75);
    assert.equal(result.pillars[3], 75);
    assert.equal(result.subdimensions["1A"], 75);
    assert.equal(result.bei, 50);
    assert.equal(result.band, "program_ready");
  });

  it("weights the three pillars equally", () => {
    const answers = items.map((item) => ({
      itemId: item.id,
      ratingContext: "current" as const,
      rawValue:
        item.section === "behavioral" ? 0 : item.pillar === 1 ? 5 : 1,
    }));
    const result = scoreResponse(items, answers);
    assert.equal(result.pillars[1], 100);
    assert.equal(result.pillars[2], 0);
    assert.equal(result.pillars[3], 0);
    // A single strong pillar cannot carry the composite past a third.
    assert.equal(result.composite, 33.33);
  });

  it("refuses to score a partial response rather than averaging a subset", () => {
    const answers = answerAll(items, 4, 2).filter((a) => a.itemId !== "P2-5");
    assert.throws(
      () => scoreResponse(items, answers),
      (err: unknown) =>
        err instanceof CapriScoringError && /P2-5/.test((err as Error).message)
    );
  });

  it("returns a null BEI when the behavioural block is absent", () => {
    const answers = answerAll(items, 3, 0).filter(
      (a) => !a.itemId.startsWith("B")
    );
    const result = scoreResponse(items, answers);
    assert.equal(result.bei, null);
    assert.equal(result.composite, 50);
  });

  it("scores the retrospective context independently of the current one", () => {
    const answers = [
      ...answerAll(items, 5, 4, "current"),
      ...answerAll(items, 2, 1, "retrospective"),
    ];
    assert.equal(scoreResponse(items, answers, "current").composite, 100);
    assert.equal(scoreResponse(items, answers, "retrospective").composite, 25);
  });

  it("rejects an out-of-range Likert value", () => {
    const answers = answerAll(items, 4, 2).map((a) =>
      a.itemId === "P1-1" ? { ...a, rawValue: 7 } : a
    );
    assert.throws(() => scoreResponse(items, answers), CapriScoringError);
  });
});

describe("readiness bands", () => {
  it("places scores in the documented ranges", () => {
    assert.equal(bandForScore(0), "emerging");
    assert.equal(bandForScore(39.99), "emerging");
    assert.equal(bandForScore(40), "developing");
    assert.equal(bandForScore(59.99), "developing");
    assert.equal(bandForScore(60), "program_ready");
    assert.equal(bandForScore(79.99), "program_ready");
    assert.equal(bandForScore(80), "advanced");
    assert.equal(bandForScore(100), "advanced");
  });

  it("counts band movement in both directions", () => {
    assert.equal(bandMovement(35, 65), 2);
    assert.equal(bandMovement(65, 65), 0);
    assert.equal(bandMovement(85, 45), -2);
  });
});

describe("analyzeGain", () => {
  it("separates raw gain from response-shift-adjusted gain", () => {
    const result = analyzeGain({
      baselineComposite: 70,
      postComposite: 72,
      retrospectiveComposite: 50,
    });
    // The student looks barely improved on the raw figure...
    assert.equal(result.rawGain, 2);
    // ...but on a consistent ruler the movement is large.
    assert.equal(result.adjustedGain, 22);
    // And the gap is the measured over-rating at Week 1.
    assert.equal(result.calibrationGap, 20);
  });

  it("reports the gain index as the share of headroom closed", () => {
    const strongBaseline = analyzeGain({
      baselineComposite: 80,
      postComposite: 90,
    });
    const weakBaseline = analyzeGain({
      baselineComposite: 40,
      postComposite: 50,
    });
    // Identical 10-point gains, but the strong-baseline cohort closed half its
    // remaining headroom versus one sixth. This is the answer to "our students
    // are already good".
    assert.equal(strongBaseline.rawGain, weakBaseline.rawGain);
    assert.equal(strongBaseline.gainIndex, 0.5);
    assert.equal(weakBaseline.gainIndex, 0.17);
  });

  it("handles a maxed-out baseline without dividing by zero", () => {
    const result = analyzeGain({ baselineComposite: 100, postComposite: 100 });
    assert.equal(result.gainIndex, null);
  });

  it("leaves adjusted figures null when no retrospective was collected", () => {
    const result = analyzeGain({ baselineComposite: 40, postComposite: 60 });
    assert.equal(result.adjustedGain, null);
    assert.equal(result.calibrationGap, null);
  });

  it("can report a negative raw gain — the response-shift failure mode", () => {
    const result = analyzeGain({
      baselineComposite: 75,
      postComposite: 68,
      retrospectiveComposite: 45,
    });
    assert.equal(result.rawGain, -7);
    assert.equal(result.adjustedGain, 23);
  });
});

describe("interpretCalibration", () => {
  it("credits self-awareness only when behaviour also moved", () => {
    assert.equal(interpretCalibration(20, 25), "self_awareness_gain");
  });

  it("marks a large gap with flat behaviour as inconclusive, not a win", () => {
    assert.equal(interpretCalibration(20, 1), "inconclusive");
    assert.equal(interpretCalibration(20, null), "inconclusive");
  });

  it("reports no recalibration when the gap is small or absent", () => {
    assert.equal(interpretCalibration(1, 30), "no_recalibration");
    assert.equal(interpretCalibration(null, 30), "no_recalibration");
  });
});

describe("summarizeCohort", () => {
  const pair = (
    studentId: string,
    baselineComposite: number,
    postComposite: number,
    retrospectiveComposite: number | null = null,
    baselineBei: number | null = null,
    postBei: number | null = null
  ) => ({
    studentId,
    baselineComposite,
    postComposite,
    retrospectiveComposite,
    baselineBei,
    postBei,
  });

  it("withholds reportability below the minimum paired count", () => {
    const small = summarizeCohort([
      pair("a", 40, 60),
      pair("b", 45, 65),
      pair("c", 50, 70),
    ]);
    assert.equal(small.pairedCount, 3);
    assert.equal(small.reportable, false);
  });

  it("marks a cohort reportable once it clears the floor", () => {
    const pairs = Array.from({ length: 8 }, (_, i) =>
      pair(`s${i}`, 40, 60, 30, 20, 50)
    );
    const result = summarizeCohort(pairs);
    assert.equal(result.reportable, true);
    assert.equal(result.meanBaselineComposite, 40);
    assert.equal(result.meanPostComposite, 60);
    assert.equal(result.meanRawGain, 20);
    assert.equal(result.meanAdjustedGain, 30);
    assert.equal(result.meanCalibrationGap, 10);
    assert.equal(result.gainIndex, 0.33);
    assert.equal(result.meanBeiDelta, 30);
    assert.equal(result.bandMigrationRate, 1);
    assert.equal(result.materialImprovementRate, 1);
    assert.equal(result.calibrationVerdict, "self_awareness_gain");
  });

  it("does not let a few outliers carry the material improvement rate", () => {
    const pairs = [
      pair("a", 40, 90),
      pair("b", 40, 90),
      ...Array.from({ length: 6 }, (_, i) => pair(`f${i}`, 40, 41)),
    ];
    const result = summarizeCohort(pairs);
    assert.equal(result.meanRawGain, 13.25);
    // The average looks healthy; only a quarter of students actually moved.
    assert.equal(result.materialImprovementRate, 0.25);
  });

  it("flags a flattering retrospective with flat behaviour as inconclusive", () => {
    const pairs = Array.from({ length: 10 }, (_, i) =>
      pair(`s${i}`, 70, 72, 40, 30, 31)
    );
    const result = summarizeCohort(pairs);
    assert.equal(result.meanCalibrationGap, 30);
    assert.equal(result.calibrationVerdict, "inconclusive");
  });

  it("returns a safe empty summary for an unpaired cohort", () => {
    const result = summarizeCohort([]);
    assert.equal(result.pairedCount, 0);
    assert.equal(result.reportable, false);
    assert.equal(result.meanRawGain, 0);
  });
});

describe("isSuspectResponse", () => {
  const items = buildItems();

  it("flags straight-lining", () => {
    assert.equal(
      isSuspectResponse({
        answers: answerAll(items, 3, 3),
        durationSeconds: 600,
      }),
      true
    );
  });

  it("flags speed-running", () => {
    const answers = answerAll(items, 3, 1);
    answers[0].rawValue = 5;
    assert.equal(isSuspectResponse({ answers, durationSeconds: 45 }), true);
  });

  it("passes a varied, unhurried response", () => {
    const answers = answerAll(items, 3, 1);
    answers[0].rawValue = 5;
    answers[1].rawValue = 2;
    assert.equal(isSuspectResponse({ answers, durationSeconds: 400 }), false);
  });
});

describe("readinessDirection", () => {
  it("calls movement at or past the band a direction", () => {
    assert.equal(readinessDirection(40, 40 + READINESS_STEADY_BAND_POINTS), "improved");
    assert.equal(readinessDirection(60, 60 - READINESS_STEADY_BAND_POINTS), "declined");
  });

  it("treats small movement either way as held steady", () => {
    assert.equal(readinessDirection(50, 50), "held_steady");
    assert.equal(readinessDirection(50, 54.99), "held_steady");
    assert.equal(readinessDirection(50, 45.01), "held_steady");
  });
});
