import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FolderKanban, Loader2, MapPinned, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchLpProjetsLandingStats } from "@/lib/lpProjetsApi";
import { cn } from "@/lib/utils";

type ProjetsLandingSectionProps = {
  hideMainTitle?: boolean;
};

const statCardClass =
  "flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md md:p-5";

export function ProjetsLandingSection({ hideMainTitle = false }: ProjetsLandingSectionProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["lp-projets-landing-stats"],
    queryFn: fetchLpProjetsLandingStats,
    staleTime: 60_000,
  });

  const isEmpty =
    !isLoading && !isError && data && data.projectCount === 0;

  if (isEmpty) return null;

  return (
    <div
      className={cn(
        "mx-auto max-w-6xl px-4 lg:px-8",
        hideMainTitle ? "pb-8 pt-0 md:pb-10" : "py-10 md:py-14",
      )}
    >
      {!hideMainTitle ? (
        <header className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Projets
          </h2>
          <p className="mt-3 text-pretty text-base text-muted-foreground md:text-lg">
            Nos actions sur le terrain et leurs réalisations.
          </p>
        </header>
      ) : (
        <p className="mx-auto mb-8 max-w-2xl text-balance text-center text-base text-muted-foreground md:mb-10 md:text-lg">
          Nos actions sur le terrain et leurs réalisations.
        </p>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
          <p className="text-sm">Chargement des indicateurs…</p>
        </div>
      ) : isError || !data ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Les chiffres des projets ne sont pas disponibles pour le moment.
        </p>
      ) : (
        <>
          <ul className="mx-auto grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-5">
            <li className={statCardClass}>
              <FolderKanban className="h-8 w-8 text-primary/90" aria-hidden />
              <p className="text-2xl font-bold tabular-nums text-foreground md:text-3xl">
                {data.projectCount}
              </p>
              <p className="text-xs font-semibold leading-snug text-foreground sm:text-sm">
                Projets
              </p>
            </li>
            <li className={statCardClass}>
              <MapPinned className="h-8 w-8 text-primary/90" aria-hidden />
              <p className="text-2xl font-bold tabular-nums text-foreground md:text-3xl">
                {data.zoneCount}
              </p>
              <p className="text-xs font-semibold leading-snug text-foreground sm:text-sm">
                Zones d’intervention
              </p>
            </li>
            <li className={statCardClass}>
              <Trophy className="h-8 w-8 text-primary/90" aria-hidden />
              <p className="text-2xl font-bold tabular-nums text-foreground md:text-3xl">
                {data.realisationCount}
              </p>
              <p className="text-xs font-semibold leading-snug text-foreground sm:text-sm">
                Réalisations
              </p>
            </li>
          </ul>
          <div className="mt-8 flex justify-center md:mt-10">
            <Button asChild className="gap-2">
              <Link to="/projets">
                Découvrir nos projets
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
