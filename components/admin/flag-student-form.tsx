"use client";

import { useState, useTransition } from "react";
import { flagStudent, unflagStudent } from "@/app/actions/flags";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FlagStudentFormProps = {
  institutionId: string;
  studentId: string;
  existingNote: string | null;
  isFlagged: boolean;
};

export function FlagStudentForm({
  institutionId,
  studentId,
  existingNote,
  isFlagged,
}: FlagStudentFormProps) {
  const [note, setNote] = useState(existingNote ?? "");
  const [pending, startTransition] = useTransition();

  function handleFlag() {
    startTransition(async () => {
      await flagStudent({ institutionId, studentId, note });
    });
  }

  function handleUnflag() {
    startTransition(async () => {
      await unflagStudent({ institutionId, studentId });
      setNote("");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flag student</CardTitle>
        <CardDescription>
          Flags are visible to admins and super admin only — not the student.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note about follow-up needed..."
          rows={3}
        />
        <div className="flex gap-2">
          <Button onClick={handleFlag} disabled={pending}>
            {isFlagged ? "Update flag" : "Flag student"}
          </Button>
          {isFlagged ? (
            <Button variant="outline" onClick={handleUnflag} disabled={pending}>
              Remove flag
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
