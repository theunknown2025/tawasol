import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { slideBackgroundStyle, type HeroSlideBackground } from "@/pages/super-admin/LP_Manager/types";

/**
 * Hauteur identique sur la page publique et dans l’aperçu admin :
 * ratio 21:9 basé sur la largeur viewport, plafonnée à 42vh / 560px.
 */
export const OPPORTUNITY_BANNER_DISPLAY_CLASS =
  "relative w-full min-h-[200px] h-[min(560px,42vh,max(200px,calc(100vw*9/21)))] overflow-hidden bg-muted";

/** Pleine largeur viewport — même cadrage que `/opportunite/:slug`. */
export function OpportunityPublicBannerWidthShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative left-1/2 w-screen max-w-[100vw] shrink-0 -translate-x-1/2",
        className,
      )}
    >
      {children}
    </div>
  );
}

type OpportunityPublicBannerFrameProps = {
  banner: HeroSlideBackground;
  className?: string;
  children?: ReactNode;
};

export function OpportunityPublicBannerFrame({
  banner,
  className,
  children,
}: OpportunityPublicBannerFrameProps) {
  return (
    <div className={cn(OPPORTUNITY_BANNER_DISPLAY_CLASS, className)} style={slideBackgroundStyle(banner)}>
      {children}
    </div>
  );
}

type OpportunityPublicBannerHeroProps = {
  banner: HeroSlideBackground;
  typeLabel: string;
  title: string;
  titleClassName?: string;
};

/** Bannière publique + overlay titre (partagé page publique / aperçu). */
export function OpportunityPublicBannerHero({
  banner,
  typeLabel,
  title,
  titleClassName,
}: OpportunityPublicBannerHeroProps) {
  return (
    <OpportunityPublicBannerWidthShell>
      <OpportunityPublicBannerFrame banner={banner}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 py-10 text-center">
          <span className="mb-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            {typeLabel}
          </span>
          <h1
            className={cn(
              "max-w-4xl text-2xl font-bold text-white drop-shadow-md md:text-4xl",
              titleClassName,
            )}
          >
            {title}
          </h1>
        </div>
      </OpportunityPublicBannerFrame>
    </OpportunityPublicBannerWidthShell>
  );
}
