import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type LandingWaveVariant = "cream" | "warm" | "white" | "accent" | "deep";

const VARIANT_SURFACE: Record<LandingWaveVariant, string> = {
  cream: "lp-section-bg-cream lp-section-overlay-cream",
  warm: "lp-section-bg-warm lp-section-overlay-warm",
  white: "lp-section-bg-white lp-section-overlay-white",
  accent: "lp-section-bg-accent lp-section-overlay-accent",
  deep: "lp-section-bg-deep lp-section-overlay-deep",
};

type LandingWaveSectionProps = {
  id?: string;
  variant?: LandingWaveVariant;
  className?: string;
  children: ReactNode;
};

/** Bloc de section landing avec fond thématique. */
export function LandingWaveSection({
  id,
  variant = "cream",
  className,
  children,
}: LandingWaveSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative scroll-mt-[var(--page-header-height)]",
        VARIANT_SURFACE[variant],
        className,
      )}
    >
      <div className="relative z-[1]">{children}</div>
    </section>
  );
}
