import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Personnel } from "@/types/personnel";

interface PersonnelDeleteActionProps {
  personnel: Personnel;
  onDelete: (id: string) => Promise<{ error: string | null }>;
  onDeleted?: () => void;
}

export function PersonnelDeleteAction({ personnel, onDelete, onDeleted }: PersonnelDeleteActionProps) {
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    const { error: err } = await onDelete(personnel.id);
    setDeleting(false);
    if (err) {
      setError(err);
    } else {
      setOpen(false);
      onDeleted?.();
    }
  };

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} title="Supprimer">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le personnel</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer {personnel.full_name} ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
