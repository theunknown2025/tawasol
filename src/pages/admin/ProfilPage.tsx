import { User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/supabase";
import AdminProfilePage from "./AdminProfile/AdminProfilePage";

export default function ProfilPage() {
  const { profile } = useAuth();

  if (profile?.role === ROLES.ADMIN) {
    return <AdminProfilePage />;
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2">
          <User className="text-primary" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Profil</h1>
      </div>
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-muted-foreground">
          Gérez votre profil et vos paramètres ici. La fiche organisation détaillée est réservée aux comptes
          « Admin ».
        </p>
        {profile && (
          <dl className="mt-6 grid max-w-md gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Nom</dt>
              <dd>{profile.full_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{profile.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Rôle</dt>
              <dd className="capitalize">{profile.role.replace("_", " ")}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
