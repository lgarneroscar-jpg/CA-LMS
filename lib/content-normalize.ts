import type { ExerciseField, ExerciseInputType, WorkbookBlock } from "@/types/modules";

const STRUCTURED_INPUT_TYPES = new Set([
  "anchor_select",
  "rewrite_pairs",
  "fill_blank",
  "reflection",
  "checklist",
  "star",
  "tier_map",
  "scorecard",
]);

/** Normalize legacy or editor block shapes for rendering. */
export function normalizeWorkbookBlock(raw: Record<string, unknown>): WorkbookBlock | null {
  const type = String(raw.type ?? "");
  if (type === "heading") {
    return {
      type: "heading",
      level: raw.level === 3 ? 3 : 2,
      text: String(raw.text ?? ""),
    };
  }
  if (type === "paragraph") {
    return { type: "paragraph", text: String(raw.text ?? "") };
  }
  if (type === "callout" || type === "framework_callout") {
    return {
      type: "framework_callout",
      title: String(raw.title ?? ""),
      body: String(raw.body ?? ""),
    };
  }
  if (type === "concept_block") {
    return {
      type: "concept_block",
      title: String(raw.title ?? ""),
      body: String(raw.body ?? ""),
    };
  }
  if (type === "application" && Array.isArray(raw.items)) {
    return {
      type: "application",
      items: raw.items.map((item) => String(item)),
    };
  }
  return null;
}

export function normalizeExerciseField(raw: Record<string, unknown>): ExerciseField | null {
  const key = String(raw.key ?? "");
  if (!key) return null;

  const inputType = String(raw.input_type ?? "");
  if (STRUCTURED_INPUT_TYPES.has(inputType) && Array.isArray(raw.fields)) {
    const title = String(raw.title ?? raw.label ?? key);
    return {
      key,
      title,
      label: String(raw.label ?? title),
      instructions: String(raw.instructions ?? ""),
      input_type: inputType as ExerciseInputType,
      fields: raw.fields
        .map((field, index) => {
          if (!field || typeof field !== "object") return null;
          const f = field as Record<string, unknown>;
          const label = String(f.label ?? "");
          if (!label) return null;
          return {
            key: String(f.key ?? `field_${index + 1}`),
            label,
          };
        })
        .filter((field): field is { key: string; label: string } => field !== null),
    };
  }

  const label = String(raw.label ?? "");
  if (!label) return null;

  const instructions =
    typeof raw.instructions === "string" ? raw.instructions : undefined;
  const legacyType = String(raw.type ?? raw.input_type ?? "text");

  if (legacyType === "radio" || legacyType === "choice") {
    const options = Array.isArray(raw.options)
      ? raw.options.map((o) => String(o))
      : [];
    return { key, label, instructions, type: "choice", options };
  }

  if (legacyType === "checklist" || legacyType === "checkbox") {
    return { key, label, instructions, type: "checkbox" };
  }

  return {
    key,
    label,
    instructions,
    type: "text",
    placeholder:
      typeof raw.placeholder === "string" ? raw.placeholder : undefined,
    multiline: Boolean(raw.multiline),
  };
}
