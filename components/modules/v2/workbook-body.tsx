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
    <div className="space-y-4">
      {intro ? (
        <p className="lift-prose lift-body text-muted-foreground">{intro}</p>
      ) : null}
      {pairs.map((pair, index) => (
        <div
          key={index}
          className="lift-card-interactive grid gap-3 rounded-2xl p-4 sm:grid-cols-[1fr_auto_1fr] md:p-5"
        >
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Before
            </p>
            <p className="lift-body text-foreground">{pair.before}</p>
          </div>
          <span className="hidden self-center text-lg text-lift sm:block">→</span>
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-widest text-lift">
              After
            </p>
            <p className="lift-body text-foreground">{pair.after}</p>
          </div>
        </div>
      ))}
      {outro ? (
        <p className="lift-prose lift-body text-muted-foreground">{outro}</p>
      ) : null}
    </div>
  );
}

function FormattedBodyView({ formatted }: { formatted: FormattedBody }) {
  switch (formatted.type) {
    case "colon_list":
      return (
        <div className="space-y-4">
          <p className="lift-prose lift-body font-medium text-foreground">
            {formatted.intro}:
          </p>
          {formatted.useChips ? (
            <div className="flex flex-wrap gap-2.5">
              {formatted.items.map((item) => (
                <Badge key={item} variant="secondary" className="lift-chip font-normal">
                  {item}
                </Badge>
              ))}
            </div>
          ) : (
            <ul className="space-y-3">
              {formatted.items.map((item) => (
                <li
                  key={item}
                  className="lift-card rounded-2xl border-l-4 border-lift/40 bg-lift-muted/25 px-5 py-4"
                >
                  <span className="lift-body text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          )}
          {formatted.outro ? (
            <div className="space-y-4 pt-1">
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
                  <p className="lift-prose lift-body text-muted-foreground">
                    {formatted.outro}
                  </p>
                );
              })()}
            </div>
          ) : null}
        </div>
      );

    case "contrast_groups":
      return (
        <div className="space-y-5">
          {formatted.intro ? (
            <p className="lift-prose lift-body text-muted-foreground">{formatted.intro}</p>
          ) : null}
          <div className="grid gap-5 sm:grid-cols-2">
            {formatted.groups.map((group) => (
              <div
                key={group.label}
                className="lift-card rounded-2xl border border-lift/20 bg-lift-muted/20 p-5"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-lift">
                  {group.label}
                </p>
                <ul className="mt-3 space-y-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="lift-body border-l-2 border-lift/30 pl-3 text-foreground"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {formatted.outro ? (
            <p className="lift-prose lift-body text-muted-foreground">{formatted.outro}</p>
          ) : null}
        </div>
      );

    case "arrow_chain":
      return (
        <div className="space-y-4">
          {formatted.intro ? (
            <p className="lift-prose lift-body text-muted-foreground">{formatted.intro}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2.5">
            {formatted.steps.map((step, index) => (
              <span key={step} className="inline-flex items-center gap-2.5">
                <span className="lift-chip border bg-lift-muted/80 text-base">
                  {step}
                </span>
                {index < formatted.steps.length - 1 ? (
                  <span className="text-lg text-lift">→</span>
                ) : null}
              </span>
            ))}
          </div>
          {formatted.outro ? (
            <p className="lift-prose lift-body text-muted-foreground">{formatted.outro}</p>
          ) : null}
        </div>
      );

    case "enumeration":
      return (
        <div className="space-y-4">
          {formatted.intro ? (
            <p className="lift-prose lift-body text-muted-foreground">{formatted.intro}</p>
          ) : null}
          <ol className="list-decimal space-y-3 pl-6">
            {formatted.items.map((item) => (
              <li key={item} className="lift-body text-foreground">
                {item}
              </li>
            ))}
          </ol>
          {formatted.outro ? (
            <p className="lift-prose lift-body text-muted-foreground">{formatted.outro}</p>
          ) : null}
        </div>
      );

    case "week_timeline":
      return (
        <div className="space-y-5">
          {formatted.intro ? (
            <p className="lift-prose lift-body text-muted-foreground">{formatted.intro}</p>
          ) : null}
          <ol className="relative space-y-5 border-l-2 border-lift/30 pl-6">
            {formatted.beats.map((beat) => (
              <li key={beat.week} className="relative">
                <span className="absolute -left-[1.55rem] top-1.5 size-3.5 rounded-full bg-lift shadow-sm shadow-lift/30" />
                <p className="text-xs font-bold uppercase tracking-widest text-lift">
                  {beat.week}
                </p>
                <p className="lift-body text-foreground">{beat.text}</p>
              </li>
            ))}
          </ol>
          {formatted.outro ? (
            <p className="lift-prose lift-body text-muted-foreground">{formatted.outro}</p>
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
        <p className="lift-prose lift-body text-muted-foreground">{formatted.text}</p>
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
