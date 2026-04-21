import * as React from "react";
import { UserX, UserCheck } from "lucide-react";
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

interface PersonnelSuspendActionProps {
  personnel: Personnel;
  onSuspend: (id: string, suspended: boolean) => Promise<{ error: string | null }>;
  onSuspended?: () => void;
}

export function PersonnelSuspendAction({
  personnel,
  onSuspend,
  onSuspended,
}: PersonnelSuspendActionProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isSuspended = personnel.is_suspended ?? false;
  const actionLabel = isSuspended ? "Réactiver" : "Suspendre";
  const confirmLabel = isSuspended ? "Réactiver le membre" : "Suspendre le membre";
  const confirmDescription = isSuspended
    ? `Réactiver ${personnel.full_name} ? Il pourra à nouveau accéder aux ressources.`
    : `Suspendre ${personnel.full_name} ? Il n'aura plus accès aux ressources.`;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    const { error: err } = await onSuspend(personnel.id, !isSuspended);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setOpen(false);
      onSuspended?.();
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        title={actionLabel}
        className={isSuspended ? "text-green-600 hover:text-green-700" : "text-amber-600 hover:text-amber-700"}
      >
        {isSuspended ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmLabel}</DialogTitle>
            <DialogDescription>{confirmDescription}</DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? "En cours…" : actionLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
