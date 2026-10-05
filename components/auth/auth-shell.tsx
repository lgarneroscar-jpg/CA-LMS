import { LOGIN_HELP_MAILTO, SUPPORT_EMAIL } from "@/lib/constants";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="experience-lift lift-body flex min-h-dvh flex-col items-center justify-center bg-lift-muted/40 px-4 py-10 sm:py-16">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-sm font-medium tracking-wide text-muted-foreground">
          Corporate Academy Career Readiness Program
        </p>
        <div className="lift-card p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

export function AuthHeading({
  title,
  description,
}: {
  title: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="mb-6 space-y-2">
      <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <div className="text-base text-muted-foreground">{description}</div>
      ) : null}
    </div>
  );
}

export function SupportLink() {
  return (
    <a
      href={LOGIN_HELP_MAILTO}
      className="font-medium text-foreground underline underline-offset-2"
    >
      {SUPPORT_EMAIL}
    </a>
  );
}
