/**
 * CAPRI v2 scoring — the single source of truth for every CAPRI number.
 *
 * Nothing else in the app may compute a readiness score. Report generation,
 * student-facing results, and admin views all call into here, so that any
 * figure in any PDF traces back to one function and stays reproducible when a
 * case study is challenged years later.
 *
 * Pure functions only: no Supabase, no IO. See lib/capri/queries.ts for reads.
 */

export const CAPRI_INSTRUMENT_VERSION = "2.0";

export type RatingContext = "current" | "retrospective";
export type CapriSection = "core" | "behavioral";
export type CapriItemType = "likert5" | "frequency_band";
export type CapriPillar = 1 | 2 | 3;

export type CapriItem = {
  id: string;
  section: CapriSection;
  pillar: CapriPillar;
  subdimension: string | null;
  itemType: CapriItemType;
  prompt: string;
  orderIndex: number;
};

export type CapriAnswer = {
  itemId: string;
  ratingContext: RatingContext;
  rawValue: number;
};

/** Likert anchors, low to high. Index + 1 is the stored value. */
export const LIKERT_LABELS = [
  "Strongly disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly agree",
] as const;

/**
 * Behavioural counts are banded rather than free-numeric: it removes typo
 * outliers, blunts the incentive to inflate a precise number, and renders as a
 * radio group with no validation logic.
 */
export const FREQUENCY_BANDS = [
  { value: 0, label: "0" },
  { value: 1, label: "1–2" },
  { value: 2, label: "3–5" },
  { value: 3, label: "6–10" },
  { value: 4, label: "11+" },
] as const;

export const BEHAVIORAL_PROMPT_STEM = "Thinking about the last 30 days only —";

export const PILLAR_NAMES: Record<CapriPillar, string> = {
  1: "Identity & Brand Building",
  2: "Executive Communication & Social Capital",
  3: "Career Navigation Strategy & Execution",
};

export const SUBDIMENSION_NAMES: Record<string, string> = {
  "1A": "Professional Self-Concept",
  "1B": "Standards & Ownership",
  "1C": "Presence & Positioning",
  "2A": "Clarity & Structure",
  "2B": "Composure & Audience Adaptation",
  "2C": "Relationship Capital",
  "3A": "Direction & Opportunity Strategy",
  "3B": "Judgment in Ambiguity",
  "3C": "Operating System & Reliability",
};

export type ReadinessBand =
  | "emerging"
  | "developing"
  | "program_ready"
  | "advanced";

export const READINESS_BANDS: {
  band: ReadinessBand;
  label: string;
  min: number;
  max: number;
  meaning: string;
}[] = [
  {
    band: "emerging",
    label: "Emerging",
    min: 0,
    max: 39.99,
    meaning:
      "Little professional self-concept or system in place. Needs Pillar 1 foundations before anything else lands.",
  },
  {
    band: "developing",
    label: "Developing",
    min: 40,
    max: 59.99,
    meaning:
      "Aware of what is required, inconsistent in practice. The modal Week 1 student.",
  },
  {
    band: "program_ready",
    label: "Program-Ready",
    min: 60,
    max: 79.99,
    meaning:
      "Operating with intent. The program compounds existing habits rather than installing them.",
  },
  {
    band: "advanced",
    label: "Advanced",
    min: 80,
    max: 100,
    meaning:
      "Already executing at a young-professional standard. Best deployed as cohort peer leaders.",
  },
];

const BAND_ORDER: ReadinessBand[] = [
  "emerging",
  "developing",
  "program_ready",
  "advanced",
];

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Likert mean (1–5) onto a 0–100 scale. */
export function likertMeanToScore(mean: number): number {
  return round2(((mean - 1) / 4) * 100);
}

/** Frequency-band mean (0–4) onto a 0–100 scale. */
export function bandMeanToScore(mean: number): number {
  return round2((mean / 4) * 100);
}

export function bandForScore(score: number): ReadinessBand {
  const match = READINESS_BANDS.find(
    (b) => score >= b.min && score <= b.max
  );
  // Scores are clamped 0–100 upstream; fall back to the nearest edge.
  return match?.band ?? (score < 0 ? "emerging" : "advanced");
}

export function bandLabel(band: ReadinessBand): string {
  return READINESS_BANDS.find((b) => b.band === band)?.label ?? "Unknown";
}

/** How many bands separate two scores. Negative means regression. */
export function bandMovement(before: number, after: number): number {
  return BAND_ORDER.indexOf(bandForScore(after)) -
    BAND_ORDER.indexOf(bandForScore(before));
}

export type ScoredResponse = {
  ratingContext: RatingContext;
  /** Keyed by sub-dimension id, e.g. "1A". Internal coaching detail only. */
  subdimensions: Record<string, number>;
  /** Keyed by pillar number. */
  pillars: Record<CapriPillar, number>;
  composite: number;
  band: ReadinessBand;
  /** Null when the behavioural block was not answered in this context. */
  bei: number | null;
};

export class CapriScoringError extends Error {}

/**
 * Score one response in one rating context.
 *
 * Throws on missing core answers rather than silently averaging a partial
 * response — a composite computed from 20 of 27 items is not comparable to one
 * computed from 27, and a quietly wrong outcome number is worse than none.
 */
export function scoreResponse(
  items: CapriItem[],
  answers: CapriAnswer[],
  ratingContext: RatingContext = "current"
): ScoredResponse {
  const inContext = answers.filter((a) => a.ratingContext === ratingContext);
  const byItem = new Map(inContext.map((a) => [a.itemId, a.rawValue]));

  const coreItems = items.filter((i) => i.section === "core");
  const behavioralItems = items.filter((i) => i.section === "behavioral");

  const missing = coreItems
    .filter((i) => !byItem.has(i.id))
    .map((i) => i.id);
  if (missing.length > 0) {
    throw new CapriScoringError(
      `Cannot score ${ratingContext} response: missing ${missing.length} core ` +
        `answer(s) — ${missing.join(", ")}`
    );
  }

  const subdimensionGroups = new Map<string, number[]>();
  const pillarGroups = new Map<CapriPillar, number[]>();

  for (const item of coreItems) {
    const value = byItem.get(item.id) as number;
    if (value < 1 || value > 5) {
      throw new CapriScoringError(
        `Item ${item.id} has out-of-range Likert value ${value}`
      );
    }
    if (item.subdimension) {
      const bucket = subdimensionGroups.get(item.subdimension) ?? [];
      bucket.push(value);
      subdimensionGroups.set(item.subdimension, bucket);
    }
    const pillarBucket = pillarGroups.get(item.pillar) ?? [];
    pillarBucket.push(value);
    pillarGroups.set(item.pillar, pillarBucket);
  }

  const subdimensions: Record<string, number> = {};
  for (const [key, values] of subdimensionGroups) {
    subdimensions[key] = likertMeanToScore(mean(values));
  }

  const pillars = {} as Record<CapriPillar, number>;
  for (const [pillar, values] of pillarGroups) {
    pillars[pillar] = likertMeanToScore(mean(values));
  }

  const pillarScores = ([1, 2, 3] as CapriPillar[])
    .map((p) => pillars[p])
    .filter((v): v is number => typeof v === "number");

  if (pillarScores.length !== 3) {
    throw new CapriScoringError(
      "Cannot compute a composite without all three pillar scores"
    );
  }

  // Equal weighting is deliberate. The pillars are sequential but not
  // hierarchical, and equal weights keep the score explainable in one sentence.
  const composite = round2(mean(pillarScores));

  const behavioralValues = behavioralItems
    .map((i) => byItem.get(i.id))
    .filter((v): v is number => typeof v === "number");

  const bei =
    behavioralValues.length === behavioralItems.length &&
    behavioralItems.length > 0
      ? bandMeanToScore(mean(behavioralValues))
      : null;

  return {
    ratingContext,
    subdimensions,
    pillars,
    composite,
    band: bandForScore(composite),
    bei,
  };
}

export type GainAnalysis = {
  /** Post minus the original Week 1 rating. The conservative figure. */
  rawGain: number;
  /** Post minus the Week 12 retrospective rating. Null without a retrospective. */
  adjustedGain: number | null;
  /** Original baseline minus retrospective baseline: measured over-rating. */
  calibrationGap: number | null;
  /** Share of the available headroom closed, 0–1. Null when already at 100. */
  gainIndex: number | null;
  /** Bands moved, using raw baseline to post. */
  bandsMoved: number;
  beiDelta: number | null;
};

export function analyzeGain(input: {
  baselineComposite: number;
  postComposite: number;
  retrospectiveComposite?: number | null;
  baselineBei?: number | null;
  postBei?: number | null;
}): GainAnalysis {
  const {
    baselineComposite,
    postComposite,
    retrospectiveComposite = null,
    baselineBei = null,
    postBei = null,
  } = input;

  const headroom = 100 - baselineComposite;

  return {
    rawGain: round2(postComposite - baselineComposite),
    adjustedGain:
      retrospectiveComposite === null
        ? null
        : round2(postComposite - retrospectiveComposite),
    calibrationGap:
      retrospectiveComposite === null
        ? null
        : round2(baselineComposite - retrospectiveComposite),
    gainIndex:
      headroom <= 0
        ? null
        : round2((postComposite - baselineComposite) / headroom),
    bandsMoved: bandMovement(baselineComposite, postComposite),
    beiDelta:
      baselineBei === null || postBei === null
        ? null
        : round2(postBei - baselineBei),
  };
}

export type CalibrationVerdict =
  | "self_awareness_gain"
  | "inconclusive"
  | "no_recalibration";

/**
 * The governing rule from the CAPRI v2 spec: a positive calibration gap only
 * counts as gained self-awareness when behaviour also moved. A large gap with
 * flat behaviour is a flattery artifact — students under-rating their former
 * selves because it reflects well on the program — and must be reported as
 * inconclusive rather than as a win.
 */
export function interpretCalibration(
  calibrationGap: number | null,
  beiDelta: number | null,
  options: { gapThreshold?: number; beiThreshold?: number } = {}
): CalibrationVerdict {
  const { gapThreshold = 5, beiThreshold = 5 } = options;
  if (calibrationGap === null || calibrationGap < gapThreshold) {
    return "no_recalibration";
  }
  if (beiDelta === null || beiDelta < beiThreshold) {
    return "inconclusive";
  }
  return "self_awareness_gain";
}

/** Reporting floors from the spec, enforced before any cohort claim ships. */
export const MIN_N_COHORT_CLAIM = 8;
export const MIN_N_SUBDIMENSION = 5;
export const MATERIAL_IMPROVEMENT_POINTS = 10;

export type CohortPair = {
  studentId: string;
  baselineComposite: number;
  postComposite: number;
  retrospectiveComposite: number | null;
  baselineBei: number | null;
  postBei: number | null;
};

export type CohortOutcome = {
  pairedCount: number;
  /** True when pairedCount clears MIN_N_COHORT_CLAIM. */
  reportable: boolean;
  meanBaselineComposite: number;
  meanPostComposite: number;
  meanRawGain: number;
  meanAdjustedGain: number | null;
  meanCalibrationGap: number | null;
  gainIndex: number | null;
  meanBeiDelta: number | null;
  /** Share of students advancing at least one band, 0–1. */
  bandMigrationRate: number;
  /** Share gaining at least MATERIAL_IMPROVEMENT_POINTS, 0–1. */
  materialImprovementRate: number;
  calibrationVerdict: CalibrationVerdict;
};

export function summarizeCohort(pairs: CohortPair[]): CohortOutcome {
  const pairedCount = pairs.length;

  if (pairedCount === 0) {
    return {
      pairedCount: 0,
      reportable: false,
      meanBaselineComposite: 0,
      meanPostComposite: 0,
      meanRawGain: 0,
      meanAdjustedGain: null,
      meanCalibrationGap: null,
      gainIndex: null,
      meanBeiDelta: null,
      bandMigrationRate: 0,
      materialImprovementRate: 0,
      calibrationVerdict: "no_recalibration",
    };
  }

  const analyses = pairs.map((p) =>
    analyzeGain({
      baselineComposite: p.baselineComposite,
      postComposite: p.postComposite,
      retrospectiveComposite: p.retrospectiveComposite,
      baselineBei: p.baselineBei,
      postBei: p.postBei,
    })
  );

  const meanBaseline = round2(mean(pairs.map((p) => p.baselineComposite)));
  const meanPost = round2(mean(pairs.map((p) => p.postComposite)));
  const headroom = 100 - meanBaseline;

  const adjusted = analyses
    .map((a) => a.adjustedGain)
    .filter((v): v is number => v !== null);
  const calibration = analyses
    .map((a) => a.calibrationGap)
    .filter((v): v is number => v !== null);
  const beiDeltas = analyses
    .map((a) => a.beiDelta)
    .filter((v): v is number => v !== null);

  const meanCalibrationGap =
    calibration.length > 0 ? round2(mean(calibration)) : null;
  const meanBeiDelta = beiDeltas.length > 0 ? round2(mean(beiDeltas)) : null;

  return {
    pairedCount,
    reportable: pairedCount >= MIN_N_COHORT_CLAIM,
    meanBaselineComposite: meanBaseline,
    meanPostComposite: meanPost,
    meanRawGain: round2(mean(analyses.map((a) => a.rawGain))),
    meanAdjustedGain: adjusted.length > 0 ? round2(mean(adjusted)) : null,
    meanCalibrationGap,
    gainIndex: headroom <= 0 ? null : round2((meanPost - meanBaseline) / headroom),
    meanBeiDelta,
    bandMigrationRate: round2(
      analyses.filter((a) => a.bandsMoved >= 1).length / pairedCount
    ),
    materialImprovementRate: round2(
      analyses.filter((a) => a.rawGain >= MATERIAL_IMPROVEMENT_POINTS).length /
        pairedCount
    ),
    calibrationVerdict: interpretCalibration(meanCalibrationGap, meanBeiDelta),
  };
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Straight-lining and speed-running are excluded before cohort aggregation. */
export function isSuspectResponse(input: {
  answers: CapriAnswer[];
  durationSeconds: number | null;
}): boolean {
  const current = input.answers.filter((a) => a.ratingContext === "current");
  if (current.length === 0) return true;
  if (input.durationSeconds !== null && input.durationSeconds < 90) return true;
  const distinct = new Set(current.map((a) => a.rawValue));
  return distinct.size === 1;
}
