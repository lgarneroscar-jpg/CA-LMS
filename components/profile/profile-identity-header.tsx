type ProfileIdentityHeaderProps = {
  fullName: string | null;
  institutionName: string | null;
  profilePictureUrl: string | null;
  bio?: string | null;
  eyebrow?: string;
};

export function ProfileIdentityHeader({
  fullName,
  institutionName,
  profilePictureUrl,
  bio,
  eyebrow = "Profile",
}: ProfileIdentityHeaderProps) {
  const displayName = fullName?.trim() || "Student";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="lift-framework space-y-5 rounded-3xl p-7 md:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {profilePictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profilePictureUrl}
            alt={displayName}
            className="size-20 shrink-0 rounded-full border border-lift/20 object-cover shadow-sm"
          />
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-lift text-2xl font-bold text-lift-foreground shadow-sm shadow-lift/20">
            {initial}
          </div>
        )}
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-lift">
            {eyebrow}
          </p>
          {institutionName ? (
            <span className="lift-chip inline-flex">{institutionName}</span>
          ) : null}
          <h1 className="break-words font-serif text-3xl font-semibold tracking-tight md:text-[2.4rem] md:leading-tight">
            {displayName}
          </h1>
          {bio ? (
            <p className="break-words text-sm leading-relaxed text-muted-foreground">
              {bio}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
