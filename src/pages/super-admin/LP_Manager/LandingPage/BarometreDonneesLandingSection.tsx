import { Building2, MapPinned, Sprout, Users, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarometreIllustration } from "./BarometreIllustration";

type Props = {
  hideMainTitle?: boolean;
};

type StatDef = {
  value: string;
  label: string;
  Icon: LucideIcon;
  hoverTone: string;
};

/** Chiffres clés du baromètre des coopératives marocaines (données 2025). */
const STATS: StatDef[] = [
  {
    value: "31 892",
    label: "Coopératives",
    Icon: Building2,
    hoverTone: "group-hover:text-[#8f3119]",
  },
  {
    value: "760 000",
    label: "Membres",
    Icon: Users,
    hoverTone: "group-hover:text-[#c45c26]",
  },
  {
    value: "10,8 Md",
    label: "CA estimé (MAD)",
    Icon: Sprout,
    hoverTone: "group-hover:text-[#2f6b4f]",
  },
  {
    value: "12",
    label: "Régions couvertes",
    Icon: MapPinned,
    hoverTone: "group-hover:text-[#1e5a8a]",
  },
];

const descriptionParagraphs = [
  "Le baromètre REMESS rassemble les indicateurs clés du secteur coopératif marocain : densités territoriales, filières d’activité, profils des membres et évolution du chiffre d’affaires.",
  "Des données pour mieux comprendre, valoriser et accompagner les coopératives — un levier de développement durable pour des territoires plus inclusifs.",
];

export function BarometreDonneesLandingSection({ hideMainTitle = false }: Props) {
  return (
    <div
      className={cn(
        "mx-auto max-w-6xl px-4 lg:px-8",
        hideMainTitle ? "pb-8 pt-0 md:pb-10" : "py-10 md:py-14",
      )}
    >
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-8">
          <CopyBlock hideMainTitle={hideMainTitle} />

          <ul className="flex w-full flex-row items-stretch justify-between gap-1 sm:gap-2">
            {STATS.map(({ value, label, Icon, hoverTone }) => (
              <li
                key={label}
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
                  {value}
                </p>
                <p className="text-[0.6rem] font-semibold leading-snug text-muted-foreground transition-colors duration-300 group-hover:text-foreground sm:text-[0.7rem] md:text-xs">
                  {label}
                </p>
              </li>
            ))}
          </ul>

          <div>
            <Button asChild size="lg" className="min-w-[220px] rounded-full px-8">
              <Link to="/barometre">Découvrir notre baromètre</Link>
            </Button>
          </div>
        </div>

        <BarometreIllustration className="w-full" />
      </div>
    </div>
  );
}

function CopyBlock({ hideMainTitle }: { hideMainTitle: boolean }) {
  return (
    <div className="space-y-3 text-left">
      {!hideMainTitle ? (
        <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Baromètre
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
