import { useQuery } from "@tanstack/react-query";
import { Building2, Loader2, MapPin, Sprout, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fetchBarometreLandingStats } from "@/lib/publicBarometreStats";
import { cn } from "@/lib/utils";

type BarometreLandingSectionProps = {
  /**
   * Dans l’aperçu « par section », le titre avec icône est déjà rendu au-dessus
   * (`SectionOutlineTitle`) : on masque le doublon.
   */
  hideMainTitle?: boolean;
};

const statCardClass =
  "flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md md:p-5";

export function BarometreLandingSection({ hideMainTitle = false }: BarometreLandingSectionProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["barometre-landing-stats"],
    queryFn: fetchBarometreLandingStats,
    staleTime: 60_000,
  });

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
            Cartographie
          </h2>
          <p className="mt-3 text-pretty text-base font-medium text-foreground md:text-lg">
            Découvrir et exploiter notre base de données de coopératives.
          </p>
          <p className="mt-2 text-pretty text-base text-muted-foreground md:text-lg">
            Vue d’ensemble des coopératives recensées sur la carte.
          </p>
        </header>
      ) : (
        <p className="mx-auto mb-8 max-w-2xl text-balance text-center text-base font-medium text-foreground md:mb-10 md:text-lg">
          Découvrir et exploiter notre base de données de coopératives.
        </p>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
          <p className="text-sm">Chargement des indicateurs…</p>
        </div>
      ) : isError || !data ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Les chiffres de la cartographie ne sont pas disponibles pour le moment.
        </p>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:gap-5">
            <li className={statCardClass}>
              <Building2 className="h-8 w-8 text-primary/90" aria-hidden />
              <p className="text-2xl font-bold tabular-nums text-foreground md:text-3xl">
                {data.cooperativesInscrites}
              </p>
              <p className="text-xs font-semibold leading-snug text-foreground sm:text-sm">
                Coopératives inscrites
              </p>
            </li>
            <li className={statCardClass}>
              <UserRound className="h-8 w-8 text-primary/90" aria-hidden />
              <p className="text-2xl font-bold tabular-nums text-foreground md:text-3xl">
                {data.cooperativesPresidentFemme}
              </p>
              <p className="text-xs font-semibold leading-snug text-foreground sm:text-sm">
                Présidente femme
              </p>
            </li>
            <li className={statCardClass}>
              <Sprout className="h-8 w-8 text-primary/90" aria-hidden />
              <p className="text-2xl font-bold tabular-nums text-foreground md:text-3xl">
                {data.secteursActivite}
              </p>
              <p className="text-xs font-semibold leading-snug text-foreground sm:text-sm">
                Secteurs d’activités
              </p>
            </li>
            <li className={statCardClass}>
              <MapPin className="h-8 w-8 text-primary/90" aria-hidden />
              <p className="text-2xl font-bold tabular-nums text-foreground md:text-3xl">
                {data.provincesCouvertes}
              </p>
              <p className="text-xs font-semibold leading-snug text-foreground sm:text-sm">
                Provinces couvertes
              </p>
            </li>
          </ul>
          <div className="mt-8 flex justify-center md:mt-10">
            <Button asChild size="lg" className="min-w-[200px] rounded-full px-8">
              <Link to="/cartographie">Découvrir la cartographie</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
