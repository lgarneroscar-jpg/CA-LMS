import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  fetchActiveItems,
  fetchAnswers,
  findResponse,
  type AdministrationType,
} from "@/lib/capri/queries";
import type { CapriAnswer, CapriItem } from "@/lib/capri/scoring";
import { CapriAssessment } from "@/components/capri/capri-assessment";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PageProps = {
  params: Promise<{ administration: string }>;
};

const VALID: AdministrationType[] = ["baseline", "post"];

/** The assessment page must always say why it cannot load — never render blank. */
function CapriUnavailable({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-xl py-10">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base">{body}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/dashboard"
            className="text-sm font-medium underline underline-offset-2"
          >
            Back to your dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function CapriPage({ params }: PageProps) {
  const { administration } = await params;

  if (!VALID.includes(administration as AdministrationType)) notFound();
  const administrationType = administration as AdministrationType;

  const profile = await requireRole(["student"]);

  if (!profile.onboarding_complete && !profile.is_demo) {
    redirect("/onboarding");
  }

  if (!profile.institution_id) {
    return (
      <CapriUnavailable
        title="The assessment isn't available yet"
        body="You're not assigned to a cohort, and the readiness assessment is run per cohort. Contact your program administrator and ask them to add you to your cohort."
      />
    );
  }

  // The Week 12 post unlocks off the same signal that drives the certificate:
  // all content modules complete.
  if (administrationType === "post" && !profile.program_completed_at) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  let existing: Awaited<ReturnType<typeof findResponse>>;
  let items: CapriItem[];
  let answers: CapriAnswer[];
  try {
    existing = await findResponse(
      supabase,
      profile.institution_id,
      profile.id,
      administrationType
    );
    [items, answers] = await Promise.all([
      fetchActiveItems(supabase),
      existing && !existing.submittedAt
        ? fetchAnswers(supabase, existing.id)
        : Promise.resolve([]),
    ]);
  } catch (err) {
    console.error("[capri page]", err);
    return (
      <CapriUnavailable
        title="The assessment couldn't be loaded"
        body="We couldn't load your assessment or your saved answers just now. Your progress is safe. Please refresh the page in a minute; if this keeps happening, tell your program administrator."
      />
    );
  }

  if (existing?.submittedAt) {
    redirect("/dashboard");
  }

  if (items.length === 0) {
    return (
      <CapriUnavailable
        title="The assessment isn't set up yet"
        body="There is no active version of the readiness assessment to show you. This is a configuration issue on our side, not something you did. Please let your program administrator know."
      />
    );
  }

  return (
    <CapriAssessment
      administrationType={administrationType}
      items={items}
      savedAnswers={answers}
    />
  );
}
