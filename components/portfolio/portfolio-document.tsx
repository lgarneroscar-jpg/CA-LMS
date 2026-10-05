import Link from "next/link";
import type { ReadinessDirection } from "@/lib/capri/scoring";
import {
  PORTFOLIO_COMPLETION_DEFINITION,
  PORTFOLIO_PROGRAM_NAME,
  type PortfolioDocumentData,
} from "@/lib/portfolio";
import { PortfolioAnswer } from "@/components/portfolio/portfolio-answer";
import { PortfolioPrintButton } from "@/components/portfolio/portfolio-print-button";

const DIRECTION_LABEL: Record<ReadinessDirection, string> = {
  improved: "Improved",
  held_steady: "Held steady",
  declined: "Declined",
};

function formatDateOnly(isoDate: string): string {
  return new Date(`${isoDate.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** CSS string literal for @page margin-box content; also neutralises `</style>`. */
function cssString(value: string): string {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/[\r\n\f]+/g, " ")
    .replace(/</g, "\\3C ");
  return `"${escaped}"`;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="break-after-avoid border-b border-lift pb-1 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-lift">
      {children}
    </h2>
  );
}

function IdentityRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 py-0.5">
      <dt className="text-neutral-600">{label}</dt>
      <dd className="text-black">{value}</dd>
    </div>
  );
}

export function PortfolioDocument({ data }: { data: PortfolioDocumentData }) {
  const cohortDates =
    data.cohortStart && data.cohortEnd
      ? `${formatDateOnly(data.cohortStart)} – ${formatDateOnly(data.cohortEnd)}`
      : null;
  const completedOn = formatTimestamp(data.completedAt);
  const { liveSessions } = data;
  const attendanceSources = [
    liveSessions.adminConfirmed > 0
      ? `${liveSessions.adminConfirmed} admin-confirmed`
      : null,
    liveSessions.selfReported > 0 ? `${liveSessions.selfReported} self-reported` : null,
  ].filter(Boolean);
  const attendanceLine =
    liveSessions.total > 0 && liveSessions.attended > 0
      ? `Attended ${liveSessions.attended} of ${liveSessions.total} live sessions${
          attendanceSources.length ? ` (${attendanceSources.join(", ")})` : ""
        }.`
      : null;

  const pageStyle = `
@media print {
  @page {
    @bottom-left {
      content: ${cssString(data.studentName)};
      font: 8pt/1.2 system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
      color: #404040;
      vertical-align: top;
      padding-top: 4mm;
    }
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
      font: 8pt/1.2 system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
      color: #404040;
      vertical-align: top;
      padding-top: 4mm;
    }
  }
}`;

  return (
    <div className="portfolio-document min-h-screen bg-neutral-100 py-8 print:min-h-0 print:bg-white print:py-0">
      <style dangerouslySetInnerHTML={{ __html: pageStyle }} />

      <div
        data-print-hide
        className="mx-auto mb-6 flex max-w-[52rem] flex-wrap items-center justify-between gap-3 px-6 print:hidden"
      >
        <Link
          href="/profile/portfolio"
          className="text-sm font-medium text-neutral-700 underline-offset-4 hover:underline"
        >
          ← Change what&apos;s included
        </Link>
        <div className="flex flex-col items-end gap-1">
          <PortfolioPrintButton />
          <p className="max-w-xs text-right text-xs text-neutral-600">
            Choose &ldquo;Save as PDF&rdquo; as the destination. Chrome or Edge
            give the cleanest result, with your name and page numbers on every page.
          </p>
        </div>
      </div>

      <article className="mx-auto max-w-[52rem] bg-white px-14 py-14 text-black shadow-sm print:max-w-none print:px-0 print:py-0 print:shadow-none">
        <header className="break-inside-avoid space-y-5">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-lift">
            Professional portfolio
          </p>
          <h1 className="text-[2rem] font-semibold leading-tight tracking-tight">
            {data.studentName}
          </h1>
          <dl className="text-[0.9rem]">
            <IdentityRow label="Institution" value={data.institutionName} />
            <IdentityRow label="Program" value={PORTFOLIO_PROGRAM_NAME} />
            <IdentityRow label="Cohort dates" value={cohortDates} />
          </dl>
        </header>

        <section className="mt-10 break-inside-avoid space-y-3">
          <SectionHeading>Completion</SectionHeading>
          <p className="text-[0.95rem] leading-relaxed">
            Completed <strong>{data.modulesCompleted} of {data.modulesTotal}</strong>{" "}
            modules.
          </p>
          <p className="text-[0.85rem] leading-relaxed text-neutral-700">
            {PORTFOLIO_COMPLETION_DEFINITION}
          </p>
          {attendanceLine ? (
            <p className="text-[0.85rem] leading-relaxed text-neutral-700">
              {attendanceLine}
            </p>
          ) : null}
        </section>

        {data.readiness ? (
          <section className="mt-10 break-inside-avoid space-y-3">
            <SectionHeading>Readiness growth</SectionHeading>
            <p className="text-[0.85rem] leading-relaxed text-neutral-700">
              Self-assessed. Each area compares the student&apos;s own rating of their
              readiness at the start of the program (Week 1) with their rating at the
              end (Week 12).
            </p>
            <dl className="text-[0.95rem]">
              {data.readiness.map((line) => (
                <div
                  key={line.pillar}
                  className="grid grid-cols-[1fr_auto] gap-4 border-b border-neutral-200 py-1.5 last:border-b-0"
                >
                  <dt>{line.pillarName}</dt>
                  <dd className="font-semibold">
                    {DIRECTION_LABEL[line.direction]}{" "}
                    <span className="font-normal text-neutral-600">(self-assessed)</span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <section className="mt-10 space-y-8">
          <SectionHeading>Selected work</SectionHeading>
          {data.selectedWork.map((pillar) => {
            const exercises = pillar.modules.flatMap((module) =>
              module.exercises.map((exercise) => ({ module, exercise }))
            );
            return (
              <div key={pillar.pillar} className="space-y-7">
                {exercises.map(({ module, exercise }, index) => (
                  <div
                    key={exercise.answerId}
                    className="portfolio-exercise break-inside-avoid space-y-3"
                  >
                    {index === 0 ? (
                      <h3 className="break-after-avoid pt-2 text-[1.05rem] font-semibold text-black">
                        {pillar.pillarLabel}
                      </h3>
                    ) : null}
                    <div className="space-y-1">
                      <h4 className="break-after-avoid text-[1.15rem] font-semibold leading-snug text-black">
                        {exercise.title}
                      </h4>
                      <p className="break-after-avoid text-[0.8rem] text-neutral-600">
                        {module.moduleTitle}
                      </p>
                    </div>
                    <PortfolioAnswer
                      inputType={exercise.inputType}
                      exerciseKey={exercise.exerciseKey}
                      fields={exercise.fields}
                      answer={exercise.answer}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </section>

        <footer className="mt-12 break-inside-avoid border-t border-neutral-300 pt-4 text-[0.8rem] leading-relaxed text-neutral-700">
          Issued by Corporate Academy. Program completed {completedOn}.
        </footer>
      </article>
    </div>
  );
}
