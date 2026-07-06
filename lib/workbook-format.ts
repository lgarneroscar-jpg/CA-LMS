export type FormattedColonList = {
  type: "colon_list";
  intro: string;
  items: string[];
  outro?: string;
  useChips: boolean;
};

export type FormattedArrowChain = {
  type: "arrow_chain";
  intro?: string;
  steps: string[];
  outro?: string;
};

export type FormattedEnumeration = {
  type: "enumeration";
  intro?: string;
  items: string[];
  outro?: string;
};

export type FormattedWeekTimeline = {
  type: "week_timeline";
  intro?: string;
  beats: { week: string; text: string }[];
  outro?: string;
};

export type FormattedSignalRewrite = {
  type: "signal_rewrite";
  intro?: string;
  pairs: { before: string; after: string }[];
  outro?: string;
};

export type FormattedProse = {
  type: "prose";
  text: string;
};

export type FormattedBody =
  | FormattedColonList
  | FormattedArrowChain
  | FormattedEnumeration
  | FormattedWeekTimeline
  | FormattedSignalRewrite
  | FormattedProse;

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function detectWeekTimeline(text: string): FormattedWeekTimeline | null {
  const markers = [...text.matchAll(/Week\s+(\d+):/gi)];
  if (markers.length < 3) return null;

  const beats: { week: string; text: string }[] = [];
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index ?? 0;
    const end = markers[i + 1]?.index ?? text.length;
    const segment = text.slice(start, end).trim();
    const match = segment.match(/^Week\s+(\d+):\s*([\s\S]+)$/i);
    if (!match) continue;
    beats.push({ week: `Week ${match[1]}`, text: match[2].trim() });
  }

  if (beats.length < 3) return null;

  const intro = text.slice(0, markers[0].index ?? 0).trim();
  return {
    type: "week_timeline",
    intro: intro || undefined,
    beats,
  };
}

export function detectSignalRewrite(
  text: string
): FormattedSignalRewrite | null {
  const regex = /"([^"]+)"\s*→\s*"([^"]+)"/g;
  const pairs = [...text.matchAll(regex)].map((match) => ({
    before: match[1].trim(),
    after: match[2].trim(),
  }));
  if (pairs.length === 0) return null;

  const firstIndex = text.search(/"/);
  const intro = firstIndex > 0 ? text.slice(0, firstIndex).trim() : undefined;
  const lastMatch = [...text.matchAll(regex)].at(-1);
  const outroStart =
    lastMatch && lastMatch.index !== undefined
      ? lastMatch.index + lastMatch[0].length
      : text.length;
  const outro = text.slice(outroStart).trim() || undefined;

  return { type: "signal_rewrite", intro, pairs, outro };
}

export function detectArrowChain(text: string): FormattedArrowChain | null {
  if (!text.includes("→")) return null;
  if (/"\s*→\s*"/.test(text) && !/\w+\s+→\s+\w+/.test(text.replace(/"[^"]*"/g, ""))) {
    return null;
  }

  let source = text;
  let intro: string | undefined;
  const colonIdx = text.indexOf(":");
  if (colonIdx !== -1 && text.includes("→", colonIdx)) {
    intro = text.slice(0, colonIdx + 1).trim();
    source = text.slice(colonIdx + 1);
  }

  const rawSteps = source
    .split(/\s*→\s*/)
    .map((step) =>
      step
        .trim()
        .replace(/\.\s*The earlier[\s\S]*$/i, "")
        .replace(/\.\s*$/, "")
        .replace(/\s*\(repeat\)\.?$/i, "")
    )
    .filter(Boolean);

  if (rawSteps.length < 3) return null;

  const outroMatch = text.match(/The earlier[\s\S]+$/i);
  return {
    type: "arrow_chain",
    intro,
    steps: rawSteps,
    outro: outroMatch?.[0]?.trim(),
  };
}

export function detectEnumeration(text: string): FormattedEnumeration | null {
  const markers = [...text.matchAll(/\((\d+)\)\s+/g)];
  if (markers.length < 2) return null;

  const items: string[] = [];
  for (let i = 0; i < markers.length; i++) {
    const start = (markers[i].index ?? 0) + markers[i][0].length;
    const end = markers[i + 1]?.index ?? text.length;
    const item = text.slice(start, end).trim().replace(/\.\s*$/, "");
    if (item) items.push(item);
  }

  if (items.length < 2) return null;

  const intro = text.slice(0, markers[0].index ?? 0).trim();
  return {
    type: "enumeration",
    intro: intro || undefined,
    items,
  };
}

export function detectColonList(text: string): FormattedColonList | null {
  const colonIdx = text.indexOf(":");
  if (colonIdx === -1) return null;

  const intro = text.slice(0, colonIdx).trim();
  const afterColon = text.slice(colonIdx + 1);

  const listMatch = afterColon.match(
    /^\s*((?:[^,]+,\s*)+[^,.]+)\.\s*([\s\S]*)$/
  );
  if (!listMatch) return null;

  const items = listMatch[1]
    .split(/,\s*/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length < 2) return null;
  if (items.some((item) => item.includes("→"))) return null;

  const useChips = items.every((item) => wordCount(item) <= 4);
  const outro = listMatch[2]?.trim() || undefined;

  return { type: "colon_list", intro, items, outro, useChips };
}

/** Parse workbook body strings into structured render hints; always safe to fall back to prose. */
export function formatWorkbookBody(text: string): FormattedBody {
  const trimmed = text.trim();
  if (!trimmed) return { type: "prose", text: "" };

  const weekTimeline = detectWeekTimeline(trimmed);
  if (weekTimeline) return weekTimeline;

  const colonList = detectColonList(trimmed);
  if (colonList) return colonList;

  const arrowChain = detectArrowChain(trimmed);
  if (arrowChain) return arrowChain;

  const signalRewrite = detectSignalRewrite(trimmed);
  if (signalRewrite) return signalRewrite;

  const enumeration = detectEnumeration(trimmed);
  if (enumeration) return enumeration;

  return { type: "prose", text: trimmed };
}
