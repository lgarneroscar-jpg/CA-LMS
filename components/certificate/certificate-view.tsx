"use client";

import { BRAND } from "@/lib/constants";

type CertificateViewProps = {
  studentName: string;
  institutionName: string;
  completedAt: string;
};

export function CertificateView({
  studentName,
  institutionName,
  completedAt,
}: CertificateViewProps) {
  const date = new Date(completedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-muted/30 p-4 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex justify-end gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Print / Save PDF
          </button>
        </div>
        <div className="border-4 border-primary bg-white p-8 text-center shadow-lg print:shadow-none md:p-16">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            {BRAND.productName}
          </p>
          <h1 className="mt-6 font-serif text-3xl font-semibold md:text-4xl">
            Certificate of Completion
          </h1>
          <p className="mt-8 text-muted-foreground">This certifies that</p>
          <p className="mt-2 text-2xl font-semibold text-primary md:text-3xl">
            {studentName}
          </p>
          <p className="mt-8 max-w-xl mx-auto leading-relaxed text-muted-foreground">
            has successfully completed the Corporate Academy curriculum at{" "}
            <strong>{institutionName}</strong>, demonstrating readiness in
            pre-professional identity, communication, and opportunity strategy.
          </p>
          <p className="mt-10 text-lg font-semibold text-accent">
            Corporate Academy Certified
          </p>
          <p className="mt-8 text-sm text-muted-foreground">Completed {date}</p>
        </div>
      </div>
    </div>
  );
}
