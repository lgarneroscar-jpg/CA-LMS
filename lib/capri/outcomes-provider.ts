import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CapriOutcomesPayload,
  CapriOutcomesProvider,
} from "@/lib/capri-outcomes";
import { fetchInstitutionScores } from "./queries";
import {
  MIN_N_COHORT_CLAIM,
  PILLAR_NAMES,
  summarizeCohort,
  type CapriPillar,
  type CohortPair,
} from "./scoring";

type Accumulator = {
  baselineComposite?: number;
  postComposite?: number;
  retrospectiveComposite?: number;
  baselineBei?: number;
  postBei?: number;
  baselinePillars: Partial<Record<CapriPillar, number>>;
  postPillars: Partial<Record<CapriPillar, number>>;
};

function signed(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
}

function percent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/**
 * Real implementation of the CAPRI seam left in lib/capri-outcomes.ts.
 *
 * Runs under the service role deliberately: institutional admins cannot read
 * individual scores, so cohort aggregation has to happen here rather than in a
 * client-side query. Nothing student-identifiable leaves this function.
 */
export const capriOutcomesProvider: CapriOutcomesProvider = {
  async getOutcomes({ institutionId }): Promise<CapriOutcomesPayload> {
    const adminClient = createAdminClient();
    const rows = await fetchInstitutionScores(adminClient, institutionId);

    if (rows.length === 0) return null;

    const byStudent = new Map<string, Accumulator>();

    for (const row of rows) {
      const entry: Accumulator = byStudent.get(row.studentId) ?? {
        baselinePillars: {},
        postPillars: {},
      };

      const isBaseline = row.administrationType === "baseline";

      if (row.scope === "composite") {
        if (row.ratingContext === "retrospective") {
          entry.retrospectiveComposite = row.value;
        } else if (isBaseline) {
          entry.baselineComposite = row.value;
        } else {
          entry.postComposite = row.value;
        }
      }

      if (row.scope === "bei" && row.ratingContext === "current") {
        if (isBaseline) entry.baselineBei = row.value;
        else entry.postBei = row.value;
      }

      if (row.scope === "pillar" && row.ratingContext === "current") {
        const pillar = Number(row.scopeId) as CapriPillar;
        if (isBaseline) entry.baselinePillars[pillar] = row.value;
        else entry.postPillars[pillar] = row.value;
      }

      byStudent.set(row.studentId, entry);
    }

    const pairs: CohortPair[] = [];
    const pillarPairs: { pillar: CapriPillar; before: number; after: number }[] =
      [];

    for (const [studentId, entry] of byStudent) {
      if (
        entry.baselineComposite === undefined ||
        entry.postComposite === undefined
      ) {
        continue;
      }

      pairs.push({
        studentId,
        baselineComposite: entry.baselineComposite,
        postComposite: entry.postComposite,
        retrospectiveComposite: entry.retrospectiveComposite ?? null,
        baselineBei: entry.baselineBei ?? null,
        postBei: entry.postBei ?? null,
      });

      for (const pillar of [1, 2, 3] as CapriPillar[]) {
        const before = entry.baselinePillars[pillar];
        const after = entry.postPillars[pillar];
        if (before !== undefined && after !== undefined) {
          pillarPairs.push({ pillar, before, after });
        }
      }
    }

    const baselineOnly = byStudent.size - pairs.length;

    if (pairs.length === 0) {
      return {
        summary:
          `${byStudent.size} student${byStudent.size === 1 ? "" : "s"} completed the Week 1 baseline. ` +
          "Outcome figures appear once Week 12 responses are paired to them.",
        metrics: [
          { label: "Baseline responses", value: String(byStudent.size) },
        ],
      };
    }

    const cohort = summarizeCohort(pairs);

    if (!cohort.reportable) {
      return {
        summary:
          `Only ${cohort.pairedCount} paired response${cohort.pairedCount === 1 ? "" : "s"} so far. ` +
          `Cohort-level outcome claims are withheld below ${MIN_N_COHORT_CLAIM} pairs, ` +
          "so this section reports participation only.",
        metrics: [
          { label: "Paired responses", value: String(cohort.pairedCount) },
          { label: "Baseline only", value: String(baselineOnly) },
        ],
      };
    }

    const metrics: { label: string; value: string }[] = [
      {
        label: "Cohort readiness (baseline → post)",
        value: `${cohort.meanBaselineComposite.toFixed(1)} → ${cohort.meanPostComposite.toFixed(1)} out of 100`,
      },
      {
        label: "Raw gain",
        value: `${signed(cohort.meanRawGain)} points`,
      },
    ];

    if (cohort.gainIndex !== null) {
      metrics.push({
        label: "Gain index",
        value: `${percent(cohort.gainIndex)} of available headroom closed`,
      });
    }

    if (cohort.meanAdjustedGain !== null) {
      metrics.push({
        label: "Adjusted gain (response-shift corrected)",
        value: `${signed(cohort.meanAdjustedGain)} points`,
      });
    }

    if (cohort.meanCalibrationGap !== null) {
      const verdictText =
        cohort.calibrationVerdict === "self_awareness_gain"
          ? "corroborated by behaviour change"
          : cohort.calibrationVerdict === "inconclusive"
            ? "inconclusive — behaviour did not move with it"
            : "no material recalibration";
      metrics.push({
        label: "Calibration gap (self-awareness gained)",
        value: `${signed(cohort.meanCalibrationGap)} points — ${verdictText}`,
      });
    }

    if (cohort.meanBeiDelta !== null) {
      metrics.push({
        label: "Behavioural evidence change",
        value: `${signed(cohort.meanBeiDelta)} points`,
      });
    }

    metrics.push(
      {
        label: "Band migration",
        value: `${percent(cohort.bandMigrationRate)} advanced at least one readiness band`,
      },
      {
        label: "Material improvement",
        value: `${percent(cohort.materialImprovementRate)} gained 10 or more points`,
      }
    );

    for (const pillar of [1, 2, 3] as CapriPillar[]) {
      const forPillar = pillarPairs.filter((p) => p.pillar === pillar);
      if (forPillar.length === 0) continue;
      const before =
        forPillar.reduce((sum, p) => sum + p.before, 0) / forPillar.length;
      const after =
        forPillar.reduce((sum, p) => sum + p.after, 0) / forPillar.length;
      metrics.push({
        label: `Pillar ${pillar} — ${PILLAR_NAMES[pillar]}`,
        value: `${before.toFixed(1)} → ${after.toFixed(1)} (${signed(after - before)})`,
      });
    }

    metrics.push({
      label: "Paired responses",
      value: `${cohort.pairedCount}${baselineOnly > 0 ? ` (${baselineOnly} baseline-only, excluded)` : ""}`,
    });

    const headline =
      cohort.meanBeiDelta !== null
        ? `Measured professional behaviour rose ${signed(cohort.meanBeiDelta)} points across the cohort, ` +
          `alongside a ${signed(cohort.meanRawGain)}-point move in self-assessed readiness.`
        : `Self-assessed readiness moved ${signed(cohort.meanRawGain)} points across the cohort.`;

    return {
      summary:
        `${headline} Figures cover ${cohort.pairedCount} students with paired Week 1 and Week 12 responses. ` +
        "Individual scores are not included.",
      metrics,
    };
  },
};
