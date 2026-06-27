import type { ExerciseField } from "@/types/modules";
import type { ExerciseSeed, ModuleSeed } from "./types";
import { PILLAR_1_MODULES } from "./pillar-1";
import { PILLAR_2_MODULES } from "./pillar-2";
import { PILLAR_3_MODULES } from "./pillar-3";
import { LIVE_SESSIONS } from "./live-sessions";

export type {
  WorkbookBlockSeed,
  ExerciseSeed,
  QuizSeed,
  ModuleSeed,
  LiveSessionSeed,
} from "./types";

export { PILLAR_1_MODULES } from "./pillar-1";
export { PILLAR_2_MODULES } from "./pillar-2";
export { PILLAR_3_MODULES } from "./pillar-3";
export { LIVE_SESSIONS } from "./live-sessions";

export const ALL_MODULES: ModuleSeed[] = [
  ...PILLAR_1_MODULES,
  ...PILLAR_2_MODULES,
  ...PILLAR_3_MODULES,
];

/** Map seed exercise shape to DB / UI exercise fields. */
export function toDbExercise(seed: ExerciseSeed): ExerciseField {
  if (seed.input_type === "radio") {
    return {
      key: seed.key,
      type: "choice",
      label: seed.label,
      instructions: seed.instructions,
      options: seed.options ?? [],
    };
  }

  if (seed.input_type === "checklist") {
    return {
      key: seed.key,
      type: "checkbox",
      label: seed.label,
      instructions: seed.instructions,
    };
  }

  return {
    key: seed.key,
    type: "text",
    label: seed.label,
    instructions: seed.instructions,
    placeholder: seed.placeholder,
    multiline: seed.multiline,
  };
}

export function toDbWorkbookContent(module: ModuleSeed) {
  return {
    estimated_minutes: module.estimated_minutes,
    blocks: module.workbook,
  };
}

export function toDbExercises(module: ModuleSeed) {
  return module.exercises.map(toDbExercise);
}
