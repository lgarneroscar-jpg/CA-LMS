/** Module codes that render the Campus Indigo v2 experience. */
export const EXPERIENCE_LIFT_MODULE_CODES: string[] = [
  "P1",
  "P2",
  "P3",
  "P4",
  "P5",
  "P6",
  "P7",
  "P8",
  "P9",
  "P10",
  "P11",
  "P12",
  "P13",
  "P14",
];

export function isExperienceLiftModule(moduleCode: string): boolean {
  return EXPERIENCE_LIFT_MODULE_CODES.includes(moduleCode);
}
