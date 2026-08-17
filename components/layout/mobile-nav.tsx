"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const STUDENT_NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/program", label: "Curriculum", icon: GraduationCap },
  { href: "/profile", label: "Profile", icon: Settings },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-[#162033] md:hidden">
      {STUDENT_NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
              active ? "text-indigo-300" : "text-white/55 hover:text-white/80"
            )}
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-lg",
                active && "bg-lift text-lift-foreground shadow-sm shadow-lift/20"
              )}
            >
              <Icon className="size-4" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
