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
import { Button } from "@/components/ui/button";
import {
  A_PROPOS_VALEUR_ICON_KEYS,
  DEFAULT_A_PROPOS_REMESS_CONTENT,
  isAProposValeurIconKey,
  type AProposRemessContent,
  type AProposValeurIconKey,
} from "../types";

const VALEUR_ICONS: Record<AProposValeurIconKey, LucideIcon> = {
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

type AProposRemessSectionProps = {
  content?: AProposRemessContent;
};

export function AProposRemessSection({
  content = DEFAULT_A_PROPOS_REMESS_CONTENT,
}: AProposRemessSectionProps) {
  const actionHref =
    content.missionActionKind === "link"
      ? content.missionActionHref.trim()
      : content.missionDocumentUrl.trim();
  const actionLabel = content.missionActionLabel.trim();
  const hasAction = actionLabel.length > 0 && actionHref.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14 lg:px-8">
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-5">
          {content.missionEyebrow.trim().length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {content.missionEyebrow.trim()}
            </p>
          )}
          <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {content.missionTitle.trim() || "Mission du REMESS"}
          </h2>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            {content.missionStatement.trim() ||
              "Ajoutez votre mission depuis l’éditeur « À propos du REMESS »."}
          </p>
          {hasAction ? (
            <Button asChild className="mt-2 w-fit gap-2">
              <a href={actionHref} target="_blank" rel="noopener noreferrer">
                {actionLabel}
              </a>
            </Button>
          ) : actionLabel.length > 0 ? (
            <Button type="button" disabled className="mt-2 w-fit">
              {actionLabel}
            </Button>
          ) : null}
        </div>

        <div className="space-y-5">
          <h3 className="text-center text-lg font-semibold text-foreground md:text-left md:text-xl">
            {content.valeursSectionTitle.trim() || "Nos Valeurs"}
          </h3>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:gap-5">
            {content.valeurs.map((v) => {
              const key = isAProposValeurIconKey(v.iconKey) ? v.iconKey : A_PROPOS_VALEUR_ICON_KEYS[0];
              const Icon = VALEUR_ICONS[key];
              return (
                <li key={v.id}>
                  <div className="group flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg md:p-5">
                    <div className="rounded-xl bg-primary/10 p-3 transition duration-200 group-hover:bg-primary/15 group-hover:scale-110">
                      <Icon
                        className="h-7 w-7 text-primary md:h-8 md:w-8"
                        aria-hidden
                        strokeWidth={1.75}
                      />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <p className="text-sm font-semibold text-foreground md:text-base">
                        {v.title.trim() || "Valeur"}
                      </p>
                      <p className="line-clamp-4 text-xs leading-snug text-muted-foreground md:text-sm">
                        {v.description.trim() || "—"}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
