import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPillarSlug } from "@/lib/program";
import { LiveSessionAttendance } from "@/components/modules/live-session-attendance";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PageProps = {
  params: Promise<{ slug: string }>;
};

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
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardContent className="pt-6 text-sm">
            Complete the{" "}
            <Link href="/diagnostic" className="underline">
              entry diagnostic
            </Link>{" "}
            to join live sessions.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Live session</p>
        <h1 className="mt-2 text-2xl font-semibold">{session.title}</h1>
        <p className="text-muted-foreground">{session.description}</p>
      </div>

      {isComplete ? (
        <Card className="border-accent/30 bg-accent/5">
          <CardHeader>
            <CardTitle>Attendance recorded</CardTitle>
            <CardDescription>You earned 50 XP for this session.</CardDescription>
          </CardHeader>
        </Card>
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
