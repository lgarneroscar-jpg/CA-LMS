import { requireRole } from "@/lib/auth";
import { DiagnosticForm } from "@/components/diagnostic/diagnostic-form";
import { redirect } from "next/navigation";

export default async function DiagnosticPage() {
  const profile = await requireRole(["student"]);

  if (!profile.onboarding_complete && !profile.is_demo) {
    redirect("/onboarding");
  }

  if (profile.diagnostic_complete || profile.is_demo) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-xl px-4 text-center">
        <h1 className="text-2xl font-semibold">Entry diagnostic</h1>
        <p className="text-muted-foreground">
          Help us understand where you are today. Week 1 unlocks when you finish.
        </p>
      </div>
      <DiagnosticForm />
    </div>
  );
}
