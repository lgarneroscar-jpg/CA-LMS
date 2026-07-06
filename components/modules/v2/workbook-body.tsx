import { Badge } from "@/components/ui/badge";
import {
  detectSignalRewrite,
  type FormattedBody,
  formatWorkbookBody,
} from "@/lib/workbook-format";
import { cn } from "@/lib/utils";

type WorkbookBodyContentProps = {
  body: string;
  className?: string;
};

function SignalRewriteRows({
  pairs,
  intro,
  outro,
}: {
  pairs: { before: string; after: string }[];
  intro?: string;
  outro?: string;
}) {
  return (
    <div className="space-y-3">
      {intro ? <p className="text-sm leading-relaxed text-muted-foreground">{intro}</p> : null}
      {pairs.map((pair, index) => (
        <div
          key={index}
          className="grid gap-2 rounded-xl border border-border/70 bg-background p-3 sm:grid-cols-[1fr_auto_1fr]"
        >
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Before
            </p>
            <p className="text-sm leading-relaxed">{pair.before}</p>
          </div>
          <span className="hidden self-center text-lift sm:block">→</span>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-lift">
              After
            </p>
            <p className="text-sm leading-relaxed">{pair.after}</p>
          </div>
        </div>
      ))}
      {outro ? <p className="text-sm leading-relaxed text-muted-foreground">{outro}</p> : null}
    </div>
  );
}

function FormattedBodyView({ formatted }: { formatted: FormattedBody }) {
  switch (formatted.type) {
    case "colon_list":
      return (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{formatted.intro}:</p>
          {formatted.useChips ? (
            <div className="flex flex-wrap gap-2">
              {formatted.items.map((item) => (
                <Badge key={item} variant="secondary" className="lift-chip font-normal">
                  {item}
                </Badge>
              ))}
            </div>
          ) : (
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
              {formatted.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {formatted.outro ? (
            <div className="space-y-3 pt-1">
              {(() => {
                const rewrite = detectSignalRewrite(formatted.outro);
                if (rewrite) {
                  return (
                    <SignalRewriteRows
                      pairs={rewrite.pairs}
                      intro={rewrite.intro}
                      outro={rewrite.outro}
                    />
                  );
                }
                return (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {formatted.outro}
                  </p>
                );
              })()}
            </div>
          ) : null}
        </div>
      );

    case "arrow_chain":
      return (
        <div className="space-y-3">
          {formatted.intro ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{formatted.intro}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {formatted.steps.map((step, index) => (
              <span key={step} className="inline-flex items-center gap-2">
                <span className="rounded-full border border-lift/20 bg-lift-muted px-3 py-1 text-sm font-medium text-lift">
                  {step}
                </span>
                {index < formatted.steps.length - 1 ? (
                  <span className="text-lift">→</span>
                ) : null}
              </span>
            ))}
          </div>
          {formatted.outro ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{formatted.outro}</p>
          ) : null}
        </div>
      );

    case "enumeration":
      return (
        <div className="space-y-3">
          {formatted.intro ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{formatted.intro}</p>
          ) : null}
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            {formatted.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          {formatted.outro ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{formatted.outro}</p>
          ) : null}
        </div>
      );

    case "week_timeline":
      return (
        <div className="space-y-3">
          {formatted.intro ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{formatted.intro}</p>
          ) : null}
          <ol className="relative space-y-3 border-l-2 border-lift/20 pl-4">
            {formatted.beats.map((beat) => (
              <li key={beat.week} className="relative">
                <span className="absolute -left-[1.35rem] top-1 size-2.5 rounded-full bg-lift" />
                <p className="text-xs font-semibold uppercase tracking-wide text-lift">
                  {beat.week}
                </p>
                <p className="text-sm leading-relaxed">{beat.text}</p>
              </li>
            ))}
          </ol>
          {formatted.outro ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{formatted.outro}</p>
          ) : null}
        </div>
      );

    case "signal_rewrite":
      return (
        <SignalRewriteRows
          pairs={formatted.pairs}
          intro={formatted.intro}
          outro={formatted.outro}
        />
      );

    case "prose":
    default:
      return (
        <p className="text-sm leading-relaxed text-muted-foreground">{formatted.text}</p>
      );
  }
}

export function WorkbookBodyContent({ body, className }: WorkbookBodyContentProps) {
  const formatted = formatWorkbookBody(body);
  return (
    <div className={cn(className)}>
      <FormattedBodyView formatted={formatted} />
    </div>
  );
}
