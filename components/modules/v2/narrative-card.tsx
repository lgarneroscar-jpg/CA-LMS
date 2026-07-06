import { cn } from "@/lib/utils";
import { detectWeekTimeline } from "@/lib/workbook-format";
import { WorkbookBodyContent } from "@/components/modules/v2/workbook-body";

type NarrativeCardProps = {
  text: string;
  className?: string;
};

function extractPersona(text: string): string {
  const match = text.trim().match(/^([A-Za-z]+)/);
  return match?.[1]?.charAt(0).toUpperCase() ?? "M";
}

export function NarrativeCard({ text, className }: NarrativeCardProps) {
  const persona = extractPersona(text);
  const timeline = detectWeekTimeline(text);

  return (
    <div
      className={cn(
        "rounded-2xl border border-stone-200 bg-stone-50/80 p-5 shadow-sm",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-stone-200 text-sm font-semibold text-stone-700">
          {persona}
        </div>
        <p className="text-sm font-medium text-stone-800">{persona}&apos;s story</p>
      </div>
      {timeline ? (
        <div className="space-y-3">
          {timeline.intro ? (
            <p className="text-sm leading-relaxed text-stone-700">{timeline.intro}</p>
          ) : null}
          <ol className="relative space-y-3 border-l-2 border-stone-300 pl-4">
            {timeline.beats.map((beat) => (
              <li key={beat.week} className="relative">
                <span className="absolute -left-[1.35rem] top-1 size-2.5 rounded-full bg-stone-400" />
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">
                  {beat.week}
                </p>
                <p className="text-sm leading-relaxed text-stone-700">{beat.text}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-stone-700">{text}</p>
      )}
    </div>
  );
}

export function isNarrativeText(text: string): boolean {
  return /^[A-Za-z]/.test(text.trim()) && /^maya\b/i.test(text.trim());
}

export function renderNarrativeOrBody(text: string) {
  if (isNarrativeText(text)) {
    return <NarrativeCard text={text} />;
  }
  return <WorkbookBodyContent body={text} />;
}
