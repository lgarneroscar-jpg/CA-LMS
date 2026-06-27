import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchXpBreakdownForStudent } from "@/lib/program-completion";
import { buildStreakHistory } from "@/lib/streaks";
import { ProfileEditor } from "@/components/profile/profile-editor";

export default async function ProfilePage() {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const { breakdown } = await fetchXpBreakdownForStudent(
    supabase,
    profile.id,
    profile.program_started_at ?? null
  );

  const { data: modules } = await supabase
    .from("modules")
    .select("id, module_code, title, is_live_session")
    .order("unlock_week")
    .order("order_index");

  const { data: progress } = await supabase
    .from("student_progress")
    .select("module_id, completed_at, quiz_score, is_complete")
    .eq("student_id", profile.id)
    .eq("is_complete", true);

  const { data: quizCounts } = await supabase
    .from("quiz_questions")
    .select("module_id");

  const quizTotalByModule = new Map<string, number>();
  (quizCounts ?? []).forEach((q) => {
    quizTotalByModule.set(
      q.module_id,
      (quizTotalByModule.get(q.module_id) ?? 0) + 1
    );
  });

  const moduleMap = new Map((modules ?? []).map((m) => [m.id, m]));

  const completedModules = (progress ?? []).map((p) => {
    const mod = moduleMap.get(p.module_id);
    return {
      module_code: mod?.module_code ?? "—",
      title: mod?.title ?? "Module",
      completed_at: p.completed_at,
      quiz_score: p.quiz_score,
      quiz_total: mod?.is_live_session
        ? 0
        : quizTotalByModule.get(p.module_id) ?? 0,
    };
  });

  const streakHistory = buildStreakHistory(
    (profile.streak_milestones_awarded as number[]) ?? []
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Your progress, XP breakdown, and account settings.
        </p>
      </div>
      <ProfileEditor
        profile={{
          full_name: profile.full_name,
          bio: profile.bio,
          linkedin_url: profile.linkedin_url,
          grad_year: profile.grad_year,
          profile_picture_url: profile.profile_picture_url,
          xp: profile.xp,
          streak_days: profile.streak_days,
          rank: profile.rank,
          earned_badges: (profile.earned_badges as string[]) ?? [],
        }}
        streakHistory={streakHistory}
        xpLines={breakdown.lines}
        completedModules={completedModules}
      />
    </div>
  );
}
