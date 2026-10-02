import { BRAND } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function NoCohortNotice({ email }: { email: string | null }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col py-10 md:py-16">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">
            You&apos;re not assigned to a cohort yet
          </CardTitle>
          <CardDescription className="text-base">
            Your account is active, but it isn&apos;t linked to a program cohort,
            so there are no modules or assessments to show you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Please contact your program administrator and ask them to add you to
            your cohort in {BRAND.productName}. Once they do, sign out and back in
            and your program will appear here.
          </p>
          {email ? (
            <p className="text-muted-foreground">
              Give them the email you signed in with:{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          ) : null}
          <p className="text-muted-foreground">
            Nothing is wrong with your account, and nothing you&apos;ve done has
            been lost.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
