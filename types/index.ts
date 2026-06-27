import type { Tables } from "./database";

export type UserRole = "super_admin" | "institutional_admin" | "student";

export type Profile = Tables<"profiles">;

export type Institution = Tables<"institutions">;

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  institutional_admin: "Institutional Admin",
  student: "Student",
};
