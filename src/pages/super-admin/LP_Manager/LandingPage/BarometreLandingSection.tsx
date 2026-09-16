import { useQuery } from "@tanstack/react-query";
import { Building2, Loader2, MapPin, Sprout, UserRound, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fetchBarometreLandingStats, type BarometreLandingStats } from "@/lib/publicBarometreStats";
import { cn } from "@/lib/utils";
import { CartographieIllustration } from "./CartographieIllustration";

type BarometreLandingSectionProps = {
  /**
   * Dans l’aperçu « par section », le titre avec icône est déjà rendu au-dessus
   * (`SectionOutlineTitle`) : on masque le doublon.
   */
  hideMainTitle?: boolean;
};

type StatDef = {
  key: keyof BarometreLandingStats;
  label: string;
  Icon: LucideIcon;
  /** Couleur d’accent au survol (icône + chiffre) */
  hoverTone: string;
};

const STATS: StatDef[] = [
  {
    key: "cooperativesInscrites",
    label: "Coopératives inscrites",
    Icon: Building2,
    hoverTone: "group-hover:text-[#8f3119]",
  },
  {
    key: "cooperativesPresidentFemme",
    label: "Présidente femme",
    Icon: UserRound,
    hoverTone: "group-hover:text-[#c45c26]",
  },
  {
    key: "secteursActivite",
    label: "Secteurs d’activités",
    Icon: Sprout,
    hoverTone: "group-hover:text-[#2f6b4f]",
  },
  {
    key: "provincesCouvertes",
    label: "Provinces couvertes",
    Icon: MapPin,
    hoverTone: "group-hover:text-[#1e5a8a]",
  },
];

const descriptionParagraphs = [
  "La cartographie REMESS rassemble sur une carte interactive du Royaume les coopératives de l’économie sociale et solidaire : agriculture, artisanat, pêche, élevage, tourisme rural et bien d’autres filières.",
  "Explorez le territoire par province, identifiez les acteurs près de chez vous, consultez leurs activités et mesurez en un coup d’œil la densité du réseau coopératif marocain.",
];

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
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
          <p className="text-sm">Chargement des indicateurs…</p>
        </div>
      ) : isError || !data ? (
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-6">
            <CopyBlock hideMainTitle={hideMainTitle} />
            <p className="text-sm text-muted-foreground">
              Les chiffres de la cartographie ne sont pas disponibles pour le moment.
            </p>
            <Button asChild size="lg" className="min-w-[200px] rounded-full px-8">
              <Link to="/cartographie">Découvrir la cartographie</Link>
            </Button>
          </div>
          <CartographieIllustration className="w-full" />
        </div>
      ) : (
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col gap-8">
            <CopyBlock hideMainTitle={hideMainTitle} />

            <ul className="flex w-full flex-row items-stretch justify-between gap-1 sm:gap-2">
              {STATS.map(({ key, label, Icon, hoverTone }) => (
                <li
                  key={key}
                  className="group carto-stat-item flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 px-0.5 py-2 text-center sm:gap-2 sm:px-1 sm:py-3"
                >
                  <span
                    className={cn(
                      "inline-flex text-primary/85 transition-all duration-300 ease-out",
                      "group-hover:scale-110 group-hover:-rotate-6",
                      hoverTone,
                    )}
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" aria-hidden />
                  </span>
                  <p
                    className={cn(
                      "text-lg font-bold tabular-nums text-foreground transition-colors duration-300 sm:text-xl md:text-2xl",
                      hoverTone,
                    )}
                  >
                    {data[key]}
                  </p>
                  <p className="text-[0.6rem] font-semibold leading-snug text-muted-foreground transition-colors duration-300 group-hover:text-foreground sm:text-[0.7rem] md:text-xs">
                    {label}
                  </p>
                </li>
              ))}
            </ul>

            <div>
              <Button asChild size="lg" className="min-w-[200px] rounded-full px-8">
                <Link to="/cartographie">Découvrir la cartographie</Link>
              </Button>
            </div>
          </div>

          <CartographieIllustration className="w-full" />
        </div>
      )}
    </div>
  );
}

function CopyBlock({ hideMainTitle }: { hideMainTitle: boolean }) {
  return (
    <div className="space-y-3 text-left">
      {!hideMainTitle ? (
        <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Cartographie
        </h2>
      ) : null}
      <div className="space-y-3 text-pretty text-base leading-relaxed text-muted-foreground md:text-[1.05rem]">
        {descriptionParagraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </div>
  );
}
