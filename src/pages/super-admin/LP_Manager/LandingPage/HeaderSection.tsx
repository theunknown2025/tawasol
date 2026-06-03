import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
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
  /** Accueil / Bibliothèque / Événements sur la même ligne que le logo et les boutons d’action. */
  showPublicSiteNav?: boolean;
  /**
   * `sticky` : reste en haut du conteneur de défilement (éditeur, aperçus).
   * `viewport-fixed` : fixé à la fenêtre + bloc de retrait pour ne pas masquer le hero (accueil public).
   */
  positionMode?: "sticky" | "viewport-fixed";
};

const PUBLIC_SITE_NAV = [
  { to: "/", label: "Accueil", end: true },
  { to: "/events", label: "Events" },
  { to: "/bibliotheque", label: "Bibliothèque" },
  { to: "/cartographie", label: "Cartographie" },
  { to: "/barometre", label: "Baromètre" },
  { to: "/opportunites", label: "Opportunités" },
] as const;

function PublicSiteNavLinks() {
  return (
    <nav
      className="flex max-w-full flex-1 flex-wrap items-center justify-center gap-1 sm:gap-2 md:px-2"
      aria-label="Navigation du site"
    >
      {PUBLIC_SITE_NAV.map(({ to, label, ...rest }) => (
        <NavLink
          key={`${to}-${label}`}
          to={to}
          end={"end" in rest && rest.end}
          className={({ isActive }) =>
            cn(
              "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3",
              isActive
                ? "bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function navLabelShort(label: LandingPageSectionLabel): string {
  if (label === "REMESS en chiffres") return "Chiffres";
  if (label === "À propos du REMESS") return "À propos";
  if (label === "Équipe REMESS") return "Équipe";
  if (label === "Mot du président") return "Mot du président";
  if (label === "Contacter nous") return "Contact";
  return label;
}

export function HeaderSection({
  content,
  className,
  suppressSectionNav,
  showPublicSiteNav = false,
  positionMode = "sticky",
}: HeaderSectionProps) {
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
  const hasNav = !suppressSectionNav && !showPublicSiteNav && navEntries.length > 0;

  const [scrollHidden, setScrollHidden] = useState(false);
  const lastScrollY = useRef(0);
  const headerMeasureRef = useRef<HTMLElement | null>(null);
  const [viewportFixedSpacerPx, setViewportFixedSpacerPx] = useState(72);

  const scrollBehavior = content.scrollBehavior ?? "fixed";

  useLayoutEffect(() => {
    if (positionMode !== "viewport-fixed" || !headerMeasureRef.current) return;
    const el = headerMeasureRef.current;
    const measure = () => {
      setViewportFixedSpacerPx(Math.max(48, Math.ceil(el.getBoundingClientRect().height)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [positionMode]);

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

  if (!hasLeft && !hasRight && !hasNav && !showPublicSiteNav) {
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

  const headerShell = (
    <header
      ref={headerMeasureRef}
      className={cn(
        "border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90",
        positionMode === "viewport-fixed"
          ? "fixed left-0 right-0 top-0 z-50 w-full"
          : "sticky top-0 z-40",
        scrollBehavior === "disappearing" &&
          "transition-transform duration-300 ease-out will-change-transform",
        scrollBehavior === "disappearing" && scrollHidden && "-translate-y-[calc(100%+1px)]",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:gap-3 lg:gap-4",
          hasLeft && !hasNav && !hasRight && !showPublicSiteNav && "md:justify-start",
          !hasLeft && !hasNav && hasRight && !showPublicSiteNav && "md:justify-end",
        )}
      >
        {hasLeft && (
          <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-4 md:max-w-[min(100%,24rem)]">
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

        {showPublicSiteNav ? <PublicSiteNavLinks /> : null}

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
            className="flex shrink-0 items-center justify-center gap-2 sm:justify-end sm:gap-3 md:ml-auto md:pl-2"
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

  if (positionMode === "viewport-fixed") {
    return (
      <Fragment>
        {headerShell}
        <div aria-hidden className="shrink-0" style={{ height: viewportFixedSpacerPx }} />
      </Fragment>
    );
  }

  return headerShell;
}
