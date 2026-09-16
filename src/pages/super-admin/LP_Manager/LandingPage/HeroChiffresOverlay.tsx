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
  isAProposValeurIconKey,
  REMESS_CHIFFRES_STATS_MAX,
  type AProposValeurIconKey,
  type RemessEnChiffresContent,
} from "../types";
import { LANDING_PAGE_SECTION_ANCHOR_ID } from "./landingPageSectionAnchors";

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

type HeroChiffresOverlayProps = {
  content: RemessEnChiffresContent;
  className?: string;
};

/**
 * Cartes chiffres centrées sur le bas du hero.
 * Ancrées au bord inférieur, décalées de 50 % vers le bas pour chevaucher
 * légèrement la section suivante.
 */
export function HeroChiffresOverlay({ content, className }: HeroChiffresOverlayProps) {
  const stats = content.stats.slice(0, REMESS_CHIFFRES_STATS_MAX);
  if (stats.length === 0) return null;

  return (
    <div
      id={LANDING_PAGE_SECTION_ANCHOR_ID["REMESS en chiffres"]}
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-30 flex translate-y-1/2 justify-center px-3 sm:px-6",
        className,
      )}
    >
      <ul className="pointer-events-auto flex w-full max-w-5xl flex-wrap items-stretch justify-center gap-2 sm:gap-3">
        {stats.map((s) => {
          const key = isAProposValeurIconKey(s.iconKey) ? s.iconKey : A_PROPOS_VALEUR_ICON_KEYS[0];
          const Icon = STAT_ICONS[key];
          return (
            <li key={s.id} className="w-[calc(50%-0.25rem)] max-w-[9.75rem] sm:w-[9.5rem] lg:w-[8.75rem]">
              <div
                className={cn(
                  "group flex h-full w-full flex-col items-center justify-between gap-1.5 rounded-2xl border border-border/80 bg-card px-2.5 py-3 text-center shadow-lg sm:px-3 sm:py-3.5",
                  "transition-colors duration-200",
                  "hover:border-transparent hover:bg-[#8f3119] hover:text-white",
                )}
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-lg font-bold tabular-nums tracking-tight text-foreground transition-colors group-hover:text-white sm:text-xl">
                    {s.numberValue.trim() || "—"}
                  </p>
                  <p className="line-clamp-2 text-[0.7rem] font-semibold leading-snug text-foreground transition-colors group-hover:text-white sm:text-xs">
                    {s.title.trim() || "Titre"}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-1.5 transition-colors group-hover:bg-white/15">
                  <Icon
                    className="h-4 w-4 text-primary transition-colors group-hover:text-white"
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
