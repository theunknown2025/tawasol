import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS, type Profile } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ViewUserDialog } from "./ViewUserDialog";
import { EditUserDialog } from "./EditUserDialog";
import { UserSuspendAction, UserSuspendConfirmRow } from "./UserSuspendAction";
import { UserDeleteAction, UserDeleteConfirmRow } from "./UserDeleteAction";

const formatDate = (s: string) => new Date(s).toLocaleDateString("fr-FR");
const COL_COUNT = 7;

type PendingAction = { type: "suspend" | "delete"; user: Profile };

export function ListeUtilisateursTab() {
  const { user: currentUser } = useAuth();
  const {
    profiles,
    loading,
    updateUser,
    suspendUser,
    suspendUserLoading,
    deleteUser,
    deleteUserLoading,
  } = useUsers();
  const [viewUser, setViewUser] = useState<Profile | null>(null);
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const actionBusy = suspendUserLoading || deleteUserLoading;

  const handleConfirmSuspend = async () => {
    if (!pending || pending.type !== "suspend") return;
    const target = pending.user;
    if (currentUser?.id === target.user_id && target.is_active !== false) {
      toast.error("Vous ne pouvez pas suspendre votre propre compte");
      setPending(null);
      return;
    }
    try {
      const nextActive = target.is_active === false;
      await suspendUser({ user_id: target.user_id, is_active: nextActive });
      toast.success(nextActive ? "Compte réactivé" : "Compte suspendu");
      setPending(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suspension");
    }
  };

  const handleConfirmDelete = async () => {
    if (!pending || pending.type !== "delete") return;
    const target = pending.user;
    if (currentUser?.id === target.user_id) {
      toast.error("Vous ne pouvez pas supprimer votre propre compte");
      setPending(null);
      return;
    }
    try {
      await deleteUser(target.user_id);
      toast.success("Compte supprimé");
      setPending(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des utilisateurs</CardTitle>
        <CardDescription>
          Utilisateurs créés dans la plateforme (Super Admin, Admin, Membre)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Chargement...</p>
        ) : profiles.length === 0 ? (
          <p className="text-muted-foreground">Aucun utilisateur pour le moment.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tél</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="w-[160px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((p) => {
                const isPendingRow = pending?.user.user_id === p.user_id;
                const isSuspended = p.is_active === false;

                if (isPendingRow && pending.type === "suspend") {
                  return (
                    <UserSuspendConfirmRow
                      key={p.user_id}
                      user={p}
                      colSpan={COL_COUNT}
                      loading={suspendUserLoading}
                      onConfirm={() => void handleConfirmSuspend()}
                      onCancel={() => setPending(null)}
                    />
                  );
                }

                if (isPendingRow && pending.type === "delete") {
                  return (
                    <UserDeleteConfirmRow
                      key={p.user_id}
                      user={p}
                      colSpan={COL_COUNT}
                      loading={deleteUserLoading}
                      onConfirm={() => void handleConfirmDelete()}
                      onCancel={() => setPending(null)}
                    />
                  );
                }

                return (
                  <TableRow
                    key={p.user_id}
                    className={cn(isSuspended && "opacity-75")}
                  >
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{p.full_name ?? "—"}</span>
                        {isSuspended && (
                          <Badge variant="destructive" className="shrink-0">
                            Suspendu
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell>{p.phone ?? "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{p.address ?? "—"}</TableCell>
                    <TableCell>{ROLE_LABELS[p.role]}</TableCell>
                    <TableCell>{formatDate(p.created_at)}</TableCell>
                    <TableCell className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Afficher"
                        disabled={!!pending || actionBusy}
                        onClick={() => setViewUser(p)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Modifier"
                        disabled={!!pending || actionBusy}
                        onClick={() => setEditUser(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <UserSuspendAction
                        user={p}
                        disabled={!!pending || actionBusy}
                        onRequest={() => setPending({ type: "suspend", user: p })}
                      />
                      <UserDeleteAction
                        disabled={!!pending || actionBusy}
                        onRequest={() => setPending({ type: "delete", user: p })}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ViewUserDialog
        user={viewUser}
        open={!!viewUser}
        onOpenChange={(open) => !open && setViewUser(null)}
      />

      <EditUserDialog
        user={editUser}
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        onSave={updateUser}
      />
    </Card>
  );
}
