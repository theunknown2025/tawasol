import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { useAuth } from "@/contexts/AuthContext";
import type { WhatsappGroup } from "./types";
import {
  createWhatsappGroup,
  deleteWhatsappGroup,
  listWhatsappGroups,
  updateWhatsappGroup,
} from "./whatsappGroupsApi";

const QUERY_KEY = ["whatsapp-groups"] as const;

function parseBrevoListId(raw: string): number | null {
  const n = Number.parseInt(String(raw).replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function emptyForm() {
  return {
    name: "",
    description: "",
    brevo_list_id: "",
    notes: "",
    sort_order: "0",
    is_active: true,
    notify_publications: true,
    notify_events: true,
    notify_blogs: true,
  };
}

export default function BrevoListsPanel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<WhatsappGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WhatsappGroup | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: listWhatsappGroups,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const createMut = useMutation({
    mutationFn: () =>
      createWhatsappGroup({
        name: form.name.trim(),
        description: form.description.trim(),
        invite_link: "",
        wa_group_jid: "",
        brevo_list_id: parseBrevoListId(form.brevo_list_id),
        notes: form.notes.trim(),
        sort_order: Number.parseInt(form.sort_order, 10) || 0,
        is_active: form.is_active,
        notify_publications: form.notify_publications,
        notify_events: form.notify_events,
        notify_blogs: form.notify_blogs,
        created_by: user?.id ?? null,
      }),
    onSuccess: () => {
      toast.success("Liste enregistrée");
      setCreateOpen(false);
      setForm(emptyForm());
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: () => {
      if (!editGroup) throw new Error("missing");
      return updateWhatsappGroup(editGroup.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        brevo_list_id: parseBrevoListId(form.brevo_list_id),
        notes: form.notes.trim(),
        sort_order: Number.parseInt(form.sort_order, 10) || 0,
        is_active: form.is_active,
        notify_publications: form.notify_publications,
        notify_events: form.notify_events,
        notify_blogs: form.notify_blogs,
      });
    },
    onSuccess: () => {
      toast.success("Liste mise à jour");
      setEditGroup(null);
      setForm(emptyForm());
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteWhatsappGroup(id),
    onSuccess: () => {
      toast.success("Entrée supprimée");
      setDeleteTarget(null);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (g: WhatsappGroup) => {
    setEditGroup(g);
    setForm({
      name: g.name,
      description: g.description,
      brevo_list_id: g.brevo_list_id != null ? String(g.brevo_list_id) : "",
      notes: g.notes,
      sort_order: String(g.sort_order),
      is_active: g.is_active,
      notify_publications: g.notify_publications ?? true,
      notify_events: g.notify_events ?? true,
      notify_blogs: g.notify_blogs ?? true,
    });
  };

  const FormFields = (
    <>
      <div className="space-y-2">
        <Label htmlFor="bl-name">Nom *</Label>
        <Input
          id="bl-name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Ex. Membres — newsletter"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bl-desc">Description</Label>
        <Textarea
          id="bl-desc"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bl-list">ID liste Brevo *</Label>
        <Input
          id="bl-list"
          type="number"
          min={1}
          value={form.brevo_list_id}
          onChange={(e) => setForm((f) => ({ ...f, brevo_list_id: e.target.value }))}
          placeholder="Contacts → Listes dans Brevo"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bl-notes">Notes internes</Label>
        <Textarea id="bl-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2 flex-1">
          <Label htmlFor="bl-order">Ordre</Label>
          <Input
            id="bl-order"
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-2 pb-2">
          <Switch
            id="bl-active"
            checked={form.is_active}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
          />
          <Label htmlFor="bl-active" className="cursor-pointer">
            Actif
          </Label>
        </div>
      </div>
      <div className="rounded-lg border border-border p-4 space-y-3">
        <p className="text-sm font-medium">Canaux email</p>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={form.notify_publications}
              onCheckedChange={(c) => setForm((f) => ({ ...f, notify_publications: c }))}
            />
            <Label className="text-sm cursor-pointer">Publications (Mur)</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.notify_events}
              onCheckedChange={(c) => setForm((f) => ({ ...f, notify_events: c }))}
            />
            <Label className="text-sm cursor-pointer">Événements</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.notify_blogs} onCheckedChange={(c) => setForm((f) => ({ ...f, notify_blogs: c }))} />
            <Label className="text-sm cursor-pointer">Articles (blog)</Label>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-xl">
          Une ligne par liste Brevo : ID issu de Contacts → Listes. Les champs WhatsApp se gèrent dans l’onglet
          WhatsApp.
        </p>
        <Button type="button" onClick={() => { setForm(emptyForm()); setCreateOpen(true); }} className="gap-2 shrink-0">
          <Plus size={18} />
          Nouvelle liste
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error instanceof Error ? error.message : "Erreur"}</p>}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead className="hidden md:table-cell">ID liste</TableHead>
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
                  Aucune entrée.
                </TableCell>
              </TableRow>
            ) : (
              groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{g.name}</span>
                      {g.description ? (
                        <span className="text-xs font-normal text-muted-foreground line-clamp-2">{g.description}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell tabular-nums text-muted-foreground text-sm">
                    {g.brevo_list_id ?? "—"}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle liste d’envoi (Brevo)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">{FormFields}</div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!form.name.trim() || !parseBrevoListId(form.brevo_list_id)) {
                  toast.error("Nom et ID liste Brevo sont requis");
                  return;
                }
                createMut.mutate();
              }}
              disabled={createMut.isPending}
            >
              {createMut.isPending ? "…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editGroup}
        onOpenChange={(o) => {
          if (!o) {
            setEditGroup(null);
            setForm(emptyForm());
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la liste</DialogTitle>
            <DialogDescription>{editGroup?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">{FormFields}</div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setEditGroup(null); setForm(emptyForm()); }}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!form.name.trim()) {
                  toast.error("Le nom est obligatoire");
                  return;
                }
                updateMut.mutate();
              }}
              disabled={updateMut.isPending}
            >
              {updateMut.isPending ? "…" : "Mettre à jour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette entrée ?</AlertDialogTitle>
            <AlertDialogDescription>« {deleteTarget?.name} » sera supprimé (email et liaisons WAHA perdent cette ligne).</AlertDialogDescription>
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
