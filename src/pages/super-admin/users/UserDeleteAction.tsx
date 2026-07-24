import { Check, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Profile } from "@/lib/supabase";

interface UserDeleteActionProps {
  disabled?: boolean;
  onRequest: () => void;
}

/** Trigger icon to start delete confirmation. */
export function UserDeleteAction({ disabled, onRequest }: UserDeleteActionProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title="Supprimer le compte"
      aria-label="Supprimer le compte"
      className="text-destructive hover:text-destructive"
      disabled={disabled}
      onClick={onRequest}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

interface UserDeleteConfirmRowProps {
  user: Profile;
  colSpan: number;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Full red confirmation row. */
export function UserDeleteConfirmRow({
  user,
  colSpan,
  loading,
  onConfirm,
  onCancel,
}: UserDeleteConfirmRowProps) {
  const name = user.full_name?.trim() || user.email;

  return (
    <TableRow className="border-red-200 bg-red-100 hover:bg-red-100">
      <TableCell colSpan={colSpan} className="py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-red-950">
            Supprimer définitivement le compte de « {name} » ? Cette action est irréversible.
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-red-700 hover:bg-red-500/20 hover:text-red-800"
              title="Oui"
              aria-label="Confirmer la suppression"
              disabled={loading}
              onClick={onConfirm}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:bg-background/60 hover:text-foreground"
              title="Non"
              aria-label="Annuler"
              disabled={loading}
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
