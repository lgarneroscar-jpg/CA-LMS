/** Exercises are identified by module + key so a selection survives answer edits. */
export function portfolioSelectionKey(moduleId: string, exerciseKey: string): string {
  return `${moduleId}:${exerciseKey}`;
}

const MAX_SELECTION = 500;

/** Tolerates a missing column, malformed JSON, and duplicates — all read as "nothing selected". */
export function parsePortfolioSelection(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  for (const value of raw) {
    if (typeof value === "string" && value.includes(":")) seen.add(value);
    if (seen.size >= MAX_SELECTION) break;
  }
  return [...seen];
}
