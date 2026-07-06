"use client";

import type { WorkbookBlock } from "@/types/modules";
import { WorkbookBodyContent } from "@/components/modules/v2/workbook-body";
import {
  isNarrativeText,
  NarrativeCard,
  renderNarrativeOrBody,
} from "@/components/modules/v2/narrative-card";
import { CompletionCheckV2 } from "@/components/modules/v2/completion-check";
import { cn } from "@/lib/utils";

type WorkbookBlocksV2Props = {
  overview?: string;
  blocks: WorkbookBlock[];
  completionCheck?: string[];
};

function emphasizeInlineLabels(text: string) {
  const parts = text.split(/([A-Z][A-Za-z /-]+:)/g);
  return parts.map((part, index) => {
    if (/^[A-Z][A-Za-z /-]+:$/.test(part)) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function parseApplicationItem(item: string) {
  const match = item.match(/^([^:]+):\s*(.+)$/);
  if (!match) return { label: "Apply", body: item };
  return { label: match[1].trim(), body: match[2].trim() };
}

export function WorkbookBlocksV2({
  overview,
  blocks,
  completionCheck,
}: WorkbookBlocksV2Props) {
  const conceptBlocks = blocks.filter((block) => block.type === "concept_block");
  const otherBlocks = blocks.filter((block) => block.type !== "concept_block");
  let conceptIndex = 0;

  return (
    <article className="space-y-8">
      {overview ? (
        <p className="max-w-prose text-lg leading-relaxed text-foreground/90">
          {overview}
        </p>
      ) : null}

      {conceptBlocks.length > 0 ? (
        <section className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-lift">
            Key ideas
          </h2>
          <div className="divide-y divide-border">
            {conceptBlocks.map((block) => {
              conceptIndex += 1;
              if (block.type !== "concept_block") return null;
              return (
                <div key={block.title} className="grid gap-3 py-5 sm:grid-cols-[auto_1fr]">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-lift text-sm font-semibold text-lift-foreground">
                    {conceptIndex}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">
                      {block.title}
                    </h3>
                    <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                      {emphasizeInlineLabels(block.body)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {otherBlocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return block.level === 2 ? (
              <h2
                key={`${block.text}-${index}`}
                className="text-xl font-semibold text-foreground"
              >
                {block.text}
              </h2>
            ) : (
              <h3
                key={`${block.text}-${index}`}
                className="text-lg font-medium text-foreground"
              >
                {block.text}
              </h3>
            );

          case "paragraph":
            if (isNarrativeText(block.text)) {
              return <NarrativeCard key={`${index}-narrative`} text={block.text} />;
            }
            return (
              <p
                key={`${index}-paragraph`}
                className="max-w-prose text-sm leading-relaxed text-muted-foreground"
              >
                {block.text}
              </p>
            );

          case "callout":
            return (
              <div
                key={`${block.title}-${index}`}
                className="rounded-xl border border-border/80 bg-muted/30 p-4"
              >
                <p className="text-sm font-semibold text-foreground">{block.title}</p>
                <div className="mt-2">{renderNarrativeOrBody(block.body)}</div>
              </div>
            );

          case "framework_callout":
            return (
              <div
                key={`${block.title}-${index}`}
                className="overflow-hidden rounded-2xl border border-lift/15 bg-card shadow-sm"
              >
                <div className="border-b border-lift/10 bg-lift-muted/50 px-5 py-3">
                  <p className="font-semibold text-foreground">{block.title}</p>
                </div>
                <div className="p-5">
                  <WorkbookBodyContent body={block.body} />
                </div>
              </div>
            );

          case "application":
            return (
              <section key={`application-${index}`} className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Real-World Application
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {block.items.map((item) => {
                    const parsed = parseApplicationItem(item);
                    return (
                      <div
                        key={item}
                        className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-lift">
                          {parsed.label}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {parsed.body}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            );

          default:
            return null;
        }
      })}

      {completionCheck && completionCheck.length > 0 ? (
        <CompletionCheckV2 items={completionCheck} />
      ) : null}
    </article>
  );
}
