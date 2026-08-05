export type FormattedColonList = {
  type: "colon_list";
  intro: string;
  items: string[];
  outro?: string;
  useChips: boolean;
};

export type FormattedContrastGroups = {
  type: "contrast_groups";
  intro?: string;
  groups: { label: string; items: string[] }[];
  outro?: string;
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
  | FormattedContrastGroups
  | FormattedArrowChain
  | FormattedEnumeration
  | FormattedWeekTimeline
  | FormattedSignalRewrite
  | FormattedProse;

const MAX_LIST_ITEM_WORDS = 12;

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Split on a separator only at nesting depth 0 — ignore separators inside
 * (...), [...], and inside "..." or '...' quotes (not mid-word apostrophes).
 */
export function splitTopLevel(
  text: string,
  separator: string = ","
): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (quote) {
      current += ch;
      if (ch === quote && text[i - 1] !== "\\") {
        quote = null;
      }
      continue;
    }

    if (ch === '"') {
      quote = '"';
      current += ch;
      continue;
    }

    // Single quote opens a string only at a boundary — skip contractions (doesn't).
    if (ch === "'") {
      const atBoundary = i === 0 || /[\s([{,:]/.test(text[i - 1]);
      if (atBoundary) {
        quote = "'";
      }
      current += ch;
      continue;
    }

    if (ch === "(" || ch === "[") {
      depth += 1;
      current += ch;
      continue;
    }

    if (ch === ")" || ch === "]") {
      depth = Math.max(0, depth - 1);
      current += ch;
      continue;
    }

    if (depth === 0 && text.startsWith(separator, i)) {
      parts.push(current.trim());
      current = "";
      i += separator.length - 1;
      continue;
    }

    current += ch;
  }

  if (current.trim()) parts.push(current.trim());
  return parts.filter(Boolean);
}

/** True when a double-quoted span covers roughly half or more of the text. */
function isPredominantlyQuoted(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  let longest = 0;
  let inQuote = false;
  let start = -1;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inQuote) {
      if (ch === '"' && trimmed[i - 1] !== "\\") {
        longest = Math.max(longest, i - start + 1);
        inQuote = false;
        start = -1;
      }
      continue;
    }
    if (ch === '"') {
      inQuote = true;
      start = i;
    }
  }

  return longest >= trimmed.length * 0.5;
}

/** Item looks like a new sentence/clause was glued in — not a list item. */
function itemLooksLikeProseClause(item: string): boolean {
  return /\.\s+[A-Z]/.test(item);
}

/**
 * Real workbook lists are short parallel phrases. Allow all-capital-led OR
 * all-lowercase-led (Student-Mode Detector), but reject mixed casing and
 * prose fragments glued with coordinating conjunctions.
 */
function itemsHaveConsistentLeadStyle(items: string[]): boolean {
  const leads = items.map((item) => {
    const ch = item.trim().charAt(0);
    if (/[A-Z0-9]/.test(ch)) return "upper";
    if (/[a-z]/.test(ch)) return "lower";
    return "other";
  });
  if (leads.some((lead) => lead === "other")) return false;
  return leads.every((lead) => lead === leads[0]);
}

function itemStartsWithConjunction(item: string): boolean {
  return /^(and|or|but|nor|yet)\b/i.test(item.trim());
}

function looksLikeListItems(items: string[]): boolean {
  if (items.length < 2) return false;
  if (items.some((item) => item.includes("→"))) return false;
  if (items.some((item) => itemLooksLikeProseClause(item))) return false;
  if (items.some((item) => wordCount(item) > MAX_LIST_ITEM_WORDS)) return false;
  if (items.some((item) => itemStartsWithConjunction(item))) return false;
  if (!itemsHaveConsistentLeadStyle(items)) return false;
  return true;
}

/** Contrast mini-lists are often lowercase verb phrases ("waits for instructions"). */
function looksLikeContrastItems(items: string[]): boolean {
  if (items.length < 2) return false;
  if (items.some((item) => item.includes("→"))) return false;
  if (items.some((item) => itemLooksLikeProseClause(item))) return false;
  if (items.some((item) => wordCount(item) > MAX_LIST_ITEM_WORDS)) return false;
  return true;
}

/**
 * Peel trailing prose after a list that ends with ". ".
 * Uses depth-aware awareness so periods inside parentheses don't cut early.
 */
function peelListAndOutro(
  afterColon: string
): { listPortion: string; outro?: string } | null {
  const trimmed = afterColon.trim();
  if (!trimmed) return null;

  let depth = 0;
  let inDoubleQuote = false;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];

    if (inDoubleQuote) {
      if (ch === '"' && trimmed[i - 1] !== "\\") inDoubleQuote = false;
      continue;
    }
    if (ch === '"') {
      inDoubleQuote = true;
      continue;
    }
    if (ch === "(" || ch === "[") {
      depth += 1;
      continue;
    }
    if (ch === ")" || ch === "]") {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (
      depth === 0 &&
      ch === "." &&
      (i === trimmed.length - 1 || /\s/.test(trimmed[i + 1]))
    ) {
      const listPortion = trimmed.slice(0, i).trim();
      const outro = trimmed.slice(i + 1).trim() || undefined;
      if (listPortion) return { listPortion, outro };
    }
  }

  return { listPortion: trimmed };
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
  // Pure quoted before→after pairs belong to detectSignalRewrite.
  if (
    /"\s*→\s*"/.test(text) &&
    !/\w+\s+→\s+\w+/.test(text.replace(/"[^"]*"/g, ""))
  ) {
    return null;
  }

  const arrows = [...text.matchAll(/→/g)];
  if (arrows.length < 2) return null;

  const firstArrow = arrows[0].index ?? 0;
  const lastArrow = arrows[arrows.length - 1].index ?? 0;

  // Clamp LEFT: nearest preceding sentence boundary, colon, or start.
  const before = text.slice(0, firstArrow);
  let clampStart = 0;
  for (const match of before.matchAll(/[.!?]\s+(?=[A-Z])/g)) {
    if (match.index !== undefined) {
      clampStart = match.index + match[0].length;
    }
  }
  const colonIdx = before.lastIndexOf(":");
  if (colonIdx !== -1 && colonIdx + 1 > clampStart) {
    clampStart = colonIdx + 1;
  }

  // Clamp RIGHT: nearest following sentence end before a new sentence (or EOS).
  let clampEnd = text.length;
  for (let i = lastArrow + 1; i < text.length; i++) {
    const ch = text[i];
    if (ch !== "." && ch !== "!" && ch !== "?") continue;
    const rest = text.slice(i + 1);
    if (rest.trim() === "" || /^\s+[A-Z]/.test(rest)) {
      clampEnd = i;
      break;
    }
  }

  const intro = text.slice(0, clampStart).trim() || undefined;
  const outro =
    text
      .slice(clampEnd)
      .replace(/^[.!?]\s*/, "")
      .trim() || undefined;

  const chainSpan = text.slice(clampStart, clampEnd).trim();
  const rawSteps = chainSpan
    .split(/\s*→\s*/)
    .map((step) => step.trim().replace(/\.\s*$/, ""))
    // Drop marker-only tokens like "(repeat)" — real word "repeat" stays.
    .filter((step) => step && !/^\([^)]*\)$/.test(step));

  if (rawSteps.length < 3) return null;
  // A step that still embeds a sentence boundary means clamping failed.
  if (rawSteps.some((step) => itemLooksLikeProseClause(step))) return null;

  return {
    type: "arrow_chain",
    intro,
    steps: rawSteps,
    outro,
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

/**
 * Two+ labelled mini-lists in one body, e.g.
 * "… Student Identity: a, b, c. Pre-Professional Identity: x, y, z."
 */
export function detectContrastGroups(
  text: string
): FormattedContrastGroups | null {
  // Labels like "Student Identity:" / "Pre-Professional Identity:" after a
  // sentence boundary (or start). Keeps simple "Intro: a, b, c." out.
  const labelPattern = /(?:^|[.!?]\s+)([A-Z][A-Za-z0-9 /&-]{1,40}):\s*/g;
  const labels = [...text.matchAll(labelPattern)];
  if (labels.length < 2) return null;

  const groups: { label: string; items: string[] }[] = [];

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i][1].trim();
    const contentStart = (labels[i].index ?? 0) + labels[i][0].length;
    const contentEnd =
      i + 1 < labels.length
        ? labels[i + 1].index ?? text.length
        : text.length;
    let content = text.slice(contentStart, contentEnd).trim();

    if (i < labels.length - 1) {
      // Stop before the ". Pre-Professional…" that prefixes the next label
      content = content.replace(/[.!?]?\s*$/, "").trim();
    } else {
      const peeled = peelListAndOutro(content);
      if (peeled) content = peeled.listPortion;
    }

    const items = splitTopLevel(content, ",")
      .map((item) => item.replace(/\.\s*$/, "").trim())
      .filter(Boolean);

    if (!looksLikeContrastItems(items)) return null;
    groups.push({ label, items });
  }

  const firstLabelIdx = labels[0].index ?? 0;
  const before = text.slice(0, firstLabelIdx);
  const intro = before.replace(/[.!?]?\s*$/, "").trim() || undefined;

  const lastLabel = labels[labels.length - 1];
  const afterLastLabel = text.slice(
    (lastLabel.index ?? 0) + lastLabel[0].length
  );
  const outro = peelListAndOutro(afterLastLabel)?.outro;

  return {
    type: "contrast_groups",
    intro,
    groups,
    outro,
  };
}

export function detectColonList(text: string): FormattedColonList | null {
  const colonIdx = text.indexOf(":");
  if (colonIdx === -1) return null;

  // Multi-label contrasts (Identity Gap) belong to detectContrastGroups.
  if (detectContrastGroups(text)) return null;

  const intro = text.slice(0, colonIdx).trim();
  const afterColon = text.slice(colonIdx + 1);

  if (!intro || !afterColon.trim()) return null;

  // Quoted message templates / long quotes → prose
  if (isPredominantlyQuoted(afterColon)) return null;

  const peeled = peelListAndOutro(afterColon);
  if (!peeled) return null;

  const items = splitTopLevel(peeled.listPortion, ",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!looksLikeListItems(items)) return null;

  const useChips = items.every((item) => wordCount(item) <= 4);
  const outro = peeled.outro;

  return { type: "colon_list", intro, items, outro, useChips };
}

/** Parse workbook body strings into structured render hints; always safe to fall back to prose. */
export function formatWorkbookBody(text: string): FormattedBody {
  const trimmed = text.trim();
  if (!trimmed) return { type: "prose", text: "" };

  // Specific detectors first — colon list is the most generic and must not win early.
  const weekTimeline = detectWeekTimeline(trimmed);
  if (weekTimeline) return weekTimeline;

  // Prefer colon list when it owns a trailing signal-rewrite outro (e.g. Student-Mode Detector).
  const colonList = detectColonList(trimmed);
  if (colonList?.outro && detectSignalRewrite(colonList.outro)) {
    return colonList;
  }

  const signalRewrite = detectSignalRewrite(trimmed);
  if (signalRewrite) return signalRewrite;

  const arrowChain = detectArrowChain(trimmed);
  if (arrowChain) return arrowChain;

  const enumeration = detectEnumeration(trimmed);
  if (enumeration) return enumeration;

  const contrastGroups = detectContrastGroups(trimmed);
  if (contrastGroups) return contrastGroups;

  if (colonList) return colonList;

  return { type: "prose", text: trimmed };
}
