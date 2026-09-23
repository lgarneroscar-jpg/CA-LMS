export type RosterCsvRow = {
  line: number;
  full_name: string;
  email: string;
};

export type RosterCsvIssue = {
  line: number;
  email?: string;
  message: string;
};

export type RosterCsvParseResult = {
  rows: RosterCsvRow[];
  issues: RosterCsvIssue[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

/**
 * Parse a roster CSV. Expects a header row with full_name and email
 * (order flexible; aliases: name, student_name).
 */
export function parseRosterCsv(text: string): RosterCsvParseResult {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const issues: RosterCsvIssue[] = [];
  if (lines.length === 0) {
    return { rows: [], issues: [{ line: 0, message: "File is empty" }] };
  }

  const headerCells = parseCsvLine(lines[0]).map((c) => c.toLowerCase());
  const nameIdx = headerCells.findIndex((h) =>
    ["full_name", "name", "student_name", "fullname"].includes(h)
  );
  const emailIdx = headerCells.findIndex((h) =>
    ["email", "email_address", "e-mail"].includes(h)
  );

  if (nameIdx < 0 || emailIdx < 0) {
    return {
      rows: [],
      issues: [
        {
          line: 1,
          message: "Header must include full_name and email columns",
        },
      ],
    };
  }

  const rows: RosterCsvRow[] = [];
  const seenEmails = new Map<string, number>();

  for (let i = 1; i < lines.length; i += 1) {
    const lineNumber = i + 1;
    const cells = parseCsvLine(lines[i]);
    const full_name = (cells[nameIdx] ?? "").trim();
    const email = (cells[emailIdx] ?? "").trim().toLowerCase();

    if (!full_name && !email) continue;

    if (!full_name) {
      issues.push({ line: lineNumber, email, message: "Missing full_name" });
      continue;
    }
    if (!email) {
      issues.push({ line: lineNumber, message: "Missing email" });
      continue;
    }
    if (!EMAIL_RE.test(email)) {
      issues.push({
        line: lineNumber,
        email,
        message: "Email is not well-formed",
      });
      continue;
    }

    const prior = seenEmails.get(email);
    if (prior != null) {
      issues.push({
        line: lineNumber,
        email,
        message: `Duplicate of line ${prior} in this file`,
      });
      continue;
    }

    seenEmails.set(email, lineNumber);
    rows.push({ line: lineNumber, full_name, email });
  }

  return { rows, issues };
}
