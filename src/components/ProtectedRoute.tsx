import { useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardPath, type UserRole } from "@/lib/supabase";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/** Déconnecte puis envoie vers /auth pour éviter une boucle de redirection. */
function SignOutDeactivatedAccount() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    void signOut().then(() => {
      if (!cancelled) {
        navigate("/auth", { replace: true, state: { deactivated: true } });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [signOut, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="animate-pulse text-muted-foreground">Déconnexion du compte désactivé…</p>
    </div>
  );
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (profile && profile.is_active === false) {
    return <SignOutDeactivatedAccount />;
  }

  const role = profile?.role;

  if (allowedRoles?.length) {
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to={getDashboardPath(role)} replace />;
    }
  }

  return <>{children}</>;
}
