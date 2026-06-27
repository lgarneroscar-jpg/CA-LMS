import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ProgramCompletionBanner({ studentId }: { studentId: string }) {
  return (
    <Card className="border-accent/40 bg-accent/5">
      <CardHeader>
        <CardTitle>Corporate Academy Certified</CardTitle>
        <CardDescription>
          You completed all modules and live sessions. Share your certificate!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href={`/certificate/${studentId}`}
          className="inline-flex h-8 items-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          View certificate
        </Link>
      </CardContent>
    </Card>
  );
}
