import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { FeedModule } from "@/lib/program";

type ContinueLearningProps = {
  nextModule: FeedModule | null;
};

export function ContinueLearning({ nextModule }: ContinueLearningProps) {
  if (!nextModule) {
    return (
      <div className="lift-card rounded-2xl border border-lift/20 bg-lift-muted/30 p-6 text-center">
        <p className="font-medium text-foreground">
          You&apos;re all caught up on modules.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Live sessions stay on the timeline as optional milestones.
        </p>
      </div>
    );
  }

  const href = nextModule.isLiveSession
    ? `/program/live/${nextModule.slug}`
    : `/program/${nextModule.pillarSlug}/${nextModule.slug}`;

  return (
    <Link
      href={href}
      className="lift-card-interactive group flex min-w-0 items-center justify-between gap-4 rounded-2xl bg-lift px-6 py-5 text-lift-foreground shadow-md shadow-lift/20"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-widest text-lift-foreground/70">
          Continue learning
        </p>
        <p className="mt-1 break-words text-lg font-semibold">{nextModule.title}</p>
        <p className="mt-0.5 text-sm text-lift-foreground/80">
          {nextModule.module_code} · Week {nextModule.unlock_week}
        </p>
      </div>
      <ArrowRight className="size-6 shrink-0 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
