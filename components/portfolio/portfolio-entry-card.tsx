import Link from "next/link";
import { FileText, Lock } from "lucide-react";
import { PORTFOLIO_COMPLETION_DEFINITION } from "@/lib/portfolio";

type Props =
  | { unlocked: true; preview?: boolean }
  | { unlocked: false; modulesCompleted: number; modulesTotal: number };

export function PortfolioEntryCard(props: Props) {
  if (props.unlocked && props.preview) {
    return (
      <section className="lift-card flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-lift-muted text-lift">
            <FileText className="size-4" aria-hidden />
          </div>
          <div>
            <h2 className="font-semibold">Your portfolio</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Students unlock this when they finish the program. Preview it now with
              what you&apos;ve written so far, or see a finished example.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/portfolio/example"
            className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Finished example
          </Link>
          <Link
            href="/profile/portfolio"
            className="inline-flex items-center justify-center rounded-lg bg-lift px-4 py-2 text-sm font-medium text-lift-foreground hover:bg-lift-hover"
          >
            Preview portfolio
          </Link>
        </div>
      </section>
    );
  }

  if (props.unlocked) {
    return (
      <section className="lift-card flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-lift-muted text-lift">
            <FileText className="size-4" aria-hidden />
          </div>
          <div>
            <h2 className="font-semibold">Your portfolio</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose your best workbook answers and save them as a PDF you can send to
              employers.
            </p>
          </div>
        </div>
        <Link
          href="/profile/portfolio"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-lift px-4 py-2 text-sm font-medium text-lift-foreground hover:bg-lift-hover"
        >
          Build portfolio
        </Link>
      </section>
    );
  }

  return (
    <section className="lift-card flex items-start gap-3 rounded-2xl p-5 md:p-6">
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Lock className="size-4" aria-hidden />
      </div>
      <div>
        <h2 className="font-semibold">Your portfolio</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Unlocks when you complete the program: {props.modulesCompleted} of{" "}
          {props.modulesTotal} modules done. {PORTFOLIO_COMPLETION_DEFINITION}{" "}
          You&apos;ll then be able to choose your best workbook answers and save them as a
          PDF to send to employers.
        </p>
      </div>
    </section>
  );
}
