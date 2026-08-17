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
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="space-y-2">
        <Pulse className="h-4 w-32" />
        <Pulse className="h-10 w-48" />
        <Pulse className="h-4 w-64" />
      </div>
      {[1, 2, 3].map((pillar) => (
        <div key={pillar} className="space-y-4">
          <Pulse className="h-8 w-64" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((row) => (
              <Pulse key={row} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
