/**
 * CAPRI outcomes — pluggable interface for institutional impact reporting.
 *
 * CAPRI is designed in a separate thread and does not exist yet.
 * Report generation must remain stable when this returns null.
 * Adding real CAPRI later should only require a provider implementation —
 * not changes to the report generator layout.
 */

export type CapriOutcomesPayload = {
  /** Reserved. Populate when CAPRI lands. */
  summary?: string;
  metrics?: { label: string; value: string }[];
} | null;

export type CapriOutcomesContext = {
  institutionId: string;
  periodStart: string;
  periodEnd: string;
};

export interface CapriOutcomesProvider {
  getOutcomes(context: CapriOutcomesContext): Promise<CapriOutcomesPayload>;
}

/** Default provider — always absent until CAPRI is wired. */
export const nullCapriOutcomesProvider: CapriOutcomesProvider = {
  async getOutcomes() {
    return null;
  },
};

let activeProvider: CapriOutcomesProvider = nullCapriOutcomesProvider;

/** Swap in a real provider later without touching the report renderer. */
export function setCapriOutcomesProvider(provider: CapriOutcomesProvider) {
  activeProvider = provider;
}

export async function fetchCapriOutcomes(
  context: CapriOutcomesContext
): Promise<CapriOutcomesPayload> {
  return activeProvider.getOutcomes(context);
}
