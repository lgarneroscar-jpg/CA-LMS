import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  firstOverviewSentence,
  getOrderedContentModules,
  getPillarSlug,
  parseWorkbookContent,
  type ModuleListRow,
} from "@/lib/program";
import { parseModuleNumber } from "@/lib/program-nav";

/** Columns needed for lists, feeds, and navigation — excludes heavy JSON blobs. */
export const MODULE_CATALOG_SELECT =
  "id, module_code, title, description, slug, pillar, unlock_week, order_index, is_live_session";

export type CurriculumModuleRow = ModuleListRow & {
  overviewLine: string | null;
};

/** Content catalog plus stored workbook overview for Curriculum one-liners. */
export const getCurriculumModuleCatalog = cache(
  async (): Promise<CurriculumModuleRow[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("modules")
      .select(`${MODULE_CATALOG_SELECT}, workbook_content`)
      .eq("is_live_session", false)
      .order("unlock_week")
      .order("order_index");

    return (data ?? []).map((row) => {
      const { workbook_content, ...rest } = row;
      const overview = parseWorkbookContent(workbook_content).overview;
      return {
        ...(rest as ModuleListRow),
        overviewLine: firstOverviewSentence(overview),
      };
    });
  }
);

export const getContentModuleCatalog = cache(async (): Promise<ModuleListRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("modules")
    .select(MODULE_CATALOG_SELECT)
    .eq("is_live_session", false)
    .order("unlock_week")
    .order("order_index");

  return (data ?? []) as ModuleListRow[];
});

/** Content modules + live sessions for the visual program timeline. */
export const getTimelineModuleCatalog = cache(async (): Promise<ModuleListRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("modules")
    .select(MODULE_CATALOG_SELECT)
    .order("unlock_week")
    .order("order_index");

  return (data ?? []) as ModuleListRow[];
});

export const getStudentProgressMap = cache(
  async (studentId: string) => {
    const supabase = await createClient();
    const { data: progressRows } = await supabase
      .from("student_progress")
      .select("module_id, is_complete, xp_earned")
      .eq("student_id", studentId);

    return new Map(
      (progressRows ?? []).map((p) => [
        p.module_id,
        { is_complete: p.is_complete, xp_earned: p.xp_earned ?? 0 },
      ])
    );
  }
);

export function findNextModuleHref(
  modules: ModuleListRow[],
  progressByModuleId: Map<string, { is_complete: boolean }>,
  excludeModuleId?: string
): string | null {
  const ordered = getOrderedContentModules(modules);
  const next = ordered.find(
    (m) =>
      m.id !== excludeModuleId && !progressByModuleId.get(m.id)?.is_complete
  );

  if (!next) return null;

  const pillarSlug = getPillarSlug(next.pillar) ?? "program";
  return `/program/${pillarSlug}/${next.slug ?? next.id}`;
}
