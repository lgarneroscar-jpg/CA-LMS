import { cn } from "@/lib/utils";
import { detectWeekTimeline } from "@/lib/workbook-format";
import { WorkbookBodyContent } from "@/components/modules/v2/workbook-body";

type NarrativeCardProps = {
  text: string;
  className?: string;
};

type WeekBeat = { week: string; text: string };

/** Week beats without colons — e.g. "Week 1 she meets… Week 3 she delivers…" */
function detectWeekBeatsLoose(text: string): WeekBeat[] | null {
  const markers = [...text.matchAll(/\bWeek\s+(\d+)\b/gi)];
  if (markers.length < 3) return null;

  const beats: WeekBeat[] = [];
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index ?? 0;
    const end = markers[i + 1]?.index ?? text.length;
    const segment = text.slice(start, end).trim();
    const match = segment.match(/^Week\s+(\d+)\s+([\s\S]+)$/i);
    if (!match) continue;
    beats.push({ week: `Week ${match[1]}`, text: match[2].trim().replace(/\.\s*$/, "") });
  }

  return beats.length >= 3 ? beats : null;
}

function extractPersona(text: string): string {
  const match = text.trim().match(/^([A-Za-z]+)/);
  return match?.[1]?.charAt(0).toUpperCase() ?? "M";
}

function resolveWeekTimeline(text: string) {
  const strict = detectWeekTimeline(text);
  if (strict) return strict;

  const looseBeats = detectWeekBeatsLoose(text);
  if (!looseBeats) return null;

  const firstMarker = text.search(/\bWeek\s+\d+\b/i);
  const intro = firstMarker > 0 ? text.slice(0, firstMarker).trim() : undefined;
  const lastBeat = looseBeats[looseBeats.length - 1];
  const lastIndex = text.lastIndexOf(lastBeat.text);
  const outroStart = lastIndex + lastBeat.text.length;
  const outro = text.slice(outroStart).trim().replace(/^\.\s*/, "") || undefined;

  return { intro, beats: looseBeats, outro };
}

export function NarrativeCard({ text, className }: NarrativeCardProps) {
  const persona = extractPersona(text);
  const timeline = resolveWeekTimeline(text);

  return (
    <div
      className={cn(
        "lift-card rounded-3xl border border-stone-200 bg-stone-50/90 p-6 shadow-sm md:p-7",
        className
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-stone-200 text-base font-bold text-stone-700">
          {persona}
        </div>
        <p className="text-base font-semibold text-stone-800">{persona}&apos;s story</p>
      </div>
      {timeline ? (
        <div className="space-y-4">
          {timeline.intro ? (
            <p className="lift-prose lift-body text-stone-700">{timeline.intro}</p>
          ) : null}
          <ol className="relative space-y-4 border-l-2 border-stone-300 pl-5">
            {timeline.beats.map((beat) => (
              <li key={beat.week} className="relative">
                <span className="absolute -left-[1.45rem] top-1.5 size-3 rounded-full bg-stone-400" />
                <p className="text-xs font-bold uppercase tracking-wide text-stone-600">
                  {beat.week}
                </p>
                <p className="lift-body text-stone-700">{beat.text}</p>
              </li>
            ))}
          </ol>
          {timeline.outro ? (
            <p className="lift-prose lift-body text-stone-700">{timeline.outro}</p>
          ) : null}
        </div>
      ) : (
        <p className="lift-prose lift-body text-stone-700">{text}</p>
      )}
    </div>
  );
}

export function isNarrativeText(text: string): boolean {
  const trimmed = text.trim();
  return /^maya'?s?\b/i.test(trimmed);
}

export function renderNarrativeOrBody(text: string) {
  if (isNarrativeText(text)) {
    return <NarrativeCard text={text} />;
  }
  return <WorkbookBodyContent body={text} />;
}
