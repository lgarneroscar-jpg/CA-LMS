import type { Tables } from "@/types/database";
import { PILLARS, type PillarNumber, type WorkbookContent } from "@/types/modules";
import { normalizeWorkbookBlock } from "@/lib/content-normalize";

export type ModuleRow = Tables<"modules">;

export type ModuleListRow = Pick<
  ModuleRow,
  | "id"
  | "module_code"
  | "title"
  | "description"
  | "slug"
  | "pillar"
  | "unlock_week"
  | "order_index"
  | "is_live_session"
>;

export type ProgressModuleRef = Pick<
  ModuleRow,
  "id" | "unlock_week" | "is_live_session" | "order_index"
>;

export function getPillarSlug(pillar: number): string | null {
  return PILLARS[pillar as PillarNumber]?.slug ?? null;
}

export function getPillarFromSlug(slug: string): PillarNumber | null {
  const entry = Object.entries(PILLARS).find(([, p]) => p.slug === slug);
  return entry ? (Number(entry[0]) as PillarNumber) : null;
}

export function getPillarLabel(pillar: number): string {
  return PILLARS[pillar as PillarNumber]?.label ?? `Pillar ${pillar}`;
}

export function parseWorkbookContent(raw: unknown): WorkbookContent {
  const fallback: WorkbookContent = {
    estimated_minutes: 30,
    blocks: [],
  };
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  const blocks = Array.isArray(obj.blocks)
    ? obj.blocks
        .map((block) =>
          block && typeof block === "object"
            ? normalizeWorkbookBlock(block as Record<string, unknown>)
            : null
        )
        .filter((block): block is WorkbookContent["blocks"][number] => block !== null)
    : [];
  return {
    estimated_minutes:
      typeof obj.estimated_minutes === "number" ? obj.estimated_minutes : 30,
    overview: typeof obj.overview === "string" ? obj.overview : undefined,
    blocks,
    completion_check: Array.isArray(obj.completion_check)
      ? obj.completion_check.map((item) => String(item))
      : undefined,
  };
}

export type FeedModule = {
  id: string;
  module_code: string;
  title: string;
  description: string | null;
  slug: string;
  pillar: number;
  pillarSlug: string;
  unlock_week: number;
  isUnlocked: boolean;
  isComplete: boolean;
  xpEarned: number;
};

export type WeekFeed = {
  weekNumber: number;
  label: "Last Week" | "This Week" | "Next Week";
  modules: FeedModule[];
  isCurrentWeek: boolean;
  isLocked: boolean;
};

export function getOrderedContentModules(modules: ModuleListRow[]): ModuleListRow[] {
  return [...modules]
    .filter((m) => !m.is_live_session)
    .sort(
      (a, b) =>
        (a.unlock_week ?? 1) - (b.unlock_week ?? 1) ||
        (a.order_index ?? 0) - (b.order_index ?? 0)
    );
}

export function getMaxProgramWeek(modules: ProgressModuleRef[]): number {
  const content = modules.filter((m) => !m.is_live_session);
  if (content.length === 0) return 1;
  return Math.max(1, ...content.map((m) => m.unlock_week ?? 1));
}

/** Week containing the student's next incomplete module (progress-based). */
export function getProgressWeek(
  modules: ProgressModuleRef[],
  progressByModuleId: Map<string, { is_complete: boolean; xp_earned: number }>
): number {
  const ordered = [...modules]
    .filter((m) => !m.is_live_session)
    .sort(
      (a, b) =>
        (a.unlock_week ?? 1) - (b.unlock_week ?? 1) ||
        (a.order_index ?? 0) - (b.order_index ?? 0)
    );

  if (ordered.length === 0) return 1;

  const nextIncomplete = ordered.find(
    (m) => !progressByModuleId.get(m.id)?.is_complete
  );

  if (nextIncomplete) {
    return Math.max(1, nextIncomplete.unlock_week ?? 1);
  }

  return Math.max(1, ordered[ordered.length - 1].unlock_week ?? 1);
}

function clampWeek(week: number, maxWeek: number): number {
  if (!Number.isFinite(week) || week < 1) return 1;
  return Math.min(maxWeek, Math.max(1, Math.floor(week)));
}

/**
 * Progress-based timeline: Last / Current / Next week follow completion,
 * not the cohort calendar. Everyone starts at Week 1 until they advance.
 */
export function buildProgramFeed(params: {
  modules: ModuleListRow[];
  progressByModuleId: Map<string, { is_complete: boolean; xp_earned: number }>;
  programStartedAt: string | null;
  diagnosticComplete?: boolean;
}): { currentWeek: number; weeks: WeekFeed[]; maxWeek: number } {
  try {
    const diagnosticComplete = params.diagnosticComplete ?? true;
    const maxWeek = getMaxProgramWeek(params.modules);
    const progressWeek = getProgressWeek(
      params.modules,
      params.progressByModuleId
    );

    // Before Go, timeline stays at Week 1; after Go, follows progress.
    const centerWeek = params.programStartedAt
      ? clampWeek(progressWeek, maxWeek)
      : 1;

    const lastWeek = clampWeek(centerWeek - 1, maxWeek);
    const nextWeek = clampWeek(centerWeek + 1, maxWeek);
    const weekNumbers = [...new Set([lastWeek, centerWeek, nextWeek])].sort(
      (a, b) => a - b
    );

    const weekLabels: Record<number, WeekFeed["label"]> = {};
    for (const w of weekNumbers) {
      if (w === centerWeek - 1) weekLabels[w] = "Last Week";
      else if (w === centerWeek) weekLabels[w] = "This Week";
      else if (w === centerWeek + 1) weekLabels[w] = "Next Week";
      else weekLabels[w] = "This Week";
    }

    const contentModules = getOrderedContentModules(params.modules);

    const weeks: WeekFeed[] = weekNumbers.map((weekNumber) => {
      const weekModules = contentModules
        .filter((m) => (m.unlock_week ?? 1) === weekNumber)
        .map((m) => {
          const progress = params.progressByModuleId.get(m.id);
          const pillarSlug = getPillarSlug(m.pillar) ?? "program";
          return {
            id: m.id,
            module_code: m.module_code ?? "—",
            title: m.title ?? "Module",
            description: m.description,
            slug: m.slug ?? m.id,
            pillar: m.pillar ?? 1,
            pillarSlug,
            unlock_week: m.unlock_week ?? 1,
            isUnlocked: diagnosticComplete,
            isComplete: progress?.is_complete ?? false,
            xpEarned: progress?.xp_earned ?? 0,
          };
        });

      return {
        weekNumber,
        label: weekLabels[weekNumber] ?? "This Week",
        modules: weekModules,
        isCurrentWeek: weekNumber === centerWeek,
        isLocked: false,
      };
    });

    return { currentWeek: centerWeek, weeks, maxWeek };
  } catch (error) {
    console.error("[buildProgramFeed]", error);
    return {
      currentWeek: 1,
      maxWeek: 1,
      weeks: [
        {
          weekNumber: 1,
          label: "This Week",
          modules: [],
          isCurrentWeek: true,
          isLocked: false,
        },
      ],
    };
  }
}

export function findNextModule(feed: FeedModule[]): FeedModule | null {
  return feed.find((m) => !m.isComplete) ?? null;
}
