import { NotificationBell } from "@/components/notifications/notification-bell";
import type { NotificationItem } from "@/components/notifications/notification-bell";

type NotificationBellWrapperProps = {
  userId: string;
  role: string;
  initialNotifications: NotificationItem[];
  unreadCount: number;
};

export function NotificationBellWrapper({
  role,
  initialNotifications,
  unreadCount,
}: NotificationBellWrapperProps) {
  if (role !== "student") return null;

  return (
    <NotificationBell
      notifications={initialNotifications}
      unreadCount={unreadCount}
    />
  );
}
