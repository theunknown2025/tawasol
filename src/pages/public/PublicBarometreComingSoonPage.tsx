import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Maximize2, Minimize2 } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarometreChartPanel } from "@/pages/super-admin/LP_Manager/BarometreStats/BarometreChartPanel";
import { fetchPublishedBarometreDatasets } from "@/pages/super-admin/LP_Manager/BarometreStats/barometreDatasetsApi";
import type { BarometreDataset } from "@/pages/super-admin/LP_Manager/BarometreStats/barometreDatasetTypes";

/** Courte accroche pour la liste latérale. */
function shortDescription(text: string, maxChars = 90): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= maxChars) return t;
  const cut = t.slice(0, maxChars);
  const softer = cut.replace(/\s+\S*$/, "").trim();
  return `${softer || cut}…`;
}

export default function PublicBarometreComingSoonPage() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["barometre-datasets-published"],
    queryFn: fetchPublishedBarometreDatasets,
    staleTime: 60_000,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fullWidth, setFullWidth] = useState(false);

  useEffect(() => {
    if (data.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) => {
      if (prev && data.some((d) => d.id === prev)) return prev;
      return data[0]!.id;
    });
  }, [data]);

  const selected: BarometreDataset | null =
    data.find((d) => d.id === selectedId) ?? data[0] ?? null;

  return (
    <PublicShell>
      <PublicPageHero
        title="Baromètre"
        description="Indicateurs et statistiques du REMESS."
      />
      <main className="mx-auto flex w-full max-w-6xl flex-col px-4 py-8 md:px-8 md:py-10">
        <div className="mb-8">
          <PublicBreadcrumbs
            items={[
              { label: "Accueil", to: "/" },
              { label: "Baromètre" },
            ]}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            <span>Chargement des indicateurs…</span>
          </div>
        ) : isError ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Les indicateurs ne sont pas disponibles pour le moment.
          </p>
        ) : data.length === 0 || !selected ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Aucun graphique publié pour le moment.
          </p>
        ) : (
          <div
            className={cn(
              "grid gap-8 lg:gap-10",
              fullWidth
                ? "grid-cols-1"
                : "grid-cols-1 lg:grid-cols-[minmax(0,4fr)_minmax(0,1fr)]",
            )}
          >
            <section className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                {selected.name}
              </h2>
              {selected.description ? (
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {selected.description}
                </p>
              ) : null}

              <div className="mt-4">
                <BarometreChartPanel
                  key={selected.id}
                  title={selected.name}
                  columns={selected.columns}
                  rows={selected.rows}
                  xColumnId={selected.x_column_id}
                  yColumnIds={selected.y_column_ids}
                  chartType={selected.chart_type}
                  height={fullWidth ? 480 : 400}
                  filtersBehindGear
                  toolbarExtra={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setFullWidth((v) => !v)}
                      aria-label={
                        fullWidth
                          ? "Réduire l’affichage du graphique"
                          : "Afficher le graphique en pleine largeur"
                      }
                      title={fullWidth ? "Réduire" : "Plein écran (100 %)"}
                    >
                      {fullWidth ? (
                        <Minimize2 className="h-4 w-4" aria-hidden />
                      ) : (
                        <Maximize2 className="h-4 w-4" aria-hidden />
                      )}
                    </Button>
                  }
                />
              </div>
            </section>

            {!fullWidth ? (
              <aside className="min-w-0 lg:sticky lg:top-4 lg:self-start">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Graphiques
                </p>
                <ul className="divide-y divide-border border-y border-border">
                  {data.map((dataset) => {
                    const active = dataset.id === selected.id;
                    const teaser = shortDescription(dataset.description);
                    return (
                      <li key={dataset.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(dataset.id)}
                          className={cn(
                            "w-full py-3 text-left transition-colors",
                            active
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "block text-sm leading-snug",
                              active ? "font-semibold" : "font-medium",
                            )}
                          >
                            {dataset.name}
                          </span>
                          {teaser ? (
                            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                              {teaser}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>
            ) : null}
          </div>
        )}
      </main>
    </PublicShell>
  );
}
