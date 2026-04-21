import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Personnel } from "@/types/personnel";
import { Badge } from "@/components/ui/badge";

interface PersonnelDisplayDialogProps {
  personnel: Personnel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatDate = (s: string) => new Date(s).toLocaleDateString("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function PersonnelDisplayDialog({
  personnel,
  open,
  onOpenChange,
}: PersonnelDisplayDialogProps) {
  if (!personnel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aperçu</DialogTitle>
          <DialogDescription>Détails du membre du personnel</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <span className="font-medium text-muted-foreground">Nom</span>
            <p className="mt-1">{personnel.full_name}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Email</span>
            <p className="mt-1">{personnel.email}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Tél</span>
            <p className="mt-1">{personnel.phone ?? "—"}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Position</span>
            <p className="mt-1">{personnel.position ?? "—"}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Statut</span>
            <p className="mt-1">
              {(personnel.is_suspended ?? false) ? (
                <Badge variant="destructive">Suspendu</Badge>
              ) : (
                <Badge variant="secondary">Actif</Badge>
              )}
            </p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Créé le</span>
            <p className="mt-1">{formatDate(personnel.created_at)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
