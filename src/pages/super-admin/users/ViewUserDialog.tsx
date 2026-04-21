import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Profile } from "@/lib/supabase";

interface ViewUserDialogProps {
  user: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatDate = (s: string) => new Date(s).toLocaleDateString("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function ViewUserDialog({ user, open, onOpenChange }: ViewUserDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Détails de l'utilisateur</DialogTitle>
          <DialogDescription>Informations du compte</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Nom complet</p>
            <p>{user.full_name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Email</p>
            <p>{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Téléphone</p>
            <p>{user.phone ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Adresse</p>
            <p className="break-words">{user.address ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Rôle</p>
            <p>{user.role}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Créé le</p>
            <p>{formatDate(user.created_at)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

