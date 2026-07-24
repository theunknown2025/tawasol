import { Check, Loader2, UserCheck, UserX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Profile } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface UserSuspendActionProps {
  user: Profile;
  disabled?: boolean;
  onRequest: () => void;
}

/** Trigger icon to start suspend / reactivate confirmation. */
export function UserSuspendAction({ user, disabled, onRequest }: UserSuspendActionProps) {
  const isActive = user.is_active !== false;
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={isActive ? "Suspendre le compte" : "Réactiver le compte"}
      aria-label={isActive ? "Suspendre le compte" : "Réactiver le compte"}
      className={
        isActive
          ? "text-amber-600 hover:text-amber-700"
          : "text-emerald-600 hover:text-emerald-700"
      }
      disabled={disabled}
      onClick={onRequest}
    >
      {isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
    </Button>
  );
}

interface UserSuspendConfirmRowProps {
  user: Profile;
  colSpan: number;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Full yellow (or green for reactivate) confirmation row. */
export function UserSuspendConfirmRow({
  user,
  colSpan,
  loading,
  onConfirm,
  onCancel,
}: UserSuspendConfirmRowProps) {
  const isActive = user.is_active !== false;
  const name = user.full_name?.trim() || user.email;

  return (
    <TableRow
      className={cn(
        isActive
          ? "border-amber-200 bg-amber-100 hover:bg-amber-100"
          : "border-emerald-200 bg-emerald-100 hover:bg-emerald-100"
      )}
    >
      <TableCell colSpan={colSpan} className="py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            className={cn(
              "text-sm font-medium",
              isActive ? "text-amber-950" : "text-emerald-950"
            )}
          >
            {isActive
              ? `Suspendre le compte de « ${name} » ? L'accès à la plateforme sera désactivé.`
              : `Réactiver le compte de « ${name} » ? L'utilisateur pourra à nouveau se connecter.`}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-800"
              title="Oui"
              aria-label="Confirmer"
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
