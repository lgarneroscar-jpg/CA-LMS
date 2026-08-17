import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getPillarDescription,
  getPillarLabel,
  getPillarSlug,
  getPillarWeeks,
  getProgressWeek,
} from "@/lib/program";
import { parseModuleNumber } from "@/lib/program-nav";
import {
  getCurriculumModuleCatalog,
  getStudentProgressMap,
} from "@/lib/modules-queries";
import { cn } from "@/lib/utils";

export default async function ProgramPage() {
  const profile = await requireRole(["student"]);

  const [institutionResult, modules, progressMap] = await Promise.all([
    profile.institution_id
      ? createClient().then((supabase) =>
          supabase
            .from("institutions")
            .select("name")
            .eq("id", profile.institution_id!)
            .single()
        )
      : Promise.resolve({ data: null }),
    getCurriculumModuleCatalog(),
    getStudentProgressMap(profile.id),
  ]);

  const institution = institutionResult.data;
  const progressWeek = getProgressWeek(modules, progressMap);
  const diagnosticComplete = profile.diagnostic_complete || profile.is_demo;

  const nextIncompleteId = [...modules]
    .sort(
      (a, b) =>
        parseModuleNumber(a.module_code) - parseModuleNumber(b.module_code)
    )
    .find((m) => !progressMap.get(m.id)?.is_complete)?.id;

  const byPillar = [1, 2, 3].map((pillar) => ({
    pillar,
    label: getPillarLabel(pillar),
    weeks: getPillarWeeks(pillar),
    description: getPillarDescription(pillar),
    slug: getPillarSlug(pillar) ?? "program",
    modules: modules
      .filter((m) => m.pillar === pillar)
      .sort(
        (a, b) =>
          parseModuleNumber(a.module_code) - parseModuleNumber(b.module_code)
      ),
  }));

  return (
    <div className="experience-lift mx-auto max-w-5xl space-y-10 pb-16">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-lift">
          {institution?.name ?? "Corporate Academy"}
        </p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
          Curriculum
        </h1>
        <p className="text-muted-foreground">
          {profile.program_started_at
            ? `You are on Week ${progressWeek}`
            : "Click Go on your dashboard to start"}
        </p>
      </header>

      {!diagnosticComplete ? (
        <div className="lift-card rounded-2xl p-5 text-sm">
          Complete the entry diagnostic to access module content.{" "}
          <Link href="/diagnostic" className="font-medium underline">
            Go to diagnostic
          </Link>
        </div>
      ) : null}

      {byPillar.map(
        ({ pillar, label, weeks, description, slug, modules: pillarModules }) => (
          <section key={pillar} className="space-y-5">
            <div className="border-b border-lift/15 pb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-lift">
                Pillar {pillar} · {weeks}
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">{label}</h2>
              {description ? (
                <p className="lift-prose mt-2 text-sm text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>

            {pillarModules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No modules in this pillar.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {pillarModules.map((m) => {
                  const complete = progressMap.get(m.id)?.is_complete;
                  const moduleSlug = m.slug ?? m.id;
                  const status = complete
                    ? "Complete"
                    : m.id === nextIncompleteId
                      ? "In progress"
                      : "Not started";
                  const href = `/program/${slug}/${moduleSlug}`;

                  const card = (
                    <div className="lift-card-interactive h-full min-w-0 rounded-2xl p-5">
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <span className="shrink-0 rounded-full bg-lift-muted px-2.5 py-0.5 font-mono text-[10px] font-bold text-lift">
                          {m.module_code}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                            complete
                              ? "bg-lift text-lift-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {status}
                        </span>
                      </div>
                      <p className="mt-3 lift-text-wrap font-semibold leading-snug">{m.title}</p>
                      {m.overviewLine ? (
                        <p className="mt-2 lift-text-wrap text-sm text-muted-foreground">
                          {m.overviewLine}
                        </p>
                      ) : null}
                    </div>
                  );

                  return (
                    <li key={m.id}>
                      {diagnosticComplete ? (
                        <Link href={href} className="block h-full">
                          {card}
                        </Link>
                      ) : (
                        card
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )
      )}

      <p className="text-sm text-muted-foreground">
        <Link href="/dashboard" className="underline hover:text-foreground">
          ← Back to dashboard timeline
        </Link>
      </p>
    </div>
  );
}
