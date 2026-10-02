"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createInstitution,
  updateInstitution,
} from "@/app/actions/institutions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const REPORTING_CADENCES = ["2weeks", "4weeks", "6weeks"] as const;

export type InstitutionFormValues = {
  name: string;
  cohort_start_date: string;
  reporting_cadence: string;
  drip_type: string;
  is_pilot: boolean;
  logo_url: string;
  primary_color: string;
  notes: string;
};

const EMPTY: InstitutionFormValues = {
  name: "",
  cohort_start_date: "",
  reporting_cadence: "4weeks",
  drip_type: "weekly",
  is_pilot: true,
  logo_url: "",
  primary_color: "",
  notes: "",
};

export function InstitutionForm({
  mode,
  institutionId,
  initial,
  existingReportCount = 0,
}: {
  mode: "create" | "edit";
  institutionId?: string;
  initial?: Partial<InstitutionFormValues>;
  existingReportCount?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<InstitutionFormValues>({
    ...EMPTY,
    ...initial,
  });
  const [error, setError] = useState<string | null>(null);
  const [cohortConfirmNeeded, setCohortConfirmNeeded] = useState(false);
  const [reportCountHint, setReportCountHint] = useState(existingReportCount);

  function onChange<K extends keyof InstitutionFormValues>(
    key: K,
    value: InstitutionFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === "cohort_start_date") {
      setCohortConfirmNeeded(false);
    }
  }

  function submit(confirmCohortChange = false) {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", values.name);
      formData.set("cohort_start_date", values.cohort_start_date);
      formData.set("reporting_cadence", values.reporting_cadence);
      formData.set("drip_type", values.drip_type);
      formData.set("is_pilot", values.is_pilot ? "true" : "false");
      formData.set("logo_url", values.logo_url);
      formData.set("primary_color", values.primary_color);
      formData.set("notes", values.notes);
      if (confirmCohortChange) {
        formData.set("confirm_cohort_start_change", "true");
      }

      try {
        if (mode === "create") {
          const { id } = await createInstitution(formData);
          router.push(`/superadmin/institutions/${id}`);
          router.refresh();
          return;
        }
        if (!institutionId) throw new Error("Missing institution id");
        await updateInstitution(institutionId, formData);
        setCohortConfirmNeeded(false);
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Save failed";
        if (message.startsWith("COHORT_START_NEEDS_CONFIRM:")) {
          const parts = message.split(":");
          const count = Number(parts[1]) || existingReportCount;
          setReportCountHint(count);
          setCohortConfirmNeeded(true);
          setError(
            `Changing cohort start date moves every future report period. This institution already has ${count} report ${count === 1 ? "snapshot" : "snapshots"}. Confirm to proceed.`
          );
          return;
        }
        setError(message);
      }
    });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            required
            value={values.name}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cohort_start_date">Cohort start date</Label>
          <Input
            id="cohort_start_date"
            type="date"
            value={values.cohort_start_date}
            onChange={(e) => onChange("cohort_start_date", e.target.value)}
          />
          {mode === "edit" && existingReportCount > 0 ? (
            <p className="text-xs text-muted-foreground">
              This institution has {existingReportCount} report{" "}
              {existingReportCount === 1 ? "snapshot" : "snapshots"}.
              Changing the start date moves every future report period.
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reporting_cadence">Reporting cadence</Label>
          <select
            id="reporting_cadence"
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={values.reporting_cadence}
            onChange={(e) => onChange("reporting_cadence", e.target.value)}
          >
            {REPORTING_CADENCES.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="drip_type">Drip type</Label>
          <select
            id="drip_type"
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={values.drip_type}
            onChange={(e) => onChange("drip_type", e.target.value)}
          >
            <option value="weekly">weekly</option>
            <option value="async">async</option>
          </select>
        </div>

        <div className="flex items-center gap-2 pt-6">
          <input
            id="is_pilot"
            type="checkbox"
            checked={values.is_pilot}
            onChange={(e) => onChange("is_pilot", e.target.checked)}
          />
          <Label htmlFor="is_pilot">Pilot institution</Label>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="logo_url">Logo URL (optional)</Label>
          <Input
            id="logo_url"
            value={values.logo_url}
            onChange={(e) => onChange("logo_url", e.target.value)}
            placeholder="https://"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="primary_color">Primary color (optional)</Label>
          <Input
            id="primary_color"
            value={values.primary_color}
            onChange={(e) => onChange("primary_color", e.target.value)}
            placeholder="#0F172A"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={values.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create institution"
              : "Save changes"}
        </Button>
        {cohortConfirmNeeded ? (
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => submit(true)}
          >
            Confirm cohort start change ({reportCountHint}{" "}
            {reportCountHint === 1 ? "report" : "reports"})
          </Button>
        ) : null}
      </div>
    </form>
  );
}
