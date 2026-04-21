import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardPath, isAdminRole, isMemberRole } from "@/lib/supabase";

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) return null;
  if (!profile) return <>{children}</>;

  const role = profile.role;
  const isAdminArea = pathname.startsWith("/admin");
  const isMemberArea = pathname.startsWith("/member");

  if (isAdminArea && isMemberRole(role)) {
    return <Navigate to="/member/dashboard" replace />;
  }
  if (isMemberArea && isAdminRole(role)) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  return <>{children}</>;
}
