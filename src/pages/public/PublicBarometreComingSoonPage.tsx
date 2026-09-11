import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import { BarometreChartCard } from "@/components/public/BarometreChartCard";
import { fetchPublishedBarometreDatasets } from "@/pages/super-admin/LP_Manager/BarometreStats/barometreDatasetsApi";

export default function PublicBarometreComingSoonPage() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["barometre-datasets-published"],
    queryFn: fetchPublishedBarometreDatasets,
    staleTime: 60_000,
  });

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
        ) : data.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Aucun graphique publié pour le moment.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((dataset) => (
              <li key={dataset.id}>
                <BarometreChartCard dataset={dataset} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </PublicShell>
  );
}
