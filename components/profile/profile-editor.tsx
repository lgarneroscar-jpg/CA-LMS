"use client";

import { useRef, useState, useTransition } from "react";
import {
  updateStudentProfile,
  uploadProfilePicture,
} from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { XpBreakdownLine } from "@/lib/xp";
import { formatRankMessage } from "@/lib/rankings";
import type { StreakMilestoneEntry } from "@/lib/streaks";

type ProfileEditorProps = {
  profile: {
    full_name: string | null;
    bio: string | null;
    linkedin_url: string | null;
    grad_year: number | null;
    profile_picture_url: string | null;
    xp: number;
    streak_days: number;
    rank: number | null;
    earned_badges: string[];
  };
  streakHistory: StreakMilestoneEntry[];
  xpLines: XpBreakdownLine[];
  completedModules: {
    module_code: string;
    title: string;
    completed_at: string | null;
    quiz_score: number | null;
    quiz_total: number;
  }[];
};

export function ProfileEditor({
  profile,
  streakHistory,
  xpLines,
  completedModules,
}: ProfileEditorProps) {
  const [pending, startTransition] = useTransition();
  const [uploadPending, startUploadTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [pictureUrl, setPictureUrl] = useState(profile.profile_picture_url);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateStudentProfile(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleUpload(formData: FormData) {
    startUploadTransition(async () => {
      const result = await uploadProfilePicture(formData);
      if (result.url) setPictureUrl(result.url);
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
          <CardDescription>Update how you show up in Corporate Academy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {pictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pictureUrl}
                alt="Profile"
                className="size-20 rounded-full border object-cover"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full border bg-muted text-2xl font-semibold text-muted-foreground">
                {(profile.full_name ?? "S").charAt(0).toUpperCase()}
              </div>
            )}
            <form action={handleUpload} className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                name="file"
                accept="image/*"
                className="text-sm"
                onChange={(e) => {
                  const form = e.target.form;
                  if (form && e.target.files?.[0]) form.requestSubmit();
                }}
              />
              {uploadPending ? (
                <p className="text-xs text-muted-foreground">Uploading...</p>
              ) : null}
            </form>
          </div>

          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={profile.full_name ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile_picture_url">Profile picture URL</Label>
              <Input
                id="profile_picture_url"
                name="profile_picture_url"
                defaultValue={pictureUrl ?? ""}
                placeholder="https://... or upload above"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                name="linkedin_url"
                defaultValue={profile.linkedin_url ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grad_year">Graduation year</Label>
              <Input
                id="grad_year"
                name="grad_year"
                type="number"
                defaultValue={profile.grad_year ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio (150 chars max)</Label>
              <Textarea
                id="bio"
                name="bio"
                maxLength={150}
                defaultValue={profile.bio ?? ""}
                rows={3}
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : saved ? "Saved!" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>XP breakdown</CardTitle>
          <CardDescription>
            Total: <span className="font-semibold text-accent">{profile.xp} XP</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {xpLines.map((line) => (
              <li key={line.label} className="flex justify-between gap-4">
                <span>
                  {line.label}
                  {line.count ? ` (${line.count})` : ""}
                </span>
                <span className="font-medium">+{line.xp} XP</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Weekly streak</CardDescription>
            <CardTitle className="text-3xl">{profile.streak_days} weeks</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cohort rank</CardDescription>
            <CardTitle className="text-lg">
              {profile.rank
                ? formatRankMessage(profile.rank)
                : "Rank updates as you complete modules"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {streakHistory.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Streak history</CardTitle>
            <CardDescription>Milestones earned from weekly activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border text-sm">
              {streakHistory.map((entry) => (
                <li
                  key={entry.weeks}
                  className="flex items-center justify-between py-2"
                >
                  <span>
                    <span className="font-medium">{entry.weeks}-week streak</span>
                    {" · "}
                    {entry.badge}
                  </span>
                  <span className="text-muted-foreground">+{entry.xp} XP</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {profile.earned_badges.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {profile.earned_badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-accent/15 px-3 py-1 text-sm font-medium text-accent"
              >
                {badge}
              </span>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Completed modules</CardTitle>
        </CardHeader>
        <CardContent>
          {completedModules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No modules completed yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {completedModules.map((m) => (
                <li key={m.module_code} className="flex justify-between py-2">
                  <span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {m.module_code}
                    </span>{" "}
                    {m.title}
                  </span>
                  <span className="text-muted-foreground">
                    {m.quiz_total > 0
                      ? `${m.quiz_score}/${m.quiz_total} quiz`
                      : "Live session"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
