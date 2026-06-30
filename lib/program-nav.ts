import {
  getPillarLabel,
  getPillarSlug,
  type ModuleListRow,
} from "@/lib/program";

export type ProgramNavModule = {
  id: string;
  moduleCode: string;
  title: string;
  slug: string;
  unlockWeek: number;
  href: string;
};

export type ProgramNavPillar = {
  pillar: number;
  label: string;
  slug: string;
  modules: ProgramNavModule[];
};

/** Numeric P-code from module_code (e.g. P14 → 14) for ascending sort. */
export function parseModuleNumber(moduleCode: string): number {
  const match = moduleCode.match(/^P(\d+)$/i);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

/**
 * Groups catalog modules by pillar for navigation.
 * Uses the same pillar slugs/labels as the Program page; modules sort by P-number ASC.
 */
export function buildProgramNavByPillar(
  modules: ModuleListRow[]
): ProgramNavPillar[] {
  return ([1, 2, 3] as const).map((pillar) => {
    const pillarSlug = getPillarSlug(pillar) ?? "program";

    const pillarModules = modules
      .filter((m) => m.pillar === pillar)
      .sort(
        (a, b) =>
          parseModuleNumber(a.module_code) - parseModuleNumber(b.module_code)
      )
      .map((m) => ({
        id: m.id,
        moduleCode: m.module_code,
        title: m.title,
        slug: m.slug ?? m.id,
        unlockWeek: m.unlock_week ?? 1,
        href: `/program/${pillarSlug}/${m.slug ?? m.id}`,
      }));

    return {
      pillar,
      label: getPillarLabel(pillar),
      slug: pillarSlug,
      modules: pillarModules,
    };
  });
}
