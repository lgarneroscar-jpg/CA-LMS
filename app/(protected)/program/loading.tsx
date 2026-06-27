function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className ?? ""}`}
      aria-hidden
    />
  );
}

export default function ProgramLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Pulse className="h-8 w-40" />
        <Pulse className="h-4 w-64" />
      </div>
      {[1, 2, 3].map((pillar) => (
        <div key={pillar} className="rounded-xl border bg-card p-6 space-y-4">
          <Pulse className="h-6 w-48" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((row) => (
              <Pulse key={row} className="h-10 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
