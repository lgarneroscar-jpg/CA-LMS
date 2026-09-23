"use client";

import { useMemo, useState, useTransition } from "react";
import {
  inviteStudentsBatch,
  previewRosterAgainstExisting,
  type InviteRowResult,
} from "@/app/actions/roster-invites";
import { parseRosterCsv, type RosterCsvRow } from "@/lib/roster-csv";
import { Button } from "@/components/ui/button";

export function RosterUpload({ institutionId }: { institutionId: string }) {
  const [pending, startTransition] = useTransition();
  const [rawText, setRawText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [alreadyUserEmails, setAlreadyUserEmails] = useState<string[]>([]);
  const [existingStudentCount, setExistingStudentCount] = useState<number | null>(
    null
  );
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [results, setResults] = useState<InviteRowResult[] | null>(null);
  const [smtpNotConfigured, setSmtpNotConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(
    () => (rawText != null ? parseRosterCsv(rawText) : null),
    [rawText]
  );

  const invitableRows: RosterCsvRow[] = useMemo(() => {
    if (!parsed) return [];
    const already = new Set(alreadyUserEmails);
    return parsed.rows.filter((r) => !already.has(r.email.toLowerCase()));
  }, [parsed, alreadyUserEmails]);

  function onFile(file: File | null) {
    setResults(null);
    setSmtpNotConfigured(false);
    setAwaitingConfirm(false);
    setAlreadyUserEmails([]);
    setExistingStudentCount(null);
    setError(null);
    if (!file) {
      setRawText(null);
      setFileName(null);
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setRawText(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsText(file);
  }

  function runPreview() {
    if (!parsed || parsed.rows.length === 0) return;
    setError(null);
    setResults(null);
    startTransition(async () => {
      try {
        const preview = await previewRosterAgainstExisting(
          institutionId,
          parsed.rows.map((r) => ({ full_name: r.full_name, email: r.email }))
        );
        setAlreadyUserEmails(preview.alreadyUserEmails);
        setExistingStudentCount(preview.existingStudentCount);
        setAwaitingConfirm(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Preview failed");
      }
    });
  }

  function sendInvites() {
    if (invitableRows.length === 0) return;
    const count = invitableRows.length;
    const ok = window.confirm(
      `Send invite emails to ${count} student${count === 1 ? "" : "s"}?\n\n` +
        `This adds to the existing roster` +
        (existingStudentCount
          ? ` (${existingStudentCount} student${existingStudentCount === 1 ? "" : "s"} already on this institution)`
          : "") +
        `. It never replaces existing students.\n\n` +
        `No passwords are set — students create their own via the invite link.`
    );
    if (!ok) return;

    setError(null);
    startTransition(async () => {
      try {
        const outcome = await inviteStudentsBatch(
          institutionId,
          invitableRows.map((r) => ({
            full_name: r.full_name,
            email: r.email,
          })),
          { confirmed: true }
        );
        setResults(outcome.results);
        setSmtpNotConfigured(outcome.smtpNotConfigured);
        setAwaitingConfirm(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invite failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Upload roster CSV (`full_name,email`)
        </label>
        <input
          type="file"
          accept=".csv,text/csv"
          className="block w-full text-sm"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        {fileName ? (
          <p className="text-xs text-muted-foreground">Loaded: {fileName}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Uploading never sends invites. Preview first, then confirm to send.
          Rosters always <strong>add</strong> — they never replace existing
          students.
        </p>
      </div>

      {parsed ? (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium">
            Preview · {parsed.rows.length} valid row
            {parsed.rows.length === 1 ? "" : "s"}
            {parsed.issues.length > 0
              ? ` · ${parsed.issues.length} issue${parsed.issues.length === 1 ? "" : "s"}`
              : ""}
          </p>

          {parsed.issues.length > 0 ? (
            <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-destructive">
              {parsed.issues.map((issue, i) => (
                <li key={`${issue.line}-${i}`}>
                  Line {issue.line}
                  {issue.email ? ` (${issue.email})` : ""}: {issue.message}
                </li>
              ))}
            </ul>
          ) : null}

          {parsed.rows.length > 0 ? (
            <div className="max-h-56 overflow-auto rounded border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.map((row) => {
                    const exists = alreadyUserEmails.includes(
                      row.email.toLowerCase()
                    );
                    return (
                      <tr key={row.line} className="border-t">
                        <td className="px-3 py-1.5">{row.full_name}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">
                          {row.email}
                        </td>
                        <td className="px-3 py-1.5 text-xs text-muted-foreground">
                          {exists ? "Already a user — will skip" : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={pending || parsed.rows.length === 0}
              onClick={runPreview}
            >
              {pending && !awaitingConfirm ? "Checking…" : "Check against existing users"}
            </Button>
            {awaitingConfirm ? (
              <Button
                type="button"
                disabled={pending || invitableRows.length === 0}
                onClick={sendInvites}
              >
                {pending
                  ? "Sending…"
                  : `Send ${invitableRows.length} invite${invitableRows.length === 1 ? "" : "s"}`}
              </Button>
            ) : null}
          </div>

          {awaitingConfirm && existingStudentCount != null ? (
            <p className="text-sm text-muted-foreground">
              This institution already has {existingStudentCount} student
              {existingStudentCount === 1 ? "" : "s"}. Sending will{" "}
              <strong>add</strong> new invites — it will not replace the
              roster.
              {alreadyUserEmails.length > 0
                ? ` ${alreadyUserEmails.length} email(s) already exist as users and will be skipped.`
                : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      {smtpNotConfigured ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          Custom SMTP is not configured in Supabase Auth. Built-in email only
          delivers to project team members. Configure Authentication → SMTP
          Settings before inviting students outside the team.
        </p>
      ) : null}

      {results ? (
        <div className="space-y-2 rounded-lg border p-4">
          <p className="text-sm font-medium">
            Results ·{" "}
            {results.filter((r) => r.status === "sent").length} sent ·{" "}
            {results.filter((r) => r.status === "already_exists").length} already
            exist · {results.filter((r) => r.status === "failed").length} failed
          </p>
          <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
            {results.map((r) => (
              <li key={r.email} className="flex flex-wrap gap-2 border-t py-1.5">
                <span className="font-medium">{r.full_name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {r.email}
                </span>
                <span
                  className={
                    r.status === "sent"
                      ? "text-xs text-emerald-700"
                      : r.status === "already_exists"
                        ? "text-xs text-muted-foreground"
                        : "text-xs text-destructive"
                  }
                >
                  {r.status}
                  {r.reason ? ` — ${r.reason}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
