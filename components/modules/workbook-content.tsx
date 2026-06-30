import type { WorkbookBlock } from "@/types/modules";
import { cn } from "@/lib/utils";

function CalloutBox({
  title,
  body,
  variant,
}: {
  title: string;
  body: string;
  variant: "framework" | "concept" | "legacy";
}) {
  return (
    <div
      className={cn(
        "my-6 rounded-xl border-l-4 p-5 shadow-sm",
        variant === "framework" &&
          "border-accent bg-accent/5",
        variant === "concept" &&
          "border-primary bg-primary/5",
        variant === "legacy" && "border-accent bg-accent/5"
      )}
    >
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}

type WorkbookContentProps = {
  overview?: string;
  blocks: WorkbookBlock[];
  completionCheck?: string[];
};

export function WorkbookContent({
  overview,
  blocks,
  completionCheck,
}: WorkbookContentProps) {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      {overview ? (
        <p className="mt-0 leading-relaxed text-muted-foreground">{overview}</p>
      ) : null}

      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            if (block.level === 2) {
              return (
                <h2
                  key={i}
                  className="mt-8 text-xl font-semibold text-foreground first:mt-0"
                >
                  {block.text}
                </h2>
              );
            }
            return (
              <h3 key={i} className="mt-6 text-lg font-medium text-foreground">
                {block.text}
              </h3>
            );
          case "paragraph":
            return (
              <p
                key={i}
                className="mt-4 leading-relaxed text-muted-foreground"
              >
                {block.text}
              </p>
            );
          case "callout":
          case "framework_callout":
            return (
              <CalloutBox
                key={i}
                title={block.title}
                body={block.body}
                variant={
                  block.type === "framework_callout" ? "framework" : "legacy"
                }
              />
            );
          case "concept_block":
            return (
              <CalloutBox
                key={i}
                title={block.title}
                body={block.body}
                variant="concept"
              />
            );
          case "application":
            return (
              <ul key={i} className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
                {block.items.map((item, j) => (
                  <li key={j} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            );
          default:
            return null;
        }
      })}

      {completionCheck && completionCheck.length > 0 ? (
        <section className="mt-10 rounded-xl border border-border bg-muted/30 p-5">
          <h3 className="text-lg font-semibold text-foreground">
            Completion Check
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirm you can honestly check each item before moving on.
          </p>
          <ul className="mt-4 space-y-2">
            {completionCheck.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-sm leading-relaxed text-foreground"
              >
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-border bg-background text-[10px] text-muted-foreground">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
