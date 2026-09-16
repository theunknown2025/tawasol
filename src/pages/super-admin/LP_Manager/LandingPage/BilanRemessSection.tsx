import { MapPinned, Users, UserRound, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BilanIllustration } from "./BilanIllustration";

type BilanRemessSectionProps = {
  hidePageTitle?: boolean;
};

type StatDef = {
  value: string;
  label: string;
  Icon: LucideIcon;
  hoverTone: string;
};

/** Chiffres d’impact du bilan REMESS 2021–2025. */
const STATS: StatDef[] = [
  {
    value: "1 250",
    label: "Coopératives accompagnées",
    Icon: Users,
    hoverTone: "group-hover:text-[#2f6b4f]",
  },
  {
    value: "28 000",
    label: "Bénéficiaires directs",
    Icon: Users,
    hoverTone: "group-hover:text-[#1e4a7a]",
  },
  {
    value: "68 %",
    label: "Femmes bénéficiaires",
    Icon: UserRound,
    hoverTone: "group-hover:text-[#c45c26]",
  },
  {
    value: "12",
    label: "Régions du Maroc",
    Icon: MapPinned,
    hoverTone: "group-hover:text-[#3d8b5a]",
  },
];

const descriptionParagraphs = [
  "Le bilan REMESS retrace nos réalisations et notre impact de 2021 à 2025 : un accompagnement croissant des coopératives résilientes au service d’un Maroc inclusif et durable.",
  "Des résultats concrets sur les territoires — filières agricoles, argan, plantes aromatiques, pêche, artisanat, élevage et écotourisme — avec une couverture nationale dans les 12 régions du Royaume.",
];

export function BilanRemessSection({ hidePageTitle = false }: BilanRemessSectionProps) {
  return (
    <div
      className={cn(
        "mx-auto max-w-6xl px-4 lg:px-8",
        hidePageTitle ? "pb-8 pt-0 md:pb-10" : "py-10 md:py-14",
      )}
    >
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-8">
          <CopyBlock hidePageTitle={hidePageTitle} />

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
            <Button asChild size="lg" className="min-w-[200px] rounded-full px-8">
              <Link to="/bilan-remess">Découvrir nos Bilans</Link>
            </Button>
          </div>
        </div>

        <BilanIllustration className="w-full" />
      </div>
    </div>
  );
}

function CopyBlock({ hidePageTitle }: { hidePageTitle: boolean }) {
  return (
    <div className="space-y-3 text-left">
      {!hidePageTitle ? (
        <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Bilan REMESS
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
