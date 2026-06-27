import type { UserRole } from "@/types/index";

export function getHomePathForRole(
  role: UserRole,
  institutionId: string | null
): string {
  switch (role) {
    case "super_admin":
      return "/superadmin";
    case "institutional_admin":
      if (!institutionId) return "/login?error=missing_institution";
      return `/admin/${institutionId}/dashboard`;
    case "student":
      return "/dashboard";
    default:
      return "/login";
  }
}
