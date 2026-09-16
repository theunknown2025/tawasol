import { useMemo, useState } from "react";
import {
  Download,
  Loader2,
  MousePointerClick,
  Search,
  Star,
  MessageSquare,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchBilanReviewAggregates } from "./bilanStatisticsApi";
import type { BilanDocument } from "./types";

function num(n: number | undefined): number {
  return typeof n === "number" && !Number.isNaN(n) ? n : 0;
}

function filterDocs(docs: BilanDocument[], search: string): BilanDocument[] {
  const q = search.trim().toLowerCase();
  if (!q) return docs;
  return docs.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      String(d.year).includes(q),
  );
}

type BilanStatisticsTabProps = {
  documents: BilanDocument[];
};

export function BilanStatisticsTab({ documents }: BilanStatisticsTabProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const filtered = useMemo(() => filterDocs(documents, search), [documents, search]);
  const selectedIds = useMemo(() => [...selected].sort(), [selected]);

  const { data: reviewAgg, isLoading: reviewsLoading } = useQuery({
    queryKey: ["bilan-stats-reviews", selectedIds.join(",")],
    queryFn: () => fetchBilanReviewAggregates(selectedIds),
    enabled: selectedIds.length > 0,
  });

  const selectedDocs = useMemo(
    () => documents.filter((d) => selected.has(d.id)),
    [documents, selected],
  );

  const clicksTotal = selectedDocs.reduce((s, d) => s + num(d.click_count), 0);
  const downloadsTotal = selectedDocs.reduce((s, d) => s + num(d.download_count), 0);
  const n = selectedDocs.length;

  const toggle = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Statistiques par sélection</h2>
        <p className="text-sm text-muted-foreground">
          Cochez un ou plusieurs bilans pour voir clics, téléchargements, commentaires et
          évaluations.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Bilans</CardTitle>
            <CardDescription>
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline"
                onClick={() => setSelected(new Set(filtered.map((d) => d.id)))}
              >
                Tout sélectionner
              </button>
              {" · "}
              <button
                type="button"
                className="text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => setSelected(new Set())}
              >
                Effacer
              </button>
            </CardDescription>
            <div className="relative pt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrer…"
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[22rem] pr-3">
              <ul className="space-y-2">
                {filtered.map((doc) => (
                  <li key={doc.id}>
                    <Label
                      htmlFor={`bilan-stat-${doc.id}`}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2 hover:bg-muted/40"
                    >
                      <Checkbox
                        id={`bilan-stat-${doc.id}`}
                        checked={selected.has(doc.id)}
                        onCheckedChange={(c) => toggle(doc.id, c === true)}
                        className="mt-0.5"
                      />
                      <span className="min-w-0">
                        <span className="block text-xs tabular-nums text-muted-foreground">
                          {doc.year}
                        </span>
                        <span className="block text-sm font-medium leading-snug">{doc.title}</span>
                      </span>
                    </Label>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {n === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Sélectionnez au moins un bilan pour afficher les indicateurs.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {n === 1 ? selectedDocs[0]?.title : `${n} bilans sélectionnés`}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Clics</CardTitle>
                    <MousePointerClick className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold tabular-nums">{clicksTotal}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Téléchargements
                    </CardTitle>
                    <Download className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold tabular-nums">{downloadsTotal}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Commentaires
                    </CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </CardHeader>
                  <CardContent>
                    {reviewsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <p className="text-2xl font-bold tabular-nums">
                        {reviewAgg?.reviewCount ?? 0}
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Évaluations
                    </CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </CardHeader>
                  <CardContent>
                    {reviewsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <p className="text-2xl font-bold tabular-nums">
                        {reviewAgg?.avgRating != null
                          ? `${reviewAgg.avgRating.toFixed(1)} / 5`
                          : "—"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
