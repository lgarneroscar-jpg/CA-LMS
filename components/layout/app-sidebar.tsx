"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Building2,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgramNavTree } from "@/components/layout/program-nav-tree";
import type { ProgramNavPillar } from "@/lib/program-nav";
import type { UserRole } from "@/types/index";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function getNavItems(
  role: UserRole,
  institutionId: string | null,
  isDemo: boolean
): NavItem[] {
  switch (role) {
    case "super_admin":
      return [
        { href: "/superadmin", label: "Overview", icon: LayoutDashboard },
        {
          href: "/superadmin/content",
          label: "Content",
          icon: GraduationCap,
        },
        { href: "/superadmin/institutions", label: "Institutions", icon: Building2 },
        { href: "/superadmin/users", label: "Users", icon: Users },
      ];
    case "institutional_admin":
      if (!institutionId) return [];
      return [
        {
          href: `/admin/${institutionId}/dashboard`,
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          href: `/admin/${institutionId}/students`,
          label: "Students",
          icon: Users,
        },
      ];
    case "student": {
      const studentItems: NavItem[] = [
        { href: "/dashboard", label: "Home", icon: LayoutDashboard },
        { href: "/program", label: "Program", icon: GraduationCap },
        { href: "/profile", label: "Profile", icon: Settings },
      ];

      if (isDemo && institutionId) {
        const demoAdminItems: NavItem[] = [
          {
            href: `/admin/${institutionId}/dashboard`,
            label: "Admin Dashboard",
            icon: LayoutDashboard,
          },
          {
            href: `/admin/${institutionId}/students`,
            label: "Roster",
            icon: Users,
          },
        ];
        return [...demoAdminItems, ...studentItems];
      }

      return studentItems;
    }
    default:
      return [];
  }
}

type AppSidebarProps = {
  role: UserRole;
  institutionId: string | null;
  isDemo: boolean;
  programNav?: ProgramNavPillar[];
};

export function AppSidebar({
  role,
  institutionId,
  isDemo,
  programNav,
}: AppSidebarProps) {
  const pathname = usePathname();
  const items = getNavItems(role, institutionId, isDemo);
  const showProgramTree = role === "student" && programNav && programNav.length > 0;

  return (
    <aside className="hidden w-56 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
              {showProgramTree && item.href === "/profile" ? (
                <ProgramNavTree pillars={programNav} />
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
