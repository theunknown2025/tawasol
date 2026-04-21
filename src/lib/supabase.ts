import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").toString().trim().replace(/\/$/, "") || "";
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "")
    .toString()
    .trim() || "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase config. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local in the project root, then restart the dev server (npm run dev)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type UserRole = "super_admin" | "admin" | "member";

export const ROLES = {
  SUPER_ADMIN: "super_admin" as const,
  ADMIN: "admin" as const,
  MEMBER: "member" as const,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  member: "Membre",
};

export function isAdminRole(role: UserRole | undefined): boolean {
  return role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
}

export function isMemberRole(role: UserRole | undefined): boolean {
  return role === ROLES.MEMBER;
}

export function getDashboardPath(role: UserRole | undefined): string {
  if (isMemberRole(role)) return "/member/dashboard";
  if (role === ROLES.SUPER_ADMIN) return "/admin/portail";
  return "/admin/dashboard";
}

export const VALID_ROLES: UserRole[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MEMBER];

export function isValidRole(value: unknown): value is UserRole {
  return typeof value === "string" && VALID_ROLES.includes(value as UserRole);
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
  /** Compte actif (désactivation par super admin) */
  is_active?: boolean;
}
