import {
  Award,
  Compass,
  Globe2,
  Handshake,
  Heart,
  Leaf,
  Lightbulb,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  A_PROPOS_VALEUR_ICON_KEYS,
  DEFAULT_REMESS_EN_CHIFFRES_CONTENT,
  isAProposValeurIconKey,
  type AProposValeurIconKey,
  type RemessEnChiffresContent,
} from "../types";

const STAT_ICONS: Record<AProposValeurIconKey, LucideIcon> = {
  heart: Heart,
  shield: Shield,
  lightbulb: Lightbulb,
  users: Users,
  handshake: Handshake,
  target: Target,
  leaf: Leaf,
  award: Award,
  sparkles: Sparkles,
  globe2: Globe2,
  trendingUp: TrendingUp,
  compass: Compass,
};

type RemessEnChiffresSectionProps = {
  content?: RemessEnChiffresContent;
  /**
   * Dans l’aperçu « par section », le titre avec icône est déjà rendu au-dessus
   * (`SectionOutlineTitle`) : on masque le doublon et on resserre l’espacement.
   */
  hideMainTitle?: boolean;
};

export function RemessEnChiffresSection({
  content = DEFAULT_REMESS_EN_CHIFFRES_CONTENT,
  hideMainTitle = false,
}: RemessEnChiffresSectionProps) {
  const subtitle = content.subtitle.trim();

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
            REMESS en chiffres
          </h2>
          {subtitle.length > 0 && (
            <p className="mt-3 text-pretty text-base text-muted-foreground md:text-lg">{subtitle}</p>
          )}
        </header>
      ) : (
        subtitle.length > 0 && (
          <p
            className={cn(
              "mx-auto mb-5 max-w-2xl text-center text-pretty text-base text-muted-foreground md:mb-6 md:text-lg",
              "-mt-2 md:-mt-3",
            )}
          >
            {subtitle}
          </p>
        )
      )}

      <ul
        className={cn(
          "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5",
          hideMainTitle && subtitle.length === 0 && "-mt-3 pt-0 md:-mt-5",
        )}
      >
        {content.stats.map((s) => {
          const key = isAProposValeurIconKey(s.iconKey) ? s.iconKey : A_PROPOS_VALEUR_ICON_KEYS[0];
          const Icon = STAT_ICONS[key];
          return (
            <li key={s.id}>
              <div className="group flex aspect-square flex-col items-center justify-between gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg md:p-5">
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground md:text-3xl">
                    {s.numberValue.trim() || "—"}
                  </p>
                  <p className="text-sm font-semibold text-foreground md:text-base">
                    {s.title.trim() || "Titre"}
                  </p>
                  <p className="line-clamp-3 text-xs leading-snug text-muted-foreground md:text-sm">
                    {s.description.trim() || "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-primary/10 p-2.5 transition duration-200 group-hover:scale-110 group-hover:bg-primary/15">
                  <Icon
                    className="h-6 w-6 text-primary md:h-7 md:w-7"
                    aria-hidden
                    strokeWidth={1.75}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
