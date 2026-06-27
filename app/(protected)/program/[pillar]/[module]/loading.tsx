function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className ?? ""}`}
      aria-hidden
    />
  );
}

export default function ModuleLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-16">
      <div className="space-y-2">
        <Pulse className="h-4 w-24" />
        <Pulse className="h-8 w-3/4" />
        <Pulse className="h-4 w-32" />
      </div>
      <Pulse className="aspect-video w-full rounded-xl" />
      <div className="space-y-3">
        <Pulse className="h-6 w-32" />
        <Pulse className="h-48 w-full rounded-xl" />
      </div>
      <div className="space-y-3">
        <Pulse className="h-6 w-40" />
        <Pulse className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}
