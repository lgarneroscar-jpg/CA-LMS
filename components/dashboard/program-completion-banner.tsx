import Link from "next/link";

export function ProgramCompletionBanner({ studentId }: { studentId: string }) {
  return (
    <div className="lift-framework rounded-3xl border border-lift/20 bg-card p-6 shadow-md shadow-lift/5">
      <p className="text-xs font-bold uppercase tracking-widest text-lift">
        Certified
      </p>
      <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight">
        Corporate Academy Certified
      </h2>
      <p className="mt-2 lift-body text-muted-foreground">
        You completed all 14 modules. Share your certificate.
      </p>
      <Link
        href={`/certificate/${studentId}`}
        className="lift-btn mt-4 inline-flex items-center"
      >
        View certificate
      </Link>
    </div>
  );
}
