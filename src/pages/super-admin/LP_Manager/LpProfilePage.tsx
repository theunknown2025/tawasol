import { User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function LpProfilePage() {
  const { profile } = useAuth();

  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profil</h1>
          <p className="text-sm text-muted-foreground">
            Informations liées à votre compte pour l’espace Remess.
          </p>
        </div>
      </div>

      <div className="max-w-lg rounded-2xl border border-border bg-card p-6 shadow-sm">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">E-mail</dt>
            <dd className="font-medium text-foreground">{profile?.email ?? "—"}</dd>
          </div>
          {profile?.full_name && (
            <div>
              <dt className="text-muted-foreground">Nom</dt>
              <dd className="font-medium text-foreground">{profile.full_name}</dd>
            </div>
          )}
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Pour modifier le profil détaillé (photo, coordonnées, etc.), ouvrez la page profil du
          portail.
        </p>
        <Button asChild variant="secondary" className="mt-6">
          <Link to="/admin/profil">Ouvrir mon profil</Link>
        </Button>
      </div>
    </div>
  );
}
