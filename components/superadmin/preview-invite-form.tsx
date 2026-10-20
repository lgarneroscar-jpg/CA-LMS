"use client";

import { useState, useTransition } from "react";
import { invitePreviewUser } from "@/app/actions/preview-invites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PreviewInviteForm({ institutionName }: { institutionName: string }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null
  );
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await invitePreviewUser({ email, fullName });
        if (result.ok) {
          setMessage({ tone: "ok", text: `Invite sent to ${result.email}.` });
          setEmail("");
          setFullName("");
        } else {
          setMessage({ tone: "error", text: result.reason });
        }
      } catch {
        setMessage({ tone: "error", text: "Couldn't send the invite. Try again." });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite to preview</CardTitle>
        <CardDescription>
          Adds a student account in {institutionName}, the demo cohort. Their answers
          stay private and they&apos;re left out of every report and total. The invite
          link signs them straight in — no password needed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="preview-invite-email">Email</Label>
            <Input
              id="preview-invite-email"
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="preview-invite-name">Name (optional)</Label>
            <Input
              id="preview-invite-name"
              autoComplete="off"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={pending || !email.trim()}>
            {pending ? "Sending…" : "Send invite"}
          </Button>
        </form>
        {message ? (
          <p
            role="status"
            className={
              message.tone === "error"
                ? "mt-3 text-sm text-destructive"
                : "mt-3 text-sm text-foreground"
            }
          >
            {message.text}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
