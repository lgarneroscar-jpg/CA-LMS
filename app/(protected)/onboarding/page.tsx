import { requireRole } from "@/lib/auth";
import { OnboardingWalkthrough } from "@/components/onboarding/onboarding-walkthrough";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const profile = await requireRole(["student"]);

  if (profile.onboarding_complete || profile.is_demo) {
    redirect(profile.diagnostic_complete ? "/dashboard" : "/diagnostic");
  }

  return <OnboardingWalkthrough />;
}
