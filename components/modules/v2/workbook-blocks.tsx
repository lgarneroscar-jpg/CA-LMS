"use client";

import type { WorkbookBlock } from "@/types/modules";
import { WorkbookBodyContent } from "@/components/modules/v2/workbook-body";
import {
  isNarrativeText,
  NarrativeCard,
  renderNarrativeOrBody,
} from "@/components/modules/v2/narrative-card";
import { CompletionCheckV2 } from "@/components/modules/v2/completion-check";
import { formatWorkbookBody, splitTopLevel } from "@/lib/workbook-format";

type WorkbookBlocksV2Props = {
  overview?: string;
  blocks: WorkbookBlock[];
  completionCheck?: string[];
};

const APPLICATION_HEADING = "Real-World Application";

function normalizeHeading(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

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

function tryRenderQualityList(body: string) {
  const match = body.match(/^(.+?:)\s*([\s\S]+?)\.\s+(Managers[\s\S]+)$/i);
  if (!match) return null;

  const items = splitTopLevel(match[2], ",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length < 4) return null;

  return (
    <div className="space-y-4">
      <p className="lift-body font-medium text-foreground">{match[1]}</p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item}
            className="lift-card rounded-2xl border-l-4 border-lift/40 bg-lift-muted/30 px-5 py-4"
          >
            <span className="lift-body text-foreground">{item}</span>
          </li>
        ))}
      </ul>
      <p className="lift-prose lift-body text-muted-foreground">{match[3]}</p>
    </div>
  );
}

function renderConceptBody(body: string) {
  const formatted = formatWorkbookBody(body);
  if (formatted.type !== "prose") {
    return <WorkbookBodyContent body={body} />;
  }

  const qualityList = tryRenderQualityList(body);
  if (qualityList) return qualityList;

  return (
    <p className="lift-prose lift-body text-muted-foreground">
      {emphasizeInlineLabels(body)}
    </p>
  );
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
    <article className="space-y-12">
      {overview ? (
        <p className="lift-prose lift-lede max-w-none">{overview}</p>
      ) : null}

      {conceptBlocks.length > 0 ? (
        <section className="space-y-8">
          <h2 className="border-b border-lift/20 pb-2 text-sm font-bold uppercase tracking-widest text-lift">
            Key ideas
          </h2>
          <div className="divide-y divide-border/80">
            {conceptBlocks.map((block) => {
              conceptIndex += 1;
              if (block.type !== "concept_block") return null;
              return (
                <div
                  key={block.title}
                  className="grid gap-4 py-7 sm:grid-cols-[auto_1fr] sm:gap-6"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lift text-base font-bold text-lift-foreground shadow-sm shadow-lift/20">
                    {conceptIndex}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                      {block.title}
                    </h3>
                    {renderConceptBody(block.body)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {otherBlocks.map((block, index) => {
        switch (block.type) {
          case "heading": {
            // Application section supplies its own heading — skip a duplicate
            // immediately preceding heading with the same title.
            const next = otherBlocks[index + 1];
            if (
              next?.type === "application" &&
              normalizeHeading(block.text) ===
                normalizeHeading(APPLICATION_HEADING)
            ) {
              return null;
            }
            return block.level === 2 ? (
              <h2
                key={`${block.text}-${index}`}
                className="text-2xl font-bold text-foreground"
              >
                {block.text}
              </h2>
            ) : (
              <h3
                key={`${block.text}-${index}`}
                className="text-xl font-semibold text-foreground"
              >
                {block.text}
              </h3>
            );
          }

          case "paragraph":
            if (isNarrativeText(block.text)) {
              return (
                <NarrativeCard key={`${index}-narrative`} text={block.text} />
              );
            }
            return (
              <p
                key={`${index}-paragraph`}
                className="lift-prose lift-body text-muted-foreground"
              >
                {block.text}
              </p>
            );

          case "callout":
            return (
              <div
                key={`${block.title}-${index}`}
                className="lift-card rounded-2xl border border-border/80 bg-muted/40 p-5 md:p-6"
              >
                <p className="text-base font-semibold text-foreground">
                  {block.title}
                </p>
                <div className="mt-3">{renderNarrativeOrBody(block.body)}</div>
              </div>
            );

          case "framework_callout":
            return (
              <div key={`${block.title}-${index}`} className="lift-framework">
                <div className="border-b border-lift/15 bg-lift-muted/60 px-6 py-4">
                  <p className="text-lg font-bold text-foreground">
                    {block.title}
                  </p>
                </div>
                <div className="p-6 md:p-7">
                  <WorkbookBodyContent body={block.body} />
                </div>
              </div>
            );

          case "application":
            return (
              <section key={`application-${index}`} className="space-y-5">
                <h2 className="border-b border-lift/20 pb-2 text-xl font-bold text-foreground md:text-2xl">
                  {APPLICATION_HEADING}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {block.items.map((item) => {
                    if (isNarrativeText(item)) {
                      return (
                        <NarrativeCard
                          key={item}
                          text={item}
                          className="sm:col-span-2"
                        />
                      );
                    }
                    const parsed = parseApplicationItem(item);
                    return (
                      <div
                        key={item}
                        className="lift-card-interactive rounded-2xl p-5 md:p-6"
                      >
                        <p className="text-xs font-bold uppercase tracking-widest text-lift">
                          {parsed.label}
                        </p>
                        <p className="lift-body mt-3 text-muted-foreground">
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
