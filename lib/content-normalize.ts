import type { ExerciseField, WorkbookBlock } from "@/types/modules";

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
  return null;
}

export function normalizeExerciseField(raw: Record<string, unknown>): ExerciseField | null {
  const key = String(raw.key ?? "");
  const label = String(raw.label ?? "");
  if (!key || !label) return null;

  const instructions =
    typeof raw.instructions === "string" ? raw.instructions : undefined;
  const inputType = String(raw.input_type ?? raw.type ?? "text");

  if (inputType === "radio" || inputType === "choice") {
    const options = Array.isArray(raw.options)
      ? raw.options.map((o) => String(o))
      : [];
    return { key, label, instructions, type: "choice", options };
  }

  if (inputType === "checklist" || inputType === "checkbox") {
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
