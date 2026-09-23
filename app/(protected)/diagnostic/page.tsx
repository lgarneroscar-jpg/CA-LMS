import { redirect } from "next/navigation";

/**
 * The invented 7-question entry diagnostic is retired. CAPRI is the real
 * readiness instrument and now owns the Week 1 baseline.
 *
 * Kept as a redirect because onboarding links, notifications, and bookmarks in
 * the wild still point here.
 */
export default async function DiagnosticPage() {
  redirect("/capri/baseline");
}
