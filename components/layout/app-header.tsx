import { BRAND } from "@/lib/constants";
import { ROLE_LABELS, type Profile } from "@/types/index";
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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#162033] px-4 text-white md:h-16 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-lift text-xs font-bold text-lift-foreground shadow-sm shadow-lift/20">
          CA
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-none">
            {BRAND.productName}
          </p>
          <p className="mt-0.5 hidden truncate text-xs text-white/60 sm:block">
            {BRAND.tagline}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <NotificationBellWrapper
          userId={profile.id}
          role={profile.role}
          initialNotifications={notifications}
          unreadCount={unreadCount}
        />
        <span className="hidden rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 sm:inline-flex">
          {isDemo ? "Demo Preview" : ROLE_LABELS[role]}
        </span>
        <span className="hidden max-w-[140px] truncate text-sm text-white/90 sm:inline">
          {profile.full_name ?? "User"}
        </span>
        <SignOutButton />
      </div>
    </header>
  );
}
