import { useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  Loader2,
  MousePointerClick,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { filterBooksBySearch } from "./libraryListUtils";
import { fetchReviewAggregatesForBookIds } from "./libraryStatisticsApi";
import type { LibraryBook } from "./types";

function num(n: number | undefined): number {
  return typeof n === "number" && !Number.isNaN(n) ? n : 0;
}

function avgPerResource(total: number, resourceCount: number): number | null {
  if (resourceCount <= 0) return null;
  return total / resourceCount;
}

type LibraryStatisticsTabProps = {
  books: LibraryBook[];
};

export function LibraryStatisticsTab({ books }: LibraryStatisticsTabProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const filtered = useMemo(() => filterBooksBySearch(books, search), [books, search]);

  const selectedIds = useMemo(() => [...selected].sort(), [selected]);

  const { data: reviewAgg, isLoading: reviewsLoading } = useQuery({
    queryKey: ["library-stats-reviews", selectedIds.join(",")],
    queryFn: () => fetchReviewAggregatesForBookIds(selectedIds),
    enabled: selectedIds.length > 0,
  });

  const selectedBooks = useMemo(
    () => books.filter((b) => selected.has(b.id)),
    [books, selected],
  );

  const clicksTotal = selectedBooks.reduce((s, b) => s + num(b.click_count), 0);
  const downloadsTotal = selectedBooks.reduce((s, b) => s + num(b.download_count), 0);
  const n = selectedBooks.length;

  const clicksAvg = avgPerResource(clicksTotal, n);
  const downloadsAvg = avgPerResource(downloadsTotal, n);

  const toggle = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelected(new Set(filtered.map((b) => b.id)));
  };

  const clearSelection = () => setSelected(new Set());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Statistiques par sélection</h2>
          <p className="text-sm text-muted-foreground">
            Recherchez des ressources, cochez une ou plusieurs lignes, puis consultez totaux et moyennes
            (clics, téléchargements, évaluations).
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <Card className="flex-1 lg:max-w-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sélection</CardTitle>
            <CardDescription>
              {selected.size} ressource{selected.size > 1 ? "s" : ""} sélectionnée
              {selected.size > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher titre, auteur, mots-clés…"
                className="pl-9"
                aria-label="Filtrer les ressources pour la sélection"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={selectAllFiltered}>
                Tout sélectionner (filtré)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSelection}
                disabled={selected.size === 0}
                className="gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Effacer la sélection
              </Button>
            </div>
            <ScrollArea className="h-[min(22rem,50vh)] rounded-md border border-border">
              <ul className="divide-y divide-border p-1">
                {filtered.length === 0 ? (
                  <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                    Aucun résultat.
                  </li>
                ) : (
                  filtered.map((book) => {
                    const clicks = num(book.click_count);
                    const dls = num(book.download_count);
                    return (
                      <li key={book.id} className="flex items-start gap-3 px-2 py-2.5">
                        <Checkbox
                          id={`stat-sel-${book.id}`}
                          checked={selected.has(book.id)}
                          onCheckedChange={(v) => toggle(book.id, v === true)}
                          className="mt-0.5"
                          aria-labelledby={`stat-lbl-${book.id}`}
                        />
                        <Label
                          id={`stat-lbl-${book.id}`}
                          htmlFor={`stat-sel-${book.id}`}
                          className="min-w-0 flex-1 cursor-pointer text-left text-sm font-normal leading-snug"
                        >
                          <span className="font-medium text-foreground">{book.title}</span>
                          {book.author.trim() ? (
                            <span className="block text-xs text-muted-foreground">{book.author}</span>
                          ) : null}
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-muted-foreground">
                            <span
                              className="inline-flex items-center gap-1"
                              title="Chaque clic sur « Lire le document » ou « Voir la fiche » sur /bibliotheque"
                            >
                              <MousePointerClick className="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
                              <span className="font-medium text-foreground">{clicks}</span>
                              <span>clic{clicks !== 1 ? "s" : ""}</span>
                            </span>
                            <span className="inline-flex items-center gap-1" title="Téléchargements PDF (bouton Télécharger)">
                              <Download className="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
                              <span className="font-medium text-foreground">{dls}</span>
                              <span>tél.</span>
                            </span>
                          </div>
                        </Label>
                      </li>
                    );
                  })
                )}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MousePointerClick className="h-4 w-4" aria-hidden />
                <CardTitle className="text-sm font-medium">Clics</CardTitle>
              </div>
              <CardDescription>
                Boutons « Lire le document » / « Voir la fiche » sur la page publique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {n === 0 ? (
                <p className="text-sm text-muted-foreground">Sélectionnez au moins une ressource.</p>
              ) : (
                <>
                  <p className="text-2xl font-bold tabular-nums text-foreground">{clicksTotal}</p>
                  <p className="text-xs text-muted-foreground">Total sur la sélection</p>
                  <p className="text-lg font-semibold tabular-nums text-primary">
                    {clicksAvg !== null ? clicksAvg.toFixed(2) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Moyenne par ressource</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BarChart3 className="h-4 w-4" aria-hidden />
                <CardTitle className="text-sm font-medium">Téléchargements</CardTitle>
              </div>
              <CardDescription>Clics sur « Télécharger » (PDF)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {n === 0 ? (
                <p className="text-sm text-muted-foreground">Sélectionnez au moins une ressource.</p>
              ) : (
                <>
                  <p className="text-2xl font-bold tabular-nums text-foreground">{downloadsTotal}</p>
                  <p className="text-xs text-muted-foreground">Total sur la sélection</p>
                  <p className="text-lg font-semibold tabular-nums text-primary">
                    {downloadsAvg !== null ? downloadsAvg.toFixed(2) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Moyenne par ressource</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 xl:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Star className="h-4 w-4" aria-hidden />
                <CardTitle className="text-sm font-medium">Évaluations</CardTitle>
              </div>
              <CardDescription>Avis avec note (1–5) sur la sélection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {n === 0 ? (
                <p className="text-sm text-muted-foreground">Sélectionnez au moins une ressource.</p>
              ) : reviewsLoading ? (
                <div className="flex items-center gap-2 py-4 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  <span className="text-sm">Chargement des avis…</span>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {reviewAgg?.reviewCount ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Nombre total d’avis</p>
                  <p className="text-lg font-semibold tabular-nums text-primary">
                    {reviewAgg?.avgRating != null ? reviewAgg.avgRating.toFixed(2) + " / 5" : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Note moyenne (tous avis confondus)</p>
                  {n > 0 && reviewAgg && reviewAgg.reviewCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Moyenne d’avis par ressource sélectionnée :{" "}
                      <span className="font-medium text-foreground">
                        {(reviewAgg.reviewCount / n).toFixed(2)}
                      </span>
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {n > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Détail par ressource (sélection)</CardTitle>
            <CardDescription>
              Clics et téléchargements enregistrés pour chaque ressource cochée.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0 sm:px-6 sm:pb-6">
            <table className="w-full min-w-[280px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 sm:px-0">Ressource</th>
                  <th className="px-3 py-2 text-right tabular-nums">Clics</th>
                  <th className="px-4 py-2 text-right tabular-nums sm:pr-0">Téléchargements</th>
                </tr>
              </thead>
              <tbody>
                {selectedBooks.map((b) => (
                  <tr key={b.id} className="border-b border-border/80 last:border-0">
                    <td className="max-w-[12rem] truncate px-4 py-2.5 font-medium text-foreground sm:max-w-none sm:px-0 sm:whitespace-normal">
                      {b.title}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
                      {num(b.click_count)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-foreground sm:pr-0">
                      {num(b.download_count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
