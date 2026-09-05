"use client";

import { useState, useTransition } from "react";
import {
  confirmGenerateReport,
  previewReportGeneration,
} from "@/app/actions/generate-report";
import type { PendingReportPreview } from "@/lib/reports";
import { Button } from "@/components/ui/button";

export function GenerateReportButton({
  institutionId,
}: {
  institutionId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<PendingReportPreview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function loadPreview() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const next = await previewReportGeneration(institutionId);
        setPreview(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Preview failed");
      }
    });
  }

  function confirm() {
    if (!preview?.period) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await confirmGenerateReport(institutionId, {
          regenerate: preview.alreadyExists,
          periodIndex: preview.period?.periodIndex,
        });
        if (result.status === "error") {
          setError(result.error);
          return;
        }
        if (result.status === "skipped") {
          setMessage(result.reason);
          return;
        }
        setMessage(
          result.status === "updated"
            ? `Regenerated report for ${result.period.periodStart} → ${result.period.periodEnd}.`
            : result.status === "already_exists"
              ? `Report already exists for ${result.period.periodStart} → ${result.period.periodEnd}.`
              : `Created report for ${result.period.periodStart} → ${result.period.periodEnd}.`
        );
        setPreview(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Generation failed");
      }
    });
  }

  return (
    <div className="space-y-3 rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" disabled={pending} onClick={loadPreview}>
          {pending && !preview ? "Checking…" : "Generate report"}
        </Button>
        {preview?.period ? (
          <Button type="button" disabled={pending} onClick={confirm}>
            {preview.alreadyExists ? "Confirm regenerate" : "Confirm generate"}
          </Button>
        ) : null}
      </div>
      {preview ? (
        <p className="text-sm text-muted-foreground">{preview.message}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Opens a confirmation with the cadence-derived period before writing a
          snapshot. Dashboard loads never create reports.
        </p>
      )}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
