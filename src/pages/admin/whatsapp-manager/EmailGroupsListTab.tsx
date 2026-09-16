import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { EmailGroup, EmailGroupMemberInput } from "./emailGroupTypes";
import { deleteEmailGroup, listEmailGroups, updateEmailGroup } from "./emailGroupsApi";

const QUERY_KEY = ["email-notification-groups"] as const;

function emptyMember(): EmailGroupMemberInput {
  return { full_name: "", email: "" };
}

export default function EmailGroupsListTab() {
  const queryClient = useQueryClient();
  const [editGroup, setEditGroup] = useState<EmailGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailGroup | null>(null);
  const [editName, setEditName] = useState("");
  const [editMembers, setEditMembers] = useState<EmailGroupMemberInput[]>([emptyMember()]);

  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: listEmailGroups,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const updateMut = useMutation({
    mutationFn: () => {
      if (!editGroup) throw new Error("missing");
      return updateEmailGroup({
        id: editGroup.id,
        name: editName,
        members: editMembers,
      });
    },
    onSuccess: () => {
      toast.success("Groupe mis à jour");
      setEditGroup(null);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteEmailGroup(id),
    onSuccess: () => {
      toast.success("Groupe supprimé");
      setDeleteTarget(null);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (g: EmailGroup) => {
    setEditGroup(g);
    setEditName(g.name);
    const members = (g.members ?? []).map((m) => ({
      full_name: m.full_name,
      email: m.email,
    }));
    setEditMembers(members.length > 0 ? members : [emptyMember()]);
  };

  const updateMember = (index: number, patch: Partial<EmailGroupMemberInput>) => {
    setEditMembers((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  };

  const removeMember = (index: number) => {
    setEditMembers((prev) => (prev.length <= 1 ? [emptyMember()] : prev.filter((_, i) => i !== index)));
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground max-w-xl">
        Groupes destinataires des notifications de publications. Modifiez ou supprimez un groupe ci-dessous.
      </p>

      {error && <p className="text-sm text-destructive">{error instanceof Error ? error.message : "Erreur"}</p>}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Groupe</TableHead>
              <TableHead className="hidden sm:table-cell">Membres</TableHead>
              <TableHead className="w-[100px]">État</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4}>Chargement…</TableCell>
              </TableRow>
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Aucun groupe. Créez-en un dans l’onglet « Nouveau groupe ».
                </TableCell>
              </TableRow>
            ) : (
              groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {(g.members ?? []).length} membre{(g.members ?? []).length > 1 ? "s" : ""}
                  </TableCell>
                  <TableCell>
                    {g.is_active ? <Badge variant="secondary">Actif</Badge> : <Badge variant="outline">Inactif</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(g)} aria-label="Modifier">
                        <Pencil size={18} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setDeleteTarget(g)}
                        aria-label="Supprimer"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!editGroup}
        onOpenChange={(o) => {
          if (!o) setEditGroup(null);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le groupe</DialogTitle>
            <DialogDescription>{editGroup?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="eg-edit-name">Nom du groupe *</Label>
              <Input id="eg-edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label>Membres *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setEditMembers((prev) => [...prev, emptyMember()])}
                >
                  <Plus size={16} />
                  Ajouter
                </Button>
              </div>

              {editMembers.map((m, index) => (
                <div
                  key={index}
                  className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end rounded-xl border border-border p-3"
                >
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input
                      value={m.full_name}
                      onChange={(e) => updateMember(index, { full_name: e.target.value })}
                      placeholder="Prénom Nom"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={m.email}
                      onChange={(e) => updateMember(index, { email: e.target.value })}
                      placeholder="exemple@domaine.ma"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => removeMember(index)}
                    aria-label="Retirer"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditGroup(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!editName.trim()) {
                  toast.error("Le nom du groupe est obligatoire");
                  return;
                }
                updateMut.mutate();
              }}
              disabled={updateMut.isPending}
            >
              {updateMut.isPending ? "…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce groupe ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {deleteTarget?.name} » et ses membres seront supprimés. Les notifications ne leur seront plus envoyées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={(e) => {
                const id = deleteTarget?.id;
                if (!id) return;
                e.preventDefault();
                deleteMut.mutate(id);
              }}
              disabled={deleteMut.isPending}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
