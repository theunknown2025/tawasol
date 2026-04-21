import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useProjets } from "@/hooks/useProjets";
import { getPmoDeadlineTone, pmoToneClasses } from "@/lib/pmoUtils";
import { PmoDeadlineBadge } from "@/components/pmo/PmoDeadlineBadge";
import type { ProjetWithPlan } from "@/types/projet";
import { cn } from "@/lib/utils";

function projetProgress(p: ProjetWithPlan) {
  const items = p.plan_items.filter((i) => i.id);
  const total = items.length;
  const done = items.filter((i) => i.pmo_step_completed).length;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

export default function PMOPage() {
  const { projets, loading } = useProjets();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => (selectedId ? projets.find((p) => p.id === selectedId) ?? null : null),
    [projets, selectedId]
  );

  const globalProgress = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const p of projets) {
      for (const item of p.plan_items) {
        if (!item.id) continue;
        total++;
        if (item.pmo_step_completed) done++;
      }
    }
    return {
      total,
      done,
      pct: total ? Math.round((done / total) * 100) : 0,
    };
  }, [projets]);

  if (selected) {
    const { total, done, pct } = projetProgress(selected);
    return (
      <div className="p-8">
        <div className="flex flex-wrap items-start gap-4 mb-6">
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setSelectedId(null)}>
            <ArrowLeft className="h-4 w-4" />
            Retour aux projets
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">{selected.nom}</h1>
            {selected.description ? (
              <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
            ) : null}
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardDescription>Progression du projet</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{pct}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={pct} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {done} / {total} étape{total === 1 ? "" : "s"} terminée{total === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Étapes</CardTitle>
            <CardDescription>Avancement et commentaires PMO (lecture seule).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected.plan_items.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune étape dans ce projet.</p>
            ) : (
              selected.plan_items.map((item, idx) => {
                if (!item.id) return null;
                const tone = getPmoDeadlineTone(item.date_fin);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-lg border border-border p-4 space-y-3 border-l-4",
                      pmoToneClasses(tone)
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          <span className="text-muted-foreground font-normal mr-2">#{idx + 1}</span>
                          {item.tache || "Sans titre"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.axe ? `${item.axe} · ` : ""}
                          {item.responsable_name || "Sans responsable"}
                          {item.date_fin
                            ? ` · Échéance ${format(new Date(item.date_fin), "dd/MM/yyyy", { locale: fr })}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <PmoDeadlineBadge tone={tone} />
                        {item.pmo_step_completed ? (
                          <span className="text-xs font-medium text-emerald-600">Terminée</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">En cours</span>
                        )}
                      </div>
                    </div>
                    {item.livrable ? (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Livrable : </span>
                        {item.livrable}
                      </p>
                    ) : null}
                    <div className="rounded-md bg-background/80 border border-border/60 px-3 py-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Commentaire PMO</p>
                      <p className="text-sm whitespace-pre-wrap">
                        {item.commentaire?.trim() ? item.commentaire : "—"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-amber-500/10">
          <LayoutDashboard className="text-amber-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">PMO — Pilotage</h1>
          <p className="text-muted-foreground">
            Vue synthétique : ouvrez un projet pour voir la progression et les commentaires de chaque étape.
          </p>
        </div>
      </div>

      <Card className="mb-6 max-w-md">
        <CardHeader className="pb-2">
          <CardDescription>Progression globale (tous projets)</CardDescription>
          <CardTitle className="text-3xl tabular-nums">{globalProgress.pct}%</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={globalProgress.pct} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {globalProgress.done} / {globalProgress.total} étape{globalProgress.total === 1 ? "" : "s"} ·{" "}
            {projets.length} projet{projets.length === 1 ? "" : "s"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projets</CardTitle>
          <CardDescription>Cliquez sur une ligne pour le détail des étapes.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : projets.length === 0 ? (
            <p className="text-muted-foreground">Aucun projet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projet</TableHead>
                  <TableHead className="text-right w-[100px]">Étapes</TableHead>
                  <TableHead className="w-[200px] min-w-[180px]">Progression</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projets.map((p) => {
                  const { total, done, pct } = projetProgress(p);
                  return (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedId(p.id)}
                    >
                      <TableCell>
                        <div className="font-medium">{p.nom}</div>
                        {p.description ? (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 max-w-xl">
                            {p.description}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {done}/{total}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground tabular-nums w-9">{pct}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
