"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  resendStudentInvite,
  type RosterStudentRow,
} from "@/app/actions/roster-invites";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusLabel(status: RosterStudentRow["inviteStatus"]): string {
  switch (status) {
    case "accepted":
      return "Accepted";
    case "pending":
      return "Not yet accepted";
    default:
      return "Unknown";
  }
}

export function RosterTable({
  institutionId,
  students,
}: {
  institutionId: string;
  students: RosterStudentRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [messageById, setMessageById] = useState<Record<string, string>>({});

  const invited = students.filter((s) => s.inviteStatus !== "unknown").length;
  const accepted = students.filter((s) => s.inviteStatus === "accepted").length;
  const pendingCount = students.filter(
    (s) => s.inviteStatus === "pending"
  ).length;

  function resend(student: RosterStudentRow) {
    const ok = window.confirm(
      `Send a fresh invite link to ${student.full_name ?? student.email ?? "this student"}?\n\nThis affects 1 student. Any earlier link stops working. No password is set or emailed.`
    );
    if (!ok) return;

    startTransition(async () => {
      const result = await resendStudentInvite(institutionId, student.id);
      setMessageById((prev) => ({
        ...prev,
        [student.id]: result.ok
          ? `${result.via === "invite" ? "Fresh invite" : "Password link"} sent ${formatDateTime(result.sentAt)}`
          : result.reason,
      }));
      if (result.ok) router.refresh();
    });
  }

  if (students.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No students on this roster yet. Upload a CSV to invite the first cohort.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Invited {invited} · Accepted {accepted} · Not yet accepted{" "}
        {pendingCount}
      </p>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Last invite sent</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-t">
                <td className="px-3 py-2">
                  {student.full_name ?? "Unnamed"}
                  {student.is_demo ? (
                    <Badge variant="secondary" className="ml-2">
                      demo
                    </Badge>
                  ) : null}
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {student.email ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <Badge
                    variant={
                      student.inviteStatus === "accepted"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {statusLabel(student.inviteStatus)}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {student.inviteStatus === "accepted"
                    ? formatDate(student.invitedAt)
                    : formatDateTime(student.lastLinkSentAt)}
                </td>
                <td className="px-3 py-2">
                  {student.inviteStatus === "pending" ? (
                    <div className="space-y-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={pending}
                        onClick={() => resend(student)}
                      >
                        Resend
                      </Button>
                      {messageById[student.id] ? (
                        <p className="text-xs text-muted-foreground">
                          {messageById[student.id]}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
