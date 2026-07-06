/** Module codes that render the Campus Indigo v2 experience. */
export const EXPERIENCE_LIFT_MODULE_CODES: string[] = ["P1"];

/** When true, show a slim placeholder strip instead of the full video player. */
export const SHOW_PLACEHOLDER_VIDEO_STRIP = true;

export function isExperienceLiftModule(moduleCode: string): boolean {
  return EXPERIENCE_LIFT_MODULE_CODES.includes(moduleCode);
}
