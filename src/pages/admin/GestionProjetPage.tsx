import { useState } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useProjets } from "@/hooks/useProjets";
import { ResponsableModal } from "./projet/ResponsableModal";
import { GanttPreview } from "./projet/GanttPreview";
import type { ProjetPlanItem } from "@/types/projet";
import { cn } from "@/lib/utils";

const EMPTY_PLAN_ITEM: ProjetPlanItem = {
  axe: "",
  tache: "",
  responsable_id: null,
  date_debut: null,
  date_fin: null,
  livrable: "",
  commentaire: "",
};

export default function GestionProjetPage() {
  const { projets, loading, createProjet, deleteProjet, fetchProjets } = useProjets();
  const [activeTab, setActiveTab] = useState("nouveau");
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [planItems, setPlanItems] = useState<ProjetPlanItem[]>([{ ...EMPTY_PLAN_ITEM }]);
  const [responsableModalFor, setResponsableModalFor] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewProjet, setPreviewProjet] = useState<typeof projets[0] | null>(null);

  const addAxe = () => {
    setPlanItems((prev) => [
      ...prev,
      {
        ...EMPTY_PLAN_ITEM,
        axe: `__new_axe_${Date.now()}__`,
      },
    ]);
  };

  const addTaskUnderAxe = (idx: number) => {
    const current = planItems[idx];
    let axeToUse = current.axe;
    if (!axeToUse?.trim()) {
      for (let i = idx - 1; i >= 0; i--) {
        if (planItems[i].axe?.trim()) {
          axeToUse = planItems[i].axe;
          break;
        }
      }
    }
    const newItem: ProjetPlanItem = {
      axe: axeToUse || "",
      tache: "",
      responsable_id: null,
      responsable_name: undefined,
      date_debut: null,
      date_fin: null,
      livrable: "",
      commentaire: "",
    };
    setPlanItems((prev) => [
      ...prev.slice(0, idx + 1),
      newItem,
      ...prev.slice(idx + 1),
    ]);
  };

  const removePlanRow = (idx: number) => {
    setPlanItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const axeGroups = (() => {
    const groups: { startIdx: number; length: number; axe: string }[] = [];
    let i = 0;
    while (i < planItems.length) {
      const axe = planItems[i].axe ?? "";
      const displayAxe = axe.startsWith("__new_axe_") ? "" : axe;
      let len = 1;
      while (i + len < planItems.length && (planItems[i + len].axe ?? "") === axe) len++;
      groups.push({ startIdx: i, length: len, axe: displayAxe });
      i += len;
    }
    return groups;
  })();

  const updatePlanItem = (idx: number, field: keyof ProjetPlanItem, value: unknown) => {
    setPlanItems((prev) => {
      const next = [...prev];
      if (field === "axe") {
        const group = axeGroups.find((g) => idx >= g.startIdx && idx < g.startIdx + g.length);
        if (group) {
          for (let i = group.startIdx; i < group.startIdx + group.length; i++) {
            next[i] = { ...next[i], [field]: value };
          }
          return next;
        }
      }
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const openResponsableModal = (idx: number) => setResponsableModalFor(idx);
  const handleResponsableSelect = (personnelId: string | null, personnelName: string) => {
    if (responsableModalFor !== null) {
      updatePlanItem(responsableModalFor, "responsable_id", personnelId);
      updatePlanItem(responsableModalFor, "responsable_name", personnelName);
      setResponsableModalFor(null);
    }
  };

  const handleSave = async () => {
    if (!nom.trim()) {
      setSaveError("Le nom du projet est requis.");
      return;
    }
    setSaveError(null);
    const cleanedItems = planItems.map((item) => ({
      ...item,
      axe: item.axe?.startsWith("__new_axe_") ? "" : (item.axe ?? ""),
    }));
    const { error } = await createProjet(nom, description || null, cleanedItems);
    if (error) {
      setSaveError(error);
    } else {
      setNom("");
      setDescription("");
      setPlanItems([{ ...EMPTY_PLAN_ITEM }]);
      setActiveTab("liste");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer ce projet ?")) {
      await deleteProjet(id);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-primary/10">
          <ClipboardList className="text-primary" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Gestion Projet</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="nouveau">Nouveau projet</TabsTrigger>
          <TabsTrigger value="liste">Liste projet</TabsTrigger>
        </TabsList>

        <TabsContent value="nouveau" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Créer un projet</CardTitle>
              <CardDescription>Remplissez les champs pour créer un nouveau projet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Nom du projet"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description du projet"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <Label>Plan d'action</Label>
                <div className="border rounded-lg overflow-x-auto">
                  <Table className="table-fixed w-full min-w-[900px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px] min-w-[200px] px-4 py-3">Axe</TableHead>
                        <TableHead className="w-[200px] min-w-[200px] px-4 py-3">Tâche</TableHead>
                        <TableHead className="w-[180px] min-w-[180px] px-4 py-3">Responsable</TableHead>
                        <TableHead className="w-[260px] min-w-[260px] px-4 py-3">Durée</TableHead>
                        <TableHead className="w-[180px] min-w-[180px] px-4 py-3">Livrable</TableHead>
                        <TableHead className="w-[160px] min-w-[160px] max-w-[160px] px-4 py-3">Commentaire</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {axeGroups.flatMap((group) =>
                        Array.from({ length: group.length }, (_, i) => {
                          const idx = group.startIdx + i;
                          const item = planItems[idx];
                          const isFirstInGroup = i === 0;
                          return (
                            <TableRow key={idx}>
                              {isFirstInGroup ? (
                                <TableCell
                                  rowSpan={group.length}
                                  className="px-4 py-3 align-top border-r border-border"
                                >
                                  <div className="flex gap-2 items-center">
                                    <Input
                                      value={group.axe}
                                      onChange={(e) => updatePlanItem(group.startIdx, "axe", e.target.value)}
                                      placeholder="Axe"
                                      className="h-9 min-w-[120px] flex-1"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
onClick={addAxe}
                                    title="Ajouter un axe"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                      onClick={() => removePlanRow(idx)}
                                      title="Supprimer la ligne"
                                      disabled={planItems.length === 1}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              ) : null}
                              <TableCell className="px-4 py-3 align-middle">
                            <div className="flex gap-2 items-center">
                              <Input
                                value={item.tache}
                                onChange={(e) => updatePlanItem(idx, "tache", e.target.value)}
                                placeholder="Tâche"
                                className="h-9 min-w-[120px] flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                onClick={() => addTaskUnderAxe(idx)}
                                title="Ajouter une tâche (même axe)"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                onClick={() => removePlanRow(idx)}
                                title="Supprimer la ligne"
                                disabled={planItems.length === 1}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 align-middle">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full justify-start h-9 gap-2 min-h-9"
                              onClick={() => openResponsableModal(idx)}
                            >
                              <UserPlus className="h-4 w-4 shrink-0" />
                              {item.responsable_name || "Choisir"}
                            </Button>
                          </TableCell>
                          <TableCell className="px-4 py-3 align-middle">
                            <DateRangeCell
                              dateDebut={item.date_debut}
                              dateFin={item.date_fin}
                              onRangeChange={(from, to) => {
                                updatePlanItem(idx, "date_debut", from);
                                updatePlanItem(idx, "date_fin", to);
                              }}
                            />
                          </TableCell>
                          <TableCell className="px-4 py-3 align-middle">
                            <Input
                              value={item.livrable}
                              onChange={(e) => updatePlanItem(idx, "livrable", e.target.value)}
                              placeholder="Livrable"
                              className="h-9 w-full"
                            />
                          </TableCell>
                          <TableCell className="px-4 py-3 align-middle">
                            <Input
                              value={item.commentaire}
                              onChange={(e) => updatePlanItem(idx, "commentaire", e.target.value)}
                              placeholder="Commentaire"
                              className="h-9 w-full max-w-[160px]"
                            />
                          </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                <Accordion type="single" collapsible className="mt-4">
                  <AccordionItem value="gantt" className="border rounded-lg px-4">
                    <AccordionTrigger>Aperçu Gantt du plan</AccordionTrigger>
                    <AccordionContent>
                      <GanttPreview items={planItems} />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {saveError && <p className="text-sm text-destructive">{saveError}</p>}
              <Button onClick={handleSave}>Enregistrer</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liste" className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : (
            <div className="space-y-4">
              {projets.map((proj) => (
                <Card key={proj.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{proj.nom}</CardTitle>
                      {proj.description && (
                        <CardDescription className="mt-1">{proj.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPreviewProjet(proj)}>
                        Aperçu
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(proj.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </CardHeader>
                  {proj.plan_items.length > 0 && (
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Axe</TableHead>
                            <TableHead>Tâche</TableHead>
                            <TableHead>Responsable</TableHead>
                            <TableHead>Durée</TableHead>
                            <TableHead>Livrable</TableHead>
                            <TableHead>Commentaire</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {proj.plan_items.map((item, i) => (
                            <TableRow key={i}>
                              <TableCell>{item.axe || "—"}</TableCell>
                              <TableCell>{item.tache || "—"}</TableCell>
                              <TableCell>{item.responsable_name || "—"}</TableCell>
                              <TableCell>
                                {item.date_debut && item.date_fin
                                  ? `${format(new Date(item.date_debut), "dd/MM/yyyy", { locale: fr })} - ${format(new Date(item.date_fin), "dd/MM/yyyy", { locale: fr })}`
                                  : "—"}
                              </TableCell>
                              <TableCell>{item.livrable || "—"}</TableCell>
                              <TableCell>{item.commentaire || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  )}
                </Card>
              ))}
              {projets.length === 0 && (
                <p className="text-muted-foreground text-center py-8">Aucun projet.</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ResponsableModal
        open={responsableModalFor !== null}
        onOpenChange={(o) => !o && setResponsableModalFor(null)}
        onSelect={handleResponsableSelect}
      />

      <Dialog open={!!previewProjet} onOpenChange={(o) => !o && setPreviewProjet(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewProjet?.nom}</DialogTitle>
            <DialogDescription>{previewProjet?.description ?? "Aucune description."}</DialogDescription>
          </DialogHeader>
          {previewProjet?.plan_items && previewProjet.plan_items.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Axe</TableHead>
                  <TableHead>Tâche</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Livrable</TableHead>
                  <TableHead>Commentaire</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewProjet.plan_items.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.axe || "—"}</TableCell>
                    <TableCell>{item.tache || "—"}</TableCell>
                    <TableCell>{item.responsable_name || "—"}</TableCell>
                    <TableCell>
                      {item.date_debut && item.date_fin
                        ? `${format(new Date(item.date_debut), "dd/MM/yyyy", { locale: fr })} - ${format(new Date(item.date_fin), "dd/MM/yyyy", { locale: fr })}`
                        : "—"}
                    </TableCell>
                    <TableCell>{item.livrable || "—"}</TableCell>
                    <TableCell>{item.commentaire || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DateRangeCell({
  dateDebut,
  dateFin,
  onRangeChange,
}: {
  dateDebut: string | null;
  dateFin: string | null;
  onRangeChange: (from: string | null, to: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const from = dateDebut ? new Date(dateDebut) : undefined;
  const to = dateFin ? new Date(dateFin) : undefined;
  const range = from && to ? { from, to } : from ? { from, to: from } : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full min-w-[180px] justify-start text-left font-normal h-9 text-xs px-3",
            !range && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          {range?.from ? (
range.to && range.to.getTime() !== range.from.getTime() ? (
                <>
                  {format(range.from, "dd/MM/yy", { locale: fr })} - {format(range.to, "dd/MM/yy", { locale: fr })}
                </>
              ) : (
              format(range.from, "dd/MM/yy", { locale: fr })
            )
          ) : (
            "Sélectionner dates"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={(r) => {
            if (r?.from) {
              onRangeChange(r.from.toISOString().slice(0, 10), r.to?.toISOString().slice(0, 10) ?? null);
              if (r.from && r.to) setOpen(false);
            }
          }}
          locale={fr}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
