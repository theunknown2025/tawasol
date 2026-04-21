import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useProjets } from "@/hooks/useProjets";
import { getPmoDeadlineTone, pmoToneClasses } from "@/lib/pmoUtils";
import { fetchDocumentsByPlanItemIds } from "@/lib/pmoPlanDocumentsApi";
import { PmoDeadlineBadge } from "@/components/pmo/PmoDeadlineBadge";
import { PmoStepDocuments } from "@/components/pmo/PmoStepDocuments";
import type { ProjetPlanItemDocument } from "@/types/projet";
import { cn } from "@/lib/utils";

export default function AdminPmoPage() {
  const { projets, loading, fetchProjets, patchPlanItemPmo } = useProjets();
  const [projetId, setProjetId] = useState<string>("");
  const [docsByItem, setDocsByItem] = useState<Record<string, ProjetPlanItemDocument[]>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const selected = useMemo(
    () => projets.find((p) => p.id === projetId) ?? null,
    [projets, projetId]
  );

  const loadDocs = useCallback(async () => {
    if (!selected) {
      setDocsByItem({});
      return;
    }
    const ids = selected.plan_items.map((i) => i.id).filter(Boolean) as string[];
    const map = await fetchDocumentsByPlanItemIds(ids);
    setDocsByItem(map);
  }, [selected]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  useEffect(() => {
    if (!selected) return;
    const next: Record<string, string> = {};
    for (const item of selected.plan_items) {
      if (item.id) next[item.id] = item.commentaire ?? "";
    }
    setCommentDraft(next);
  }, [selected]);

  const saveComment = async (planItemId: string) => {
    setSavingId(planItemId);
    const { error } = await patchPlanItemPmo(planItemId, {
      commentaire: commentDraft[planItemId] ?? "",
    });
    setSavingId(null);
    if (!error) await fetchProjets();
  };

  const toggleDone = async (planItemId: string, done: boolean) => {
    await patchPlanItemPmo(planItemId, { pmo_step_completed: done });
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <LayoutDashboard className="text-primary" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">PMO — Suivi des étapes</h1>
          <p className="text-sm text-muted-foreground">
            Couleurs selon l’échéance (date de fin) : vert &gt; 3 j. avant, ambre sous 3 j., jaune jour J,
            rouge après.
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Légende</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            Plus de 3 jours avant l’échéance
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            Dans les 3 jours (avant le jour J)
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-yellow-400" />
            Même jour que l’échéance
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            Après l’échéance
          </span>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2 max-w-md">
          <Label>Projet</Label>
          <Select
            value={projetId || undefined}
            onValueChange={setProjetId}
            disabled={loading || projets.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={loading ? "Chargement…" : "Choisir un projet"} />
            </SelectTrigger>
            <SelectContent>
              {projets.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!loading && projets.length === 0 && (
          <p className="text-muted-foreground">Aucun projet. Créez-en un dans Gestion Projet.</p>
        )}

        {selected && (
          <div className="space-y-4">
            {selected.description && (
              <p className="text-sm text-muted-foreground">{selected.description}</p>
            )}
            {selected.plan_items.length === 0 ? (
              <p className="text-muted-foreground">Ce projet n’a pas encore de plan d’action.</p>
            ) : (
              selected.plan_items.map((item, idx) => {
                const id = item.id;
                if (!id) return null;
                const tone = getPmoDeadlineTone(item.date_fin);
                const range =
                  item.date_debut && item.date_fin
                    ? `${format(new Date(item.date_debut), "dd MMM yyyy", { locale: fr })} → ${format(
                        new Date(item.date_fin),
                        "dd MMM yyyy",
                        { locale: fr }
                      )}`
                    : item.date_fin
                      ? `Échéance : ${format(new Date(item.date_fin), "dd MMM yyyy", { locale: fr })}`
                      : null;
                return (
                  <Card
                    key={id}
                    className={cn("border-l-4 overflow-hidden", pmoToneClasses(tone))}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base font-semibold">
                            <span className="text-muted-foreground font-normal mr-2">#{idx + 1}</span>
                            {item.tache || "Tâche sans titre"}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {item.axe ? `Axe : ${item.axe}` : null}
                            {item.axe && item.responsable_name ? " · " : ""}
                            {item.responsable_name ? `Responsable : ${item.responsable_name}` : ""}
                            {range ? ` · ${range}` : ""}
                          </CardDescription>
                        </div>
                        <PmoDeadlineBadge tone={tone} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {item.livrable ? (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Livrable : </span>
                          {item.livrable}
                        </p>
                      ) : null}
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`done-${id}`}
                          checked={item.pmo_step_completed ?? false}
                          onCheckedChange={(v) => toggleDone(id, v === true)}
                        />
                        <Label htmlFor={`done-${id}`} className="text-sm font-normal cursor-pointer">
                          Étape terminée
                        </Label>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`comment-${id}`}>Commentaire PMO</Label>
                        <Textarea
                          id={`comment-${id}`}
                          value={commentDraft[id] ?? ""}
                          onChange={(e) =>
                            setCommentDraft((prev) => ({ ...prev, [id]: e.target.value }))
                          }
                          rows={3}
                          placeholder="Notes, blocages, décisions…"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => saveComment(id)}
                          disabled={savingId === id}
                        >
                          {savingId === id ? "Enregistrement…" : "Enregistrer le commentaire"}
                        </Button>
                      </div>
                      <div>
                        <Label className="mb-2 block">Documents</Label>
                        <PmoStepDocuments
                          planItemId={id}
                          documents={docsByItem[id] ?? []}
                          canMutate
                          onChanged={loadDocs}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
