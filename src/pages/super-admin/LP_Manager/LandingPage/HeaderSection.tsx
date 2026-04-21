import { useEffect, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import {
  LANDING_PAGE_SECTION_ANCHOR_ID,
  NAVIGABLE_LANDING_SECTION_LABELS,
  createDefaultNavIncludeSection,
} from "./landingPageSectionAnchors";
import type { HeaderContent } from "../types";
import type { LandingPageSectionLabel } from "./landingPageSectionLabels";
import { cn } from "@/lib/utils";

type HeaderSectionProps = {
  content: HeaderContent;
  className?: string;
  /** Masque les liens d’ancrage (ex. page autonome sans sections #). */
  suppressSectionNav?: boolean;
};

function navLabelShort(label: LandingPageSectionLabel): string {
  if (label === "REMESS en chiffres") return "Chiffres";
  if (label === "À propos du REMESS") return "À propos";
  if (label === "Équipe REMESS") return "Équipe";
  if (label === "Mot du président") return "Mot du président";
  if (label === "Contacter nous") return "Contact";
  return label;
}

export function HeaderSection({ content, className, suppressSectionNav }: HeaderSectionProps) {
  const hasLogo = content.showLogo && content.logoUrl.trim().length > 0;
  const showAuth = content.showAuthButtons;
  const hasLeft = content.showLogo || content.showTitle;
  const hasRight = showAuth;

  const navMap = { ...createDefaultNavIncludeSection(), ...content.navIncludeSection };
  const navEntries = NAVIGABLE_LANDING_SECTION_LABELS.filter((k) => navMap[k]).map((k) => ({
    id: LANDING_PAGE_SECTION_ANCHOR_ID[k],
    label: navLabelShort(k),
    fullLabel: k,
  }));
  const hasNav = !suppressSectionNav && navEntries.length > 0;

  const [scrollHidden, setScrollHidden] = useState(false);
  const lastScrollY = useRef(0);

  const scrollBehavior = content.scrollBehavior ?? "fixed";

  useEffect(() => {
    if (scrollBehavior !== "disappearing") {
      setScrollHidden(false);
      return;
    }
    lastScrollY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;
      if (y < 48) {
        setScrollHidden(false);
      } else if (delta > 10) {
        setScrollHidden(true);
      } else if (delta < -10) {
        setScrollHidden(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollBehavior]);

  const loginLabel = content.loginCta.label.trim() || "Connexion";
  const signLabel = content.signInCta.label.trim() || "S'inscrire";
  const loginHref = content.loginCta.href.trim() || "#";
  const signHref = content.signInCta.href.trim() || "#";

  if (!hasLeft && !hasRight && !hasNav) {
    return (
      <header
        className={cn(
          "border-b border-border bg-muted/20 px-4 py-3 text-center text-sm text-muted-foreground sm:px-6",
          className,
        )}
      >
        Aucun élément du header n’est affiché — activez le logo, le titre, la navigation ou les
        boutons dans l’éditeur.
      </header>
    );
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90",
        scrollBehavior === "disappearing" &&
          "transition-transform duration-300 ease-out will-change-transform",
        scrollBehavior === "disappearing" && scrollHidden && "-translate-y-[calc(100%+1px)]",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:gap-4",
          hasLeft && !hasNav && !hasRight && "md:justify-start",
          !hasLeft && !hasNav && hasRight && "md:justify-end",
        )}
      >
        {hasLeft && (
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4 md:flex-initial">
            {content.showLogo && (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40 sm:h-12 sm:w-12">
                {hasLogo ? (
                  <img
                    src={content.logoUrl}
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground/50" aria-hidden />
                )}
              </div>
            )}
            {content.showTitle && (
              <span
                className={cn(
                  "truncate text-lg font-bold tracking-tight sm:text-xl",
                  content.title.trim()
                    ? "text-foreground"
                    : "text-muted-foreground italic",
                )}
              >
                {content.title.trim() || "Titre"}
              </span>
            )}
          </div>
        )}

        {hasNav && (
          <nav
            className="flex max-w-full flex-1 flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-border/50 pt-2 text-sm md:border-t-0 md:pt-0"
            aria-label="Sections de la page"
          >
            {navEntries.map(({ id, label, fullLabel }) => (
              <a
                key={id}
                href={`#${id}`}
                title={fullLabel}
                className="whitespace-nowrap text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                {label}
              </a>
            ))}
          </nav>
        )}

        {showAuth && (
          <nav
            className="flex shrink-0 items-center justify-center gap-2 sm:justify-end sm:gap-3 md:ml-auto"
            aria-label="Actions de connexion"
          >
            <a
              href={loginHref}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4"
            >
              {loginLabel}
            </a>
            <a
              href={signHref}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4"
            >
              {signLabel}
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
