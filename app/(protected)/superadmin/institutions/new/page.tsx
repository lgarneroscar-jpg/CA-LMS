import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { InstitutionForm } from "@/components/superadmin/institution-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewInstitutionPage() {
  await requireRole(["super_admin"]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create institution
          </h1>
          <p className="text-muted-foreground">
            Super admin only. Institutions do not log in — push reporting is the
            v1 delivery model.
          </p>
        </div>
        <Link
          href="/superadmin/institutions"
          className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Institution details</CardTitle>
          <CardDescription>
            Cohort start date drives drip unlocking, pace, and report period
            boundaries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InstitutionForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
