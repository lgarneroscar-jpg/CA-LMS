import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ExerciseAnswerData } from "@/lib/exercise-answers";
import { fetchWorkbookPortfolio } from "@/lib/profile-workbook";
import { PORTFOLIO_COMPLETION_DEFINITION } from "@/lib/portfolio";
import { CONTENT_MODULE_COUNT } from "@/lib/program-completion";
import {
  parsePortfolioSelection,
  portfolioSelectionKey,
} from "@/lib/portfolio-selection";
import {
  PortfolioSelectionForm,
  type PortfolioSelectionGroup,
} from "@/components/portfolio/portfolio-selection-form";

function answerPreview(answer: ExerciseAnswerData): string {
  for (const value of Object.values(answer.values)) {
    const text = Array.isArray(value) ? value.join(", ") : typeof value === "string" ? value : "";
    const trimmed = text.replace(/\s+/g, " ").trim();
    if (trimmed) return trimmed.length > 160 ? `${trimmed.slice(0, 157)}…` : trimmed;
  }
  return "";
}

export default async function PortfolioSelectionPage() {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  if (!profile.program_completed_at) {
    const [{ data: modules }, { data: progress }] = await Promise.all([
      supabase.from("modules").select("id").eq("is_live_session", false),
      supabase
        .from("student_progress")
        .select("module_id")
        .eq("student_id", profile.id)
        .eq("is_complete", true),
    ]);
    const contentIds = new Set((modules ?? []).map((m) => m.id));
    const done = Math.min(
      (progress ?? []).filter((p) => contentIds.has(p.module_id)).length,
      CONTENT_MODULE_COUNT
    );

    return (
      <div className="experience-lift mx-auto max-w-3xl space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your portfolio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A printable document of your best work that you can keep and send to employers.
          </p>
        </div>
        <div className="lift-card space-y-3 rounded-2xl p-6">
          <h2 className="font-semibold">Unlocks when you complete the program</h2>
          <p className="text-sm text-muted-foreground">
            You&apos;ve completed {done} of {CONTENT_MODULE_COUNT} modules.{" "}
            {PORTFOLIO_COMPLETION_DEFINITION}
          </p>
          <Link
            href="/program"
            className="inline-block text-sm font-medium text-lift underline-offset-4 hover:underline"
          >
            Continue the program
          </Link>
        </div>
      </div>
    );
  }

  const pillars = await fetchWorkbookPortfolio(supabase, profile.id);
  const groups: PortfolioSelectionGroup[] = pillars.map((pillar) => ({
    pillar: pillar.pillar,
    pillarLabel: pillar.pillarLabel,
    modules: pillar.modules.map((module) => ({
      moduleId: module.moduleId,
      moduleTitle: module.moduleTitle,
      items: module.exercises.map((exercise) => ({
        key: portfolioSelectionKey(exercise.moduleId, exercise.exerciseKey),
        title: exercise.title,
        preview: answerPreview(exercise.answer),
      })),
    })),
  }));
  const available = new Set(groups.flatMap((g) => g.modules.flatMap((m) => m.items.map((i) => i.key))));
  const initialSelection = parsePortfolioSelection(profile.portfolio_selection).filter((key) =>
    available.has(key)
  );

  return (
    <div className="experience-lift mx-auto max-w-3xl space-y-6 pb-12">
      <div>
        <Link
          href="/profile"
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Profile
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Your portfolio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the workbook answers to include, then generate a document you can print or
          save as a PDF.
        </p>
      </div>

      <div
        role="note"
        className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950"
      >
        <p className="font-semibold">This document leaves Corporate Academy.</p>
        <p className="mt-1">
          Once you save or send the PDF, anyone who has it can read everything you tick
          below. It isn&apos;t affected by your public or private settings for your cohort,
          and nothing is included unless you tick it here.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="lift-card rounded-2xl p-6 text-sm text-muted-foreground">
          You don&apos;t have any saved workbook answers to include.
        </div>
      ) : (
        <PortfolioSelectionForm groups={groups} initialSelection={initialSelection} />
      )}
    </div>
  );
}
