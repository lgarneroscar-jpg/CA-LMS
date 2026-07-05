import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ProfileIdentityHeaderProps = {
  fullName: string | null;
  institutionName: string | null;
  profilePictureUrl: string | null;
  bio?: string | null;
};

export function ProfileIdentityHeader({
  fullName,
  institutionName,
  profilePictureUrl,
  bio,
}: ProfileIdentityHeaderProps) {
  const displayName = fullName?.trim() || "Student";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>{displayName}</CardTitle>
        {institutionName ? (
          <CardDescription>{institutionName}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {profilePictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profilePictureUrl}
            alt={displayName}
            className="size-20 rounded-full border object-cover"
          />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-full border bg-muted text-2xl font-semibold text-muted-foreground">
            {initial}
          </div>
        )}
        {bio ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{bio}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
