"use client";

import { useState, useTransition } from "react";
import { saveAdminLiveAttendance } from "@/app/actions/admin-attendance";
import { Button } from "@/components/ui/button";

type AdminAttendanceEditorProps = {
  institutionId: string;
  sessionModuleId: string;
  sessionLabel: string;
  students: { id: string; full_name: string | null }[];
  initialAttendance: Record<
    string,
    { attended: boolean; source: string | null }
  >;
};

export function AdminAttendanceEditor({
  institutionId,
  sessionModuleId,
  sessionLabel,
  students,
  initialAttendance,
}: AdminAttendanceEditorProps) {
  const [attended, setAttended] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const student of students) {
      map[student.id] = initialAttendance[student.id]?.attended ?? false;
    }
    return map;
  });
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggleStudent(studentId: string) {
    setAttended((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      const attendedIds = Object.entries(attended)
        .filter(([, value]) => value)
        .map(([id]) => id);
      await saveAdminLiveAttendance(
        institutionId,
        sessionModuleId,
        attendedIds
      );
      setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Admin-confirmed attendance overrides self-reported marks. Self-reported
        data is never presented as verified in reporting.
      </p>
      <ul className="divide-y divide-border rounded-lg border">
        {students.map((student) => {
          const source = initialAttendance[student.id]?.source;
          return (
            <li
              key={student.id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <label className="flex flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={attended[student.id] ?? false}
                  onChange={() => toggleStudent(student.id)}
                  className="size-4 rounded border-border"
                />
                <span>{student.full_name ?? "Unnamed"}</span>
              </label>
              {source === "self_reported" && attended[student.id] ? (
                <span className="text-xs text-amber-700">was self-reported</span>
              ) : source === "admin_confirmed" && attended[student.id] ? (
                <span className="text-xs text-emerald-700">admin-confirmed</span>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={pending || students.length === 0}>
          {pending ? "Saving…" : `Save attendance for ${sessionLabel}`}
        </Button>
        {saved ? (
          <span className="text-sm text-muted-foreground">Saved.</span>
        ) : null}
      </div>
    </div>
  );
}
