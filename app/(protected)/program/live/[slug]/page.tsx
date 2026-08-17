import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getContentModuleCatalog,
  getStudentProgressMap,
} from "@/lib/modules-queries";
import {
  getLiveSessionStatus,
  getPillarLabel,
  getPillarSlug,
  getProgressWeek,
} from "@/lib/program";
import { LiveSessionAttendance } from "@/components/modules/live-session-attendance";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const STATUS_LABEL = {
  upcoming: "Upcoming",
  available: "Available now",
  past: "Past",
} as const;

export default async function LiveSessionPage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("modules")
    .select("*")
    .eq("is_live_session", true)
    .eq("slug", slug)
    .single();

  if (!session) notFound();

  const diagnosticComplete = profile.diagnostic_complete || profile.is_demo;
  const [contentModules, progressMap] = await Promise.all([
    getContentModuleCatalog(),
    getStudentProgressMap(profile.id),
  ]);
  const progressWeek = getProgressWeek(contentModules, progressMap);
  const liveStatus = getLiveSessionStatus(session.unlock_week ?? 1, progressWeek);

  const progress = await supabase
    .from("student_progress")
    .select("*")
    .eq("student_id", profile.id)
    .eq("module_id", session.id)
    .maybeSingle();

  const pillarSlug = getPillarSlug(session.pillar) ?? "program";
  const isComplete = progress.data?.is_complete ?? false;

  if (!diagnosticComplete) {
    return (
      <div className="experience-lift mx-auto max-w-3xl">
        <div className="lift-card rounded-2xl p-6 text-sm">
          Complete the{" "}
          <Link href="/diagnostic" className="underline">
            entry diagnostic
          </Link>{" "}
          to join live sessions.
        </div>
      </div>
    );
  }

  return (
    <div className="experience-lift mx-auto max-w-3xl space-y-8 pb-16">
      <header className="lift-framework space-y-5 rounded-3xl p-7 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-lift px-3.5 py-1.5 font-mono text-xs font-bold text-lift-foreground shadow-sm shadow-lift/20">
            {session.module_code}
          </span>
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            {getPillarLabel(session.pillar)}
          </span>
          <span className="lift-chip border-0 px-3 py-1 text-xs">
            Week {session.unlock_week}
          </span>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              liveStatus === "available"
                ? "bg-lift text-lift-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isComplete ? "Attended" : STATUS_LABEL[liveStatus]}
          </span>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-lift">
          Live session
        </p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-[2.4rem] md:leading-tight">
          {session.title}
        </h1>
      </header>

      {session.description ? (
        <div className="lift-card rounded-2xl p-6 md:p-7">
          <p className="lift-body text-muted-foreground">{session.description}</p>
        </div>
      ) : null}

      {isComplete ? (
        <div className="lift-card rounded-2xl border-lift/25 bg-lift-muted/40 p-6">
          <h2 className="text-lg font-semibold">Attendance recorded</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You earned 50 XP for this session.
          </p>
        </div>
      ) : (
        <LiveSessionAttendance
          moduleId={session.id}
          pillarSlug={pillarSlug}
          moduleSlug={session.slug}
          streamUrl={session.stream_url}
        />
      )}

      <p className="text-sm">
        <Link href="/dashboard" className="underline hover:text-foreground">
          ← Back to dashboard
        </Link>
      </p>
    </div>
  );
}
