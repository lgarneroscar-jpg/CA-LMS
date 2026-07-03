import type { ExerciseFieldPrompt, ExerciseInputType } from "@/types/modules";

/** Stored JSON shape for exercise_answers.answer */
export type ExerciseAnswerData = {
  values: Record<string, string | number | boolean | string[]>;
};

export type SavedExerciseAnswer = {
  exercise_key: string;
  answer: ExerciseAnswerData;
  is_public: boolean;
  updated_at: string;
};

export function emptyAnswerData(): ExerciseAnswerData {
  return { values: {} };
}

export function parseAnswerData(raw: unknown): ExerciseAnswerData {
  if (!raw || typeof raw !== "object") return emptyAnswerData();
  const obj = raw as Record<string, unknown>;
  const values = obj.values;
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    return emptyAnswerData();
  }
  const parsed: ExerciseAnswerData["values"] = {};
  for (const [key, value] of Object.entries(values)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      (Array.isArray(value) && value.every((v) => typeof v === "string"))
    ) {
      parsed[key] = value as string | number | boolean | string[];
    }
  }
  return { values: parsed };
}

export function getStringValue(
  data: ExerciseAnswerData,
  key: string
): string {
  const v = data.values[key];
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return "";
}

export function getBoolValue(data: ExerciseAnswerData, key: string): boolean {
  const v = data.values[key];
  if (typeof v === "boolean") return v;
  return v === "true";
}

export function getNumberValue(data: ExerciseAnswerData, key: string): number {
  const v = data.values[key];
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim()) return Number(v) || 0;
  return 0;
}

export function getStringArrayValue(
  data: ExerciseAnswerData,
  key: string
): string[] {
  const v = data.values[key];
  if (Array.isArray(v)) return v;
  return [];
}

export type RewritePair = {
  index: number;
  beforeKey: string;
  afterKey: string;
  beforeLabel: string;
  afterLabel: string;
};

export function groupRewritePairs(fields: ExerciseFieldPrompt[]): RewritePair[] {
  const byIndex = new Map<number, ExerciseFieldPrompt[]>();
  for (const field of fields) {
    const match = field.key.match(/_(\d+)$/);
    const index = match ? Number(match[1]) : 1;
    const list = byIndex.get(index) ?? [];
    list.push(field);
    byIndex.set(index, list);
  }

  const pairs: RewritePair[] = [];
  for (const [index, group] of [...byIndex.entries()].sort((a, b) => a[0] - b[0])) {
    if (group.length >= 2) {
      pairs.push({
        index,
        beforeKey: group[0].key,
        afterKey: group[1].key,
        beforeLabel: group[0].label,
        afterLabel: group[1].label,
      });
    }
  }
  return pairs;
}

export type AnchorPair = {
  index: number;
  anchorKey: string;
  reasonKey: string;
};

export function groupAnchorPairs(fields: ExerciseFieldPrompt[]): AnchorPair[] {
  const pairs: AnchorPair[] = [];
  const anchorFields = fields.filter((f) => /^anchor\d+$/i.test(f.key));
  for (const anchor of anchorFields) {
    const indexMatch = anchor.key.match(/\d+/);
    const index = indexMatch ? Number(indexMatch[0]) : pairs.length + 1;
    const reason = fields.find(
      (f) => f.key.toLowerCase() === `reason${index}`
    );
    if (reason) {
      pairs.push({
        index,
        anchorKey: anchor.key,
        reasonKey: reason.key,
      });
    }
  }
  return pairs;
}

export type TierGroup = {
  tierLabel: string;
  fields: ExerciseFieldPrompt[];
};

export function groupTierFields(fields: ExerciseFieldPrompt[]): TierGroup[] {
  const groups = new Map<string, ExerciseFieldPrompt[]>();
  for (const field of fields) {
    const tierMatch = field.label.match(/^(Tier\s*\d+)/i);
    const tierLabel = tierMatch ? tierMatch[1] : "Other";
    const list = groups.get(tierLabel) ?? [];
    list.push(field);
    groups.set(tierLabel, list);
  }
  return [...groups.entries()].map(([tierLabel, tierFields]) => ({
    tierLabel,
    fields: tierFields,
  }));
}

export function scoreFieldKeys(fieldKey: string) {
  return {
    score: `${fieldKey}_score`,
    notes: `${fieldKey}_notes`,
  };
}

export function parseFillBlankParts(template: string): string[] {
  return template.split(/_{3,}/);
}

export function blankKeysForTemplate(
  exerciseKey: string,
  blankCount: number
): string[] {
  return Array.from({ length: blankCount }, (_, i) => `${exerciseKey}_blank_${i}`);
}

export function starFieldMap(fields: ExerciseFieldPrompt[]) {
  const findKey = (words: string[]) =>
    fields.find((f) =>
      words.some((w) => f.label.toLowerCase().includes(w.toLowerCase()))
    )?.key;

  return {
    situation: findKey(["situation"]) ?? fields[0]?.key ?? "situation",
    task: findKey(["task"]) ?? fields[1]?.key ?? "task",
    action: findKey(["action"]) ?? fields[2]?.key ?? "action",
    result: findKey(["result", "learning"]) ?? fields[3]?.key ?? "result",
  };
}

export function isAnswerEmpty(
  inputType: ExerciseInputType,
  data: ExerciseAnswerData,
  fields: ExerciseFieldPrompt[]
): boolean {
  switch (inputType) {
    case "reflection":
    case "fill_blank":
    case "tier_map":
      return fields.every((f) => !getStringValue(data, f.key).trim());
    case "rewrite_pairs":
      return groupRewritePairs(fields).every(
        (p) =>
          !getStringValue(data, p.beforeKey).trim() &&
          !getStringValue(data, p.afterKey).trim()
      );
    case "anchor_select":
      return groupAnchorPairs(fields).every(
        (p) =>
          !getStringValue(data, p.anchorKey).trim() &&
          !getStringValue(data, p.reasonKey).trim()
      );
    case "star": {
      const map = starFieldMap(fields);
      return Object.values(map).every((k) => !getStringValue(data, k).trim());
    }
    case "checklist":
      return fields.every((f) => !getBoolValue(data, f.key));
    case "scorecard":
      return fields.every((f) => {
        const { score, notes } = scoreFieldKeys(f.key);
        return getNumberValue(data, score) === 0 && !getStringValue(data, notes).trim();
      });
    default:
      return Object.keys(data.values).length === 0;
  }
}

export function formatAnswerTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
