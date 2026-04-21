import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/supabase";
import AdminPmoPage from "./AdminPmoPage";
import PMOPage from "@/pages/super-admin/PMOPage";

/** Super admin: pilotage (liste projets + lecture). Admin org: suivi opérationnel (commentaires + documents). */
export default function ProjetsPmoRoute() {
  const { profile } = useAuth();
  if (profile?.role === ROLES.SUPER_ADMIN) {
    return <PMOPage />;
  }
  return <AdminPmoPage />;
}
