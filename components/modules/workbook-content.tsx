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

export function WorkbookContent({ blocks }: { blocks: WorkbookBlock[] }) {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
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
          default:
            return null;
        }
      })}
    </article>
  );
}
