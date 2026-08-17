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
import { ProfileIdentityHeader } from "@/components/profile/profile-identity-header";
import type { XpBreakdownLine } from "@/lib/xp";
import { formatRankMessage } from "@/lib/rankings";
import type { StreakMilestoneEntry } from "@/lib/streaks";
import { cn } from "@/lib/utils";

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
  institutionName?: string | null;
  streakHistory: StreakMilestoneEntry[];
  xpLines: XpBreakdownLine[];
  completedModules: {
    module_code: string;
    title: string;
    completed_at: string | null;
    quiz_score: number | null;
    quiz_total: number;
  }[];
  afterIdentity?: React.ReactNode;
};

export function ProfileEditor({
  profile,
  institutionName,
  streakHistory,
  xpLines,
  completedModules,
  afterIdentity,
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
    <div className="space-y-8">
      <ProfileIdentityHeader
        fullName={profile.full_name}
        institutionName={institutionName ?? null}
        profilePictureUrl={pictureUrl}
        bio={profile.bio}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="lift-card rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Total XP
          </p>
          <p className="mt-2 text-3xl font-semibold text-accent">{profile.xp}</p>
        </div>
        <div className="lift-card rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Streak
          </p>
          <p className="mt-2 text-3xl font-semibold text-lift">
            {profile.streak_days}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">weeks</p>
        </div>
        <div className="lift-card rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Rank
          </p>
          <p className="mt-2 text-base font-semibold leading-snug text-accent">
            {profile.rank
              ? formatRankMessage(profile.rank)
              : "Complete modules to rank"}
          </p>
        </div>
      </div>

      {afterIdentity}

      <div className="lift-card space-y-6 rounded-2xl p-6 md:p-7">
        <div>
          <h2 className="text-lg font-semibold">Edit profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Update how you show up in Corporate Academy.
          </p>
        </div>

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {pictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pictureUrl}
              alt="Profile"
              className="size-20 rounded-full border border-lift/20 object-cover"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-full bg-lift-muted text-2xl font-semibold text-lift">
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
              className="lift-input rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile_picture_url">Profile picture URL</Label>
            <Input
              id="profile_picture_url"
              name="profile_picture_url"
              defaultValue={pictureUrl ?? ""}
              placeholder="https://... or upload above"
              className="lift-input rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              defaultValue={profile.linkedin_url ?? ""}
              className="lift-input rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grad_year">Graduation year</Label>
            <Input
              id="grad_year"
              name="grad_year"
              type="number"
              defaultValue={profile.grad_year ?? ""}
              className="lift-input rounded-xl"
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
              className="lift-input rounded-xl"
            />
          </div>
          <Button
            type="submit"
            disabled={pending}
            className={cn("lift-btn", saved && "bg-lift-hover")}
          >
            {pending ? "Saving..." : saved ? "Saved!" : "Save profile"}
          </Button>
        </form>
      </div>

      <div className="lift-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold">XP breakdown</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Total: <span className="font-semibold text-accent">{profile.xp} XP</span>
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {xpLines.map((line) => (
            <li key={line.label} className="flex justify-between gap-4">
              <span className="min-w-0 lift-text-wrap">
                {line.label}
                {line.count ? ` (${line.count})` : ""}
              </span>
              <span className="shrink-0 font-medium text-accent">+{line.xp} XP</span>
            </li>
          ))}
        </ul>
      </div>

      {streakHistory.length > 0 ? (
        <div className="lift-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Streak history</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Milestones earned from weekly activity
          </p>
          <ul className="mt-4 divide-y divide-border text-sm">
            {streakHistory.map((entry) => (
              <li
                key={entry.weeks}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="min-w-0 lift-text-wrap">
                  <span className="font-medium">{entry.weeks}-week streak</span>
                  {" · "}
                  {entry.badge}
                </span>
                <span className="shrink-0 text-accent">+{entry.xp} XP</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {profile.earned_badges.length > 0 ? (
        <div className="lift-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Badges</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.earned_badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-accent/15 px-3 py-1 text-sm font-medium text-accent"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="lift-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold">Completed modules</h2>
        {completedModules.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No modules completed yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border text-sm">
            {completedModules.map((m) => (
              <li
                key={m.module_code}
                className="flex min-w-0 items-start justify-between gap-3 py-2.5"
              >
                <span className="min-w-0">
                  <span className="mr-2 inline-flex shrink-0 rounded-full bg-lift-muted px-2 py-0.5 font-mono text-[10px] font-bold text-lift">
                    {m.module_code}
                  </span>
                  <span className="lift-text-wrap">{m.title}</span>
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {m.quiz_total > 0
                    ? `${m.quiz_score}/${m.quiz_total} quiz`
                    : "Live session"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
