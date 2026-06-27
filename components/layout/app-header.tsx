import { BRAND } from "@/lib/constants";
import { ROLE_LABELS, type Profile } from "@/types/index";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { NotificationBellWrapper } from "@/components/notifications/notification-bell-wrapper";
import type { NotificationItem } from "@/components/notifications/notification-bell";

type AppHeaderProps = {
  profile: Profile;
  notifications?: NotificationItem[];
  unreadCount?: number;
};

export function AppHeader({
  profile,
  notifications = [],
  unreadCount = 0,
}: AppHeaderProps) {
  const role = profile.role as keyof typeof ROLE_LABELS;
  const isDemo = profile.is_demo;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-primary px-4 text-primary-foreground md:px-6">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-md bg-accent font-bold text-accent-foreground">
          CA
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">{BRAND.productName}</p>
          <p className="hidden text-xs text-primary-foreground/70 sm:block">
            {BRAND.tagline}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationBellWrapper
          userId={profile.id}
          role={profile.role}
          initialNotifications={notifications}
          unreadCount={unreadCount}
        />
        {isDemo ? (
          <Badge
            variant="secondary"
            className="hidden border-accent/30 bg-accent/20 text-primary-foreground sm:inline-flex"
          >
            Demo Preview
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="hidden border-accent/30 bg-accent/20 text-primary-foreground sm:inline-flex"
          >
            {ROLE_LABELS[role]}
          </Badge>
        )}
        <span className="hidden max-w-[120px] truncate text-sm sm:inline md:max-w-none">
          {profile.full_name ?? "User"}
        </span>
        <SignOutButton />
      </div>
    </header>
  );
}
