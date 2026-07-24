import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
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
import { listWahaGroupsFromServer, type WahaGroupFromServer } from "./wahaEdgeApi";

const QUERY_KEY = ["whatsapp-groups"] as const;

function emptyForm() {
  return {
    name: "",
    description: "",
    invite_link: "",
    wa_group_jid: "",
    notes: "",
    sort_order: "0",
    is_active: true,
    notify_publications: true,
    notify_events: true,
    notify_blogs: true,
  };
}

export default function WahaGroupsPanel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<WhatsappGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WhatsappGroup | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [wahaPickerOpen, setWahaPickerOpen] = useState(false);
  const [wahaPickerLoading, setWahaPickerLoading] = useState(false);
  const [wahaRemoteGroups, setWahaRemoteGroups] = useState<WahaGroupFromServer[]>([]);

  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: listWhatsappGroups,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const openWahaPicker = async () => {
    setWahaPickerOpen(true);
    setWahaPickerLoading(true);
    setWahaRemoteGroups([]);
    const { data, error } = await listWahaGroupsFromServer();
    setWahaPickerLoading(false);
    if (error) {
      toast.error(error.slice(0, 240));
      return;
    }
    if (!data?.ok || data.error) {
      toast.error(data?.error ?? "Impossible de lister les groupes WAHA");
      return;
    }
    const list = data.groups ?? [];
    setWahaRemoteGroups(list);
    if (list.length === 0) {
      toast.warning("Aucun groupe retourné par WAHA — vérifiez la session et que le bot est dans les groupes.");
    }
  };

  const applyWahaGroup = (g: WahaGroupFromServer) => {
    setForm((f) => ({
      ...f,
      wa_group_jid: g.id,
      name: f.name.trim() ? f.name : (g.name ?? g.id),
    }));
    setWahaPickerOpen(false);
    toast.success("JID appliqué — enregistrez le groupe.");
  };

  const createMut = useMutation({
    mutationFn: () =>
      createWhatsappGroup({
        name: form.name.trim(),
        description: form.description.trim(),
        invite_link: form.invite_link.trim(),
        wa_group_jid: form.wa_group_jid.trim(),
        brevo_list_id: null,
        notes: form.notes.trim(),
        sort_order: Number.parseInt(form.sort_order, 10) || 0,
        is_active: form.is_active,
        notify_publications: form.notify_publications,
        notify_events: form.notify_events,
        notify_blogs: form.notify_blogs,
        created_by: user?.id ?? null,
      }),
    onSuccess: () => {
      toast.success("Groupe enregistré");
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
        invite_link: form.invite_link.trim(),
        wa_group_jid: form.wa_group_jid.trim(),
        notes: form.notes.trim(),
        sort_order: Number.parseInt(form.sort_order, 10) || 0,
        is_active: form.is_active,
        notify_publications: form.notify_publications,
        notify_events: form.notify_events,
        notify_blogs: form.notify_blogs,
      });
    },
    onSuccess: () => {
      toast.success("Groupe mis à jour");
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
      invite_link: g.invite_link ?? "",
      wa_group_jid: g.wa_group_jid ?? "",
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
        <Label htmlFor="wg-name">Nom *</Label>
        <Input
          id="wg-name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Ex. Membres — groupe général"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="wg-desc">Description</Label>
        <Textarea
          id="wg-desc"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="wg-invite">Lien du groupe (invitation)</Label>
        <Input
          id="wg-invite"
          value={form.invite_link}
          onChange={(e) => setForm((f) => ({ ...f, invite_link: e.target.value }))}
          placeholder="https://chat.whatsapp.com/…"
        />
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="wg-jid">JID du groupe WhatsApp</Label>
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => void openWahaPicker()}>
            <RefreshCw className="size-3.5 mr-1.5" />
            Choisir depuis WAHA
          </Button>
        </div>
        <Input
          id="wg-jid"
          value={form.wa_group_jid}
          onChange={(e) => setForm((f) => ({ ...f, wa_group_jid: e.target.value }))}
          placeholder="Ex. 120363…@g.us — requis pour l’envoi WAHA"
        />
        <p className="text-xs text-muted-foreground">
          Utilisez « Choisir depuis WAHA » après connexion de la session (secret WAHA_BASE_URL). Sans JID, aucun envoi
          WhatsApp.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="wg-notes">Notes internes</Label>
        <Textarea id="wg-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2 flex-1">
          <Label htmlFor="wg-order">Ordre</Label>
          <Input
            id="wg-order"
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-2 pb-2">
          <Switch
            id="wg-active"
            checked={form.is_active}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
          />
          <Label htmlFor="wg-active" className="cursor-pointer">
            Actif
          </Label>
        </div>
      </div>
      <div className="rounded-lg border border-border p-4 space-y-3">
        <p className="text-sm font-medium">Canaux WhatsApp</p>
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

  const canSubmitCreate = () => {
    if (!form.name.trim()) return false;
    if (!form.invite_link.trim() && !form.wa_group_jid.trim()) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-xl">
          Lien d’invitation et JID pour WAHA. Les ID de listes Brevo se gèrent dans l’onglet Email.
        </p>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button type="button" variant="outline" onClick={() => void openWahaPicker()} className="gap-2">
            <RefreshCw size={18} />
            Groupes WAHA
          </Button>
          <Button type="button" onClick={() => { setForm(emptyForm()); setCreateOpen(true); }} className="gap-2">
            <Plus size={18} />
            Nouveau groupe
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error instanceof Error ? error.message : "Erreur"}</p>}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead className="hidden lg:table-cell max-w-[200px]">Lien</TableHead>
              <TableHead className="hidden md:table-cell">JID</TableHead>
              <TableHead className="w-[100px]">État</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5}>Chargement…</TableCell>
              </TableRow>
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
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
                  <TableCell className="hidden lg:table-cell max-w-[200px]">
                    {g.invite_link ? (
                      <a
                        href={g.invite_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary truncate block max-w-full underline-offset-2 hover:underline"
                      >
                        {g.invite_link.replace(/^https?:\/\//, "").slice(0, 40)}
                        {g.invite_link.length > 45 ? "…" : ""}
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                    {g.wa_group_jid ? <span className="line-clamp-2">{g.wa_group_jid}</span> : "—"}
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
            <DialogTitle>Nouveau groupe WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">{FormFields}</div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!canSubmitCreate()) {
                  toast.error("Nom requis, et au moins un lien d’invitation ou un JID");
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
            <DialogTitle>Modifier le groupe</DialogTitle>
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

      <Dialog open={wahaPickerOpen} onOpenChange={setWahaPickerOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Groupes WhatsApp (WAHA)</DialogTitle>
            <DialogDescription>
              Sélectionnez un groupe pour remplir le JID. Ouvrez d’abord la création ou la modification d’un groupe REMESS.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 py-2 space-y-2">
            {wahaPickerLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                <Loader2 className="size-4 animate-spin" />
                Connexion à WAHA…
              </div>
            ) : wahaRemoteGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun groupe ou erreur de connexion.</p>
            ) : (
              wahaRemoteGroups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className="w-full text-left rounded-lg border border-border px-3 py-2 hover:bg-muted/60 transition-colors"
                  onClick={() => applyWahaGroup(g)}
                  disabled={!createOpen && !editGroup}
                >
                  <p className="font-medium text-sm truncate">{g.name ?? g.id}</p>
                  <p className="font-mono text-xs text-muted-foreground truncate">{g.id}</p>
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setWahaPickerOpen(false)}>
              Fermer
            </Button>
            <Button type="button" variant="secondary" onClick={() => void openWahaPicker()} disabled={wahaPickerLoading}>
              Actualiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette entrée ?</AlertDialogTitle>
            <AlertDialogDescription>« {deleteTarget?.name} » sera supprimé (email et WhatsApp).</AlertDialogDescription>
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
