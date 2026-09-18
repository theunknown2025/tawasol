import { useRef, useState, type ReactNode } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  UserPlus,
  FileUp,
  X,
  Pencil,
  AlignLeft,
  MapPin,
  Wallet,
  CalendarRange,
  Landmark,
  FileText,
  ListTodo,
  GanttChart,
  Target,
  type LucideIcon,
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjets } from "@/hooks/useProjets";
import { getProjetDocumentSignedUrl } from "@/lib/projetDocumentsApi";
import { ResponsableModal } from "./projet/ResponsableModal";
import { GanttPreview } from "./projet/GanttPreview";
import type { ProjetKpi, ProjetPlanItem, ProjetWithPlan } from "@/types/projet";
import { MAROC_REGIONS, provincesForRegion } from "@/types/projet";
import { cn } from "@/lib/utils";

const EMPTY_PLAN_ITEM: ProjetPlanItem = {
  axe: "",
  tache: "",
  responsable_id: null,
  contributeur_ids: [],
  date_debut: null,
  date_fin: null,
  livrable: "",
  commentaire: "",
};

const EMPTY_KPI: ProjetKpi = {
  nom: "",
  description: "",
  objectif: "",
  resultat_escompte: "",
  mesure: "",
  frequence: "",
};

type PersonnelPicker =
  | { mode: "responsable"; rowIndex: number }
  | { mode: "contributeurs"; rowIndex: number }
  | null;

function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      {children}
    </h4>
  );
}

function MetaCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        {label}
      </p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

export default function GestionProjetPage() {
  const { projets, loading, createProjet, updateProjet, deleteProjet } = useProjets();
  const [activeTab, setActiveTab] = useState("nouveau");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [zoneRegion, setZoneRegion] = useState("");
  const [zoneProvince, setZoneProvince] = useState("");
  const [budget, setBudget] = useState("");
  const [bailleurs, setBailleurs] = useState<string[]>([""]);
  const [projetDateDebut, setProjetDateDebut] = useState<string | null>(null);
  const [projetDateFin, setProjetDateFin] = useState<string | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<ProjetWithPlan["documents"]>([]);
  const docsInputRef = useRef<HTMLInputElement>(null);
  const [planItems, setPlanItems] = useState<ProjetPlanItem[]>([{ ...EMPTY_PLAN_ITEM }]);
  const [kpis, setKpis] = useState<ProjetKpi[]>([{ ...EMPTY_KPI }]);
  const [personnelPicker, setPersonnelPicker] = useState<PersonnelPicker>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      ...EMPTY_PLAN_ITEM,
      axe: axeToUse || "",
    };
    setPlanItems((prev) => [...prev.slice(0, idx + 1), newItem, ...prev.slice(idx + 1)]);
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

  const updatePlanItem = <K extends keyof ProjetPlanItem>(
    idx: number,
    field: K,
    value: ProjetPlanItem[K]
  ) => {
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

  const handleResponsableSelect = (personnelId: string | null, personnelName: string) => {
    if (personnelPicker?.mode !== "responsable") return;
    const idx = personnelPicker.rowIndex;
    setPlanItems((prev) => {
      const next = [...prev];
      const item = next[idx];
      const pairs = (item.contributeur_ids ?? []).map((id, i) => ({
        id,
        name: item.contributeur_names?.[i] ?? id,
      }));
      const kept = pairs.filter((p) => p.id !== personnelId);
      next[idx] = {
        ...item,
        responsable_id: personnelId,
        responsable_name: personnelName,
        contributeur_ids: kept.map((p) => p.id),
        contributeur_names: kept.map((p) => p.name),
      };
      return next;
    });
    setPersonnelPicker(null);
  };

  const handleContributeursSelect = (items: { id: string; name: string }[]) => {
    if (personnelPicker?.mode !== "contributeurs") return;
    const idx = personnelPicker.rowIndex;
    setPlanItems((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        contributeur_ids: items.map((x) => x.id),
        contributeur_names: items.map((x) => x.name),
      };
      return next;
    });
    setPersonnelPicker(null);
  };

  const updateKpi = (idx: number, field: keyof ProjetKpi, value: string) => {
    setKpis((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setNom("");
    setDescription("");
    setZoneRegion("");
    setZoneProvince("");
    setBudget("");
    setBailleurs([""]);
    setProjetDateDebut(null);
    setProjetDateFin(null);
    setDocumentFiles([]);
    setExistingDocuments([]);
    setPlanItems([{ ...EMPTY_PLAN_ITEM }]);
    setKpis([{ ...EMPTY_KPI }]);
    setSaveError(null);
  };

  const startEdit = (proj: ProjetWithPlan) => {
    setEditingId(proj.id);
    setNom(proj.nom);
    setDescription(proj.description ?? "");
    setZoneRegion(proj.zone_region ?? "");
    setZoneProvince(proj.zone_province ?? "");
    setBudget(proj.budget != null ? String(proj.budget) : "");
    setBailleurs(proj.bailleurs_de_fonds?.length ? [...proj.bailleurs_de_fonds] : [""]);
    setProjetDateDebut(proj.date_debut);
    setProjetDateFin(proj.date_fin);
    setDocumentFiles([]);
    setExistingDocuments(proj.documents ?? []);
    setPlanItems(
      proj.plan_items.length > 0
        ? proj.plan_items.map((item) => ({
            ...item,
            contributeur_ids: item.contributeur_ids ?? [],
            contributeur_names: item.contributeur_names ?? [],
          }))
        : [{ ...EMPTY_PLAN_ITEM }]
    );
    setKpis(proj.kpis.length > 0 ? proj.kpis.map((k) => ({ ...k })) : [{ ...EMPTY_KPI }]);
    setSaveError(null);
    setActiveTab("nouveau");
  };

  const buildPayload = () => {
    const cleanedItems = planItems.map((item) => ({
      ...item,
      axe: item.axe?.startsWith("__new_axe_") ? "" : (item.axe ?? ""),
      contributeur_ids: (item.contributeur_ids ?? []).filter(
        (id) => id && id !== item.responsable_id
      ),
    }));
    const budgetNum = budget.trim() === "" ? null : Number(budget.replace(",", "."));
    return {
      nom: nom.trim(),
      description: description || null,
      zone_region: zoneRegion || null,
      zone_province: zoneProvince.trim() || null,
      budget: budgetNum !== null && Number.isFinite(budgetNum) ? budgetNum : null,
      date_debut: projetDateDebut,
      date_fin: projetDateFin,
      bailleurs_de_fonds: bailleurs,
      planItems: cleanedItems,
      kpis,
      documentFiles,
    };
  };

  const handleSave = async () => {
    if (!nom.trim()) {
      setSaveError("Le nom du projet est requis.");
      return;
    }
    setSaveError(null);
    setSaving(true);
    const payload = buildPayload();
    const { error } = editingId
      ? await updateProjet(editingId, payload)
      : await createProjet(payload);
    setSaving(false);
    if (error) {
      setSaveError(error);
    } else {
      resetForm();
      setActiveTab("liste");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer ce projet ?")) {
      await deleteProjet(id);
      if (editingId === id) resetForm();
    }
  };

  const pickerRow =
    personnelPicker !== null ? planItems[personnelPicker.rowIndex] : undefined;

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
          <TabsTrigger value="nouveau">
            {editingId ? "Modifier projet" : "Nouveau projet"}
          </TabsTrigger>
          <TabsTrigger value="liste">Liste projet</TabsTrigger>
        </TabsList>

        <TabsContent value="nouveau" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Modifier le projet" : "Créer un projet"}</CardTitle>
              <CardDescription>
                {editingId
                  ? "Modifiez les champs puis enregistrez les changements."
                  : "Remplissez les champs pour créer un nouveau projet."}
              </CardDescription>
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

              <div className="space-y-4 rounded-lg border border-border p-4">
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>
                      Bailleurs de fonds{" "}
                      <span className="font-normal text-muted-foreground">(optionnel)</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => setBailleurs((prev) => [...prev, ""])}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {bailleurs.map((bailleur, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={bailleur}
                          onChange={(e) =>
                            setBailleurs((prev) =>
                              prev.map((b, i) => (i === idx ? e.target.value : b))
                            )
                          }
                          placeholder={`Bailleur ${idx + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          disabled={bailleurs.length === 1}
                          title="Retirer"
                          onClick={() =>
                            setBailleurs((prev) => prev.filter((_, i) => i !== idx))
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Zone d&apos;intervention — Région{" "}
                      <span className="text-muted-foreground font-normal">(optionnel)</span>
                    </Label>
                    <Select
                      value={zoneRegion || "__none__"}
                      onValueChange={(v) => {
                        const next = v === "__none__" ? "" : v;
                        setZoneRegion(next);
                        setZoneProvince("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une région" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">—</SelectItem>
                        {MAROC_REGIONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Province{" "}
                      <span className="text-muted-foreground font-normal">(optionnel)</span>
                    </Label>
                    <Select
                      value={zoneProvince || "__none__"}
                      onValueChange={(v) => setZoneProvince(v === "__none__" ? "" : v)}
                      disabled={!zoneRegion}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            zoneRegion ? "Choisir une province" : "Choisir d'abord une région"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">—</SelectItem>
                        {provincesForRegion(zoneRegion).map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="budget">
                      Budget{" "}
                      <span className="text-muted-foreground font-normal">(optionnel)</span>
                    </Label>
                    <Input
                      id="budget"
                      type="number"
                      min={0}
                      step="0.01"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="Montant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Durée{" "}
                      <span className="text-muted-foreground font-normal">(optionnel)</span>
                    </Label>
                    <DateRangeCell
                      dateDebut={projetDateDebut}
                      dateFin={projetDateFin}
                      onRangeChange={(from, to) => {
                        setProjetDateDebut(from);
                        setProjetDateFin(to);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Documents complémentaires{" "}
                    <span className="text-muted-foreground font-normal">(optionnel)</span>
                  </Label>
                  <input
                    ref={docsInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (files.length) setDocumentFiles((prev) => [...prev, ...files]);
                      if (docsInputRef.current) docsInputRef.current.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => docsInputRef.current?.click()}
                  >
                    <FileUp className="h-4 w-4" />
                    Ajouter des fichiers
                  </Button>
                  {existingDocuments.length > 0 && (
                    <ul className="space-y-1 pt-1">
                      {existingDocuments.map((doc) => (
                        <li key={doc.id} className="text-sm">
                          <button
                            type="button"
                            className="text-primary underline-offset-2 hover:underline"
                            onClick={async () => {
                              const url = await getProjetDocumentSignedUrl(doc.storage_path);
                              if (url) window.open(url, "_blank", "noopener,noreferrer");
                            }}
                          >
                            {doc.file_name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {documentFiles.length > 0 && (
                    <ul className="space-y-1 pt-1">
                      {documentFiles.map((file, i) => (
                        <li
                          key={`${file.name}-${i}`}
                          className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-1.5 text-sm"
                        >
                          <span className="truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() =>
                              setDocumentFiles((prev) => prev.filter((_, j) => j !== i))
                            }
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <Accordion type="multiple" defaultValue={["plan"]} className="space-y-3">
                <AccordionItem value="plan" className="border rounded-lg px-4">
                  <AccordionTrigger>Plan d&apos;action</AccordionTrigger>
                  <AccordionContent>
                    <div className="border rounded-lg overflow-x-auto">
                      <Table className="table-fixed w-full min-w-[1080px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px] min-w-[180px] px-4 py-3">Axe</TableHead>
                            <TableHead className="w-[180px] min-w-[180px] px-4 py-3">Tâche</TableHead>
                            <TableHead className="w-[160px] min-w-[160px] px-4 py-3">
                              Responsable
                            </TableHead>
                            <TableHead className="w-[180px] min-w-[180px] px-4 py-3">
                              Contributeur
                            </TableHead>
                            <TableHead className="w-[220px] min-w-[220px] px-4 py-3">Durée</TableHead>
                            <TableHead className="w-[150px] min-w-[150px] px-4 py-3">
                              Livrable
                            </TableHead>
                            <TableHead className="w-[140px] min-w-[140px] px-4 py-3">
                              Commentaire
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {axeGroups.flatMap((group) =>
                            Array.from({ length: group.length }, (_, i) => {
                              const idx = group.startIdx + i;
                              const item = planItems[idx];
                              const isFirstInGroup = i === 0;
                              const contribLabel =
                                item.contributeur_names && item.contributeur_names.length > 0
                                  ? item.contributeur_names.join(", ")
                                  : "Choisir";
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
                                          onChange={(e) =>
                                            updatePlanItem(group.startIdx, "axe", e.target.value)
                                          }
                                          placeholder="Axe"
                                          className="h-9 min-w-[100px] flex-1"
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
                                        onChange={(e) =>
                                          updatePlanItem(idx, "tache", e.target.value)
                                        }
                                        placeholder="Tâche"
                                        className="h-9 min-w-[100px] flex-1"
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
                                      onClick={() =>
                                        setPersonnelPicker({ mode: "responsable", rowIndex: idx })
                                      }
                                    >
                                      <UserPlus className="h-4 w-4 shrink-0" />
                                      <span className="truncate">
                                        {item.responsable_name || "Choisir"}
                                      </span>
                                    </Button>
                                  </TableCell>
                                  <TableCell className="px-4 py-3 align-middle">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="w-full justify-start h-auto min-h-9 gap-2 py-1.5"
                                      disabled={!item.responsable_id}
                                      title={
                                        item.responsable_id
                                          ? "Choisir les contributeurs"
                                          : "Sélectionnez d'abord un responsable"
                                      }
                                      onClick={() =>
                                        setPersonnelPicker({
                                          mode: "contributeurs",
                                          rowIndex: idx,
                                        })
                                      }
                                    >
                                      <UserPlus className="h-4 w-4 shrink-0" />
                                      <span className="truncate text-left whitespace-normal">
                                        {item.responsable_id ? contribLabel : "Après responsable"}
                                      </span>
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
                                      onChange={(e) =>
                                        updatePlanItem(idx, "livrable", e.target.value)
                                      }
                                      placeholder="Livrable"
                                      className="h-9 w-full"
                                    />
                                  </TableCell>
                                  <TableCell className="px-4 py-3 align-middle">
                                    <Input
                                      value={item.commentaire}
                                      onChange={(e) =>
                                        updatePlanItem(idx, "commentaire", e.target.value)
                                      }
                                      placeholder="Commentaire"
                                      className="h-9 w-full"
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="gantt" className="border rounded-lg px-4">
                  <AccordionTrigger>Aperçu Gantt du plan</AccordionTrigger>
                  <AccordionContent>
                    <GanttPreview items={planItems} />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="kpi" className="border rounded-lg px-4">
                  <AccordionTrigger>KPI</AccordionTrigger>
                  <AccordionContent>
                    <div className="border rounded-lg overflow-x-auto">
                      <Table className="w-full min-w-[960px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="px-3 py-3">Name</TableHead>
                            <TableHead className="px-3 py-3">Description</TableHead>
                            <TableHead className="px-3 py-3">Objectif</TableHead>
                            <TableHead className="px-3 py-3">Résultat escompté</TableHead>
                            <TableHead className="px-3 py-3">Mesure</TableHead>
                            <TableHead className="px-3 py-3">Fréquence</TableHead>
                            <TableHead className="w-12 px-2 py-3" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {kpis.map((kpi, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="px-3 py-2">
                                <Input
                                  value={kpi.nom}
                                  onChange={(e) => updateKpi(idx, "nom", e.target.value)}
                                  placeholder="Name"
                                  className="h-9"
                                />
                              </TableCell>
                              <TableCell className="px-3 py-2">
                                <Input
                                  value={kpi.description}
                                  onChange={(e) => updateKpi(idx, "description", e.target.value)}
                                  placeholder="Description"
                                  className="h-9"
                                />
                              </TableCell>
                              <TableCell className="px-3 py-2">
                                <Input
                                  value={kpi.objectif}
                                  onChange={(e) => updateKpi(idx, "objectif", e.target.value)}
                                  placeholder="Objectif"
                                  className="h-9"
                                />
                              </TableCell>
                              <TableCell className="px-3 py-2">
                                <Input
                                  value={kpi.resultat_escompte}
                                  onChange={(e) =>
                                    updateKpi(idx, "resultat_escompte", e.target.value)
                                  }
                                  placeholder="Résultat escompté"
                                  className="h-9"
                                />
                              </TableCell>
                              <TableCell className="px-3 py-2">
                                <Input
                                  value={kpi.mesure}
                                  onChange={(e) => updateKpi(idx, "mesure", e.target.value)}
                                  placeholder="Mesure"
                                  className="h-9"
                                />
                              </TableCell>
                              <TableCell className="px-3 py-2">
                                <Input
                                  value={kpi.frequence}
                                  onChange={(e) => updateKpi(idx, "frequence", e.target.value)}
                                  placeholder="Mensuel…"
                                  className="h-9"
                                />
                              </TableCell>
                              <TableCell className="px-2 py-2">
                                <div className="flex gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setKpis((prev) => [...prev, { ...EMPTY_KPI }])}
                                    title="Ajouter un KPI"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={kpis.length === 1}
                                    onClick={() =>
                                      setKpis((prev) => prev.filter((_, i) => i !== idx))
                                    }
                                    title="Supprimer"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {saveError && <p className="text-sm text-destructive">{saveError}</p>}
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving
                    ? "Enregistrement…"
                    : editingId
                      ? "Enregistrer les modifications"
                      : "Enregistrer"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                    Annuler
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liste" className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : projets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucun projet.</p>
          ) : (
            <Accordion type="single" collapsible className="space-y-3">
              {projets.map((proj) => (
                <AccordionItem
                  key={proj.id}
                  value={proj.id}
                  className="rounded-lg border border-border px-4"
                >
                  <div className="flex items-center gap-1">
                    <AccordionTrigger className="flex-1 py-4 hover:no-underline">
                      <div className="pr-3 text-left">
                        <p className="font-semibold text-foreground">{proj.nom}</p>
                        {proj.description && (
                          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                            {proj.description}
                          </p>
                        )}
                      </div>
                    </AccordionTrigger>
                    <div className="flex shrink-0 items-center gap-0.5 pb-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        title="Modifier"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          startEdit(proj);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        title="Supprimer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void handleDelete(proj.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <AccordionContent className="pb-4">
                    <div className="space-y-6 border-t border-border pt-4">
                      <section className="space-y-2">
                        <SectionHeading icon={AlignLeft}>Description</SectionHeading>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {proj.description?.trim() || "—"}
                        </p>
                      </section>

                      <section className="grid gap-3 sm:grid-cols-2">
                        <MetaCard
                          icon={MapPin}
                          label="Zone d'intervention"
                          value={
                            [proj.zone_region, proj.zone_province].filter(Boolean).join(" — ") ||
                            "—"
                          }
                        />
                        <MetaCard
                          icon={Wallet}
                          label="Budget"
                          value={
                            proj.budget != null ? proj.budget.toLocaleString("fr-MA") : "—"
                          }
                        />
                        <MetaCard
                          icon={CalendarRange}
                          label="Durée"
                          value={
                            proj.date_debut && proj.date_fin
                              ? `${format(new Date(proj.date_debut), "dd/MM/yyyy", { locale: fr })} — ${format(new Date(proj.date_fin), "dd/MM/yyyy", { locale: fr })}`
                              : "—"
                          }
                        />
                        <MetaCard
                          icon={Landmark}
                          label="Bailleurs de fonds"
                          value={
                            proj.bailleurs_de_fonds?.length
                              ? proj.bailleurs_de_fonds.join(", ")
                              : "—"
                          }
                        />
                      </section>

                      <section className="space-y-2">
                        <SectionHeading icon={FileText}>Documents complémentaires</SectionHeading>
                        {proj.documents.length > 0 ? (
                          <ul className="space-y-1">
                            {proj.documents.map((doc) => (
                              <li key={doc.id} className="flex items-center gap-2">
                                <FileUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <button
                                  type="button"
                                  className="text-sm text-primary underline-offset-2 hover:underline"
                                  onClick={async () => {
                                    const url = await getProjetDocumentSignedUrl(doc.storage_path);
                                    if (url) window.open(url, "_blank", "noopener,noreferrer");
                                  }}
                                >
                                  {doc.file_name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">Aucun document.</p>
                        )}
                      </section>

                      <section className="space-y-2">
                        <SectionHeading icon={ListTodo}>Plan d&apos;action</SectionHeading>
                        {proj.plan_items.length > 0 ? (
                          <div className="overflow-x-auto rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Axe</TableHead>
                                  <TableHead>Tâche</TableHead>
                                  <TableHead>Responsable</TableHead>
                                  <TableHead>Contributeur</TableHead>
                                  <TableHead>Durée</TableHead>
                                  <TableHead>Livrable</TableHead>
                                  <TableHead>Commentaire</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {proj.plan_items.map((item, i) => (
                                  <TableRow key={item.id ?? i}>
                                    <TableCell>{item.axe || "—"}</TableCell>
                                    <TableCell>{item.tache || "—"}</TableCell>
                                    <TableCell>{item.responsable_name || "—"}</TableCell>
                                    <TableCell>
                                      {item.contributeur_names?.length
                                        ? item.contributeur_names.join(", ")
                                        : "—"}
                                    </TableCell>
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
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Aucune ligne de plan.</p>
                        )}
                      </section>

                      <section className="space-y-2">
                        <SectionHeading icon={GanttChart}>Aperçu Gantt</SectionHeading>
                        <div className="rounded-md border border-border p-3">
                          <GanttPreview items={proj.plan_items} />
                        </div>
                      </section>

                      <section className="space-y-2">
                        <SectionHeading icon={Target}>KPI</SectionHeading>
                        {proj.kpis.length > 0 ? (
                          <div className="overflow-x-auto rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead>Objectif</TableHead>
                                  <TableHead>Résultat escompté</TableHead>
                                  <TableHead>Mesure</TableHead>
                                  <TableHead>Fréquence</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {proj.kpis.map((kpi, i) => (
                                  <TableRow key={kpi.id ?? i}>
                                    <TableCell>{kpi.nom || "—"}</TableCell>
                                    <TableCell>{kpi.description || "—"}</TableCell>
                                    <TableCell>{kpi.objectif || "—"}</TableCell>
                                    <TableCell>{kpi.resultat_escompte || "—"}</TableCell>
                                    <TableCell>{kpi.mesure || "—"}</TableCell>
                                    <TableCell>{kpi.frequence || "—"}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Aucun KPI.</p>
                        )}
                      </section>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>
      </Tabs>

      <ResponsableModal
        open={personnelPicker?.mode === "responsable"}
        onOpenChange={(o) => !o && setPersonnelPicker(null)}
        onSelect={handleResponsableSelect}
      />

      <ResponsableModal
        open={personnelPicker?.mode === "contributeurs"}
        onOpenChange={(o) => !o && setPersonnelPicker(null)}
        onSelect={() => {}}
        multiple
        selectedIds={pickerRow?.contributeur_ids ?? []}
        excludeIds={pickerRow?.responsable_id ? [pickerRow.responsable_id] : []}
        onSelectMultiple={handleContributeursSelect}
        title="Choisir les contributeurs"
        description="Sélectionnez un ou plusieurs contributeurs (le responsable est exclu)."
      />
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
                {format(range.from, "dd/MM/yy", { locale: fr })} -{" "}
                {format(range.to, "dd/MM/yy", { locale: fr })}
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
              onRangeChange(
                r.from.toISOString().slice(0, 10),
                r.to?.toISOString().slice(0, 10) ?? null
              );
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
