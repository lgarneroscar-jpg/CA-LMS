"use client";

export function PortfolioPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-lift px-4 py-2 text-sm font-medium text-lift-foreground hover:bg-lift-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lift"
    >
      Print / Save as PDF
    </button>
  );
}
