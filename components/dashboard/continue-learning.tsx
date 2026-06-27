import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { FeedModule } from "@/lib/program";

type ContinueLearningProps = {
  nextModule: FeedModule | null;
};

export function ContinueLearning({ nextModule }: ContinueLearningProps) {
  if (!nextModule) {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-6 text-center">
        <p className="font-medium text-foreground">
          You&apos;re all caught up on unlocked modules.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Check back when the next week unlocks on your cohort schedule.
        </p>
      </div>
    );
  }

  const href = `/program/${nextModule.pillarSlug}/${nextModule.slug}`;

  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl bg-primary px-6 py-5 text-primary-foreground shadow-md transition-shadow hover:shadow-lg"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-primary-foreground/70">
          Continue learning
        </p>
        <p className="mt-1 text-lg font-semibold">{nextModule.title}</p>
        <p className="mt-0.5 text-sm text-primary-foreground/80">
          {nextModule.module_code} · Week {nextModule.unlock_week}
        </p>
      </div>
      <ArrowRight className="size-6 shrink-0 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
