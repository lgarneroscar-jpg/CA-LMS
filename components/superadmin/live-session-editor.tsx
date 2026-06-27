"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateLiveSession } from "@/app/actions/content-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type LiveSessionRow = {
  id: string;
  module_code: string;
  title: string;
  description: string | null;
  unlock_week: number;
  stream_url: string | null;
  recording_url: string | null;
};

export function LiveSessionEditor({ sessions }: { sessions: LiveSessionRow[] }) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(session: LiveSessionRow, form: HTMLFormElement) {
    setSavingId(session.id);
    setError(null);
    try {
      const formData = new FormData(form);
      formData.set("moduleId", session.id);
      await updateLiveSession(formData);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {sessions.map((session) => (
        <form
          key={session.id}
          className="space-y-4 rounded-xl border border-border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave(session, e.currentTarget);
          }}
        >
          <div>
            <p className="text-sm text-muted-foreground">
              {session.module_code} · Week {session.unlock_week}
            </p>
            <h2 className="text-lg font-semibold">{session.title}</h2>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input name="title" defaultValue={session.title} required />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              name="description"
              defaultValue={session.description ?? ""}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Stream URL</Label>
            <Input
              name="streamUrl"
              defaultValue={session.stream_url ?? ""}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Recording URL (post-session)</Label>
            <Input
              name="recordingUrl"
              defaultValue={session.recording_url ?? ""}
              placeholder="https://..."
            />
          </div>
          <Button type="submit" disabled={savingId === session.id}>
            {savingId === session.id ? "Saving…" : "Save session"}
          </Button>
        </form>
      ))}
    </div>
  );
}
