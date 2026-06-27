"use client";

import { useTransition } from "react";
import { Bell } from "lucide-react";
import { markNotificationAsRead } from "@/app/actions/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type NotificationItem = {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type NotificationBellProps = {
  notifications: NotificationItem[];
  unreadCount: number;
};

export function NotificationBell({
  notifications,
  unreadCount,
}: NotificationBellProps) {
  const [pending, startTransition] = useTransition();

  function handleRead(id: string) {
    startTransition(async () => {
      await markNotificationAsRead(id);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative inline-flex size-8 items-center justify-center rounded-lg text-primary-foreground hover:bg-primary-foreground/10"
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {unreadCount > 0 ? (
          <Badge className="absolute -right-1 -top-1 size-5 justify-center rounded-full p-0 text-[10px]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          notifications.slice(0, 8).map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex cursor-pointer flex-col items-start gap-1 py-2"
              onClick={() => !n.is_read && handleRead(n.id)}
              disabled={pending}
            >
              <span
                className={
                  n.is_read ? "text-sm" : "text-sm font-medium text-foreground"
                }
              >
                {n.message}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {n.type.replace(/_/g, " ")}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
