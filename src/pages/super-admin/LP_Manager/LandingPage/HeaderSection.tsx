import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ImageIcon, Menu, X } from "lucide-react";
import {
  LANDING_PAGE_SECTION_ANCHOR_ID,
  NAVIGABLE_LANDING_SECTION_LABELS,
  createDefaultNavIncludeSection,
} from "./landingPageSectionAnchors";
import { LANDING_VERTICAL_NAV_SECTIONS } from "./landingVerticalNavConfig";
import type { HeaderContent } from "../types";
import type { LandingPageSectionLabel } from "./landingPageSectionLabels";
import {
  createDefaultSectionVisibility,
  isLandingSectionVisible,
  type LandingSectionVisibilityMap,
} from "@/lib/lpLandingSectionVisibility";
import { usePublicLpSectionVisibility } from "@/hooks/usePublicLpSectionVisibility";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardPath } from "@/lib/supabase";
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
  /** Filtre le mega-menu Accueil et les liens d’ancrage selon la visibilité des sections. */
  sectionVisibility?: LandingSectionVisibilityMap;
};

const PUBLIC_SITE_NAV = [
  { to: "/", label: "Accueil", end: true, hasSectionsMenu: true },
  { to: "/events", label: "Events" },
  { to: "/bibliotheque", label: "Bibliothèque" },
  { to: "/cartographie", label: "Cartographie" },
  { to: "/barometre", label: "Baromètre" },
  { to: "/opportunites", label: "Opportunités" },
  { to: "/projets", label: "Projets" },
] as const;

type NavLayout = "inline" | "stacked";

function scrollToLandingSection(anchorId: string) {
  const el = document.getElementById(anchorId);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `/#${anchorId}`);
  return true;
}

function useGoToLandingSection(onNavigate?: () => void) {
  const location = useLocation();
  const navigate = useNavigate();

  return (anchorId: string) => {
    onNavigate?.();
    if (location.pathname === "/") {
      if (scrollToLandingSection(anchorId)) return;
    }
    navigate({ pathname: "/", hash: anchorId });
  };
}

function AccueilSectionsMegaMenu({
  onSelect,
  className,
  sectionVisibility,
}: {
  onSelect: (anchorId: string) => void;
  className?: string;
  sectionVisibility?: LandingSectionVisibilityMap;
}) {
  const visibility = sectionVisibility ?? createDefaultSectionVisibility();
  const items = LANDING_VERTICAL_NAV_SECTIONS.filter(({ sectionLabel }) =>
    isLandingSectionVisible(visibility, sectionLabel),
  );

  if (items.length === 0) return null;

  return (
    <div
      className={cn("grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3", className)}
      role="menu"
      aria-label="Sections de l’accueil"
    >
      {items.map(({ anchorId, label, icon: Icon }) => (
        <button
          key={anchorId}
          type="button"
          role="menuitem"
          onClick={() => onSelect(anchorId)}
          className="group/item flex items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted/60"
        >
          <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span className="underline-offset-4 group-hover/item:underline">{label}</span>
        </button>
      ))}
    </div>
  );
}

function AccueilNavItem({
  layout,
  onNavigate,
  menuOpen,
  onMenuOpenChange,
  sectionVisibility,
}: {
  layout: NavLayout;
  onNavigate?: () => void;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  sectionVisibility?: LandingSectionVisibilityMap;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const stacked = layout === "stacked";

  if (stacked) {
    return (
      <AccueilNavItemStacked
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        sectionVisibility={sectionVisibility}
      />
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => onMenuOpenChange?.(true)}
      onFocusCapture={() => onMenuOpenChange?.(true)}
    >
      <NavLink
        to="/"
        end
        onClick={onNavigate}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className={({ isActive }) =>
          cn(
            "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3",
            isActive || menuOpen
              ? "bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )
        }
      >
        Accueil
        <ChevronDown
          className={cn("h-3.5 w-3.5 opacity-70 transition-transform", menuOpen && "rotate-180")}
          aria-hidden
        />
      </NavLink>
    </div>
  );
}

function AccueilNavItemStacked({
  onNavigate,
  mobileOpen,
  setMobileOpen,
  sectionVisibility,
}: {
  onNavigate?: () => void;
  mobileOpen: boolean;
  setMobileOpen: Dispatch<SetStateAction<boolean>>;
  sectionVisibility?: LandingSectionVisibilityMap;
}) {
  const goToSection = useGoToLandingSection(onNavigate);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-stretch gap-1">
        <NavLink
          to="/"
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "min-w-0 flex-1 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )
          }
        >
          Accueil
        </NavLink>
        <button
          type="button"
          className="inline-flex h-auto w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Masquer les sections Accueil" : "Afficher les sections Accueil"}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", mobileOpen && "rotate-180")}
            aria-hidden
          />
        </button>
      </div>
      {mobileOpen ? (
        <div className="rounded-lg border border-border bg-muted/20 px-2 py-2">
          <AccueilSectionsMegaMenu
            onSelect={goToSection}
            className="grid-cols-1"
            sectionVisibility={sectionVisibility}
          />
        </div>
      ) : null}
    </div>
  );
}

function PublicSiteNavLinks({
  layout,
  className,
  onNavigate,
  accueilMenuOpen,
  onAccueilMenuOpenChange,
  sectionVisibility,
}: {
  layout: NavLayout;
  className?: string;
  onNavigate?: () => void;
  accueilMenuOpen?: boolean;
  onAccueilMenuOpenChange?: (open: boolean) => void;
  sectionVisibility?: LandingSectionVisibilityMap;
}) {
  const stacked = layout === "stacked";
  return (
    <nav
      className={cn(
        stacked
          ? "flex flex-col items-stretch gap-1"
          : "max-w-full flex-1 flex-wrap items-center justify-center gap-1 sm:gap-2 md:px-2",
        className,
      )}
      aria-label="Navigation du site"
    >
      {PUBLIC_SITE_NAV.map((item) => {
        if ("hasSectionsMenu" in item && item.hasSectionsMenu) {
          return (
            <AccueilNavItem
              key={item.to}
              layout={layout}
              onNavigate={onNavigate}
              menuOpen={accueilMenuOpen}
              onMenuOpenChange={onAccueilMenuOpenChange}
              sectionVisibility={sectionVisibility}
            />
          );
        }
        const { to, label, ...rest } = item;
        return (
          <NavLink
            key={`${to}-${label}`}
            to={to}
            end={"end" in rest && Boolean(rest.end)}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "rounded-md text-sm font-medium transition-colors",
                stacked ? "px-3 py-2.5" : "px-2.5 py-1.5 sm:px-3",
                isActive
                  ? "bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            {label}
          </NavLink>
        );
      })}
    </nav>
  );
}

function navLabelShort(label: LandingPageSectionLabel): string {
  if (label === "REMESS en chiffres") return "Chiffres";
  if (label === "À propos du REMESS") return "À propos";
  if (label === "Conseil Administrative REMESS") return "Conseil";
  if (label === "Équipe") return "Équipe";
  if (label === "Mot du président") return "Mot du président";
  if (label === "Contacter nous") return "Contact";
  return label;
}

function MemberSpaceButton({
  layout,
  className,
  hrefWhenLoggedOut = "/auth",
}: {
  layout: NavLayout;
  className?: string;
  hrefWhenLoggedOut?: string;
}) {
  const { user, profile, loading } = useAuth();
  const stacked = layout === "stacked";
  const isLoggedIn = Boolean(user && profile && profile.is_active !== false);
  const displayName =
    profile?.full_name?.trim() ||
    user?.email?.trim() ||
    null;
  const label =
    !loading && isLoggedIn && displayName ? displayName : "Espace Membre";
  const href = isLoggedIn && profile ? getDashboardPath(profile.role) : hrefWhenLoggedOut;

  return (
    <nav
      className={cn(
        "flex shrink-0",
        stacked
          ? "flex-col items-stretch gap-2"
          : "items-center justify-center gap-2 sm:justify-end md:ml-auto md:pl-2",
        className,
      )}
      aria-label="Espace membre"
    >
      <Link
        to={href}
        className={cn(
          "inline-flex h-9 max-w-[14rem] items-center justify-center truncate rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4",
          stacked && "w-full max-w-none",
        )}
        title={label}
      >
        {label}
      </Link>
    </nav>
  );
}

function LandingHashScroll() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/" || !location.hash) return;
    const id = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!id) return;
    const timer = window.setTimeout(() => {
      scrollToLandingSection(id);
    }, 50);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  return null;
}

export function HeaderSection({
  content,
  className,
  suppressSectionNav,
  showPublicSiteNav = false,
  positionMode = "sticky",
  sectionVisibility: sectionVisibilityProp,
}: HeaderSectionProps) {
  const hasLogo = content.showLogo && content.logoUrl.trim().length > 0;
  /** Sur le chrome public, toujours afficher Espace Membre (indépendamment du toggle CMS). */
  const showAuth = showPublicSiteNav || content.showAuthButtons;
  const hasLeft = content.showLogo || content.showTitle;
  const hasRight = showAuth;
  const mobileMenuId = useId();
  const { data: fetchedVisibility } = usePublicLpSectionVisibility();
  /** Sur le site public, prioriser le fetch dédié (évite un cache landing stale). */
  const visibility = showPublicSiteNav
    ? (fetchedVisibility ?? sectionVisibilityProp ?? createDefaultSectionVisibility())
    : (sectionVisibilityProp ?? fetchedVisibility ?? createDefaultSectionVisibility());
  const navMap = { ...createDefaultNavIncludeSection(), ...content.navIncludeSection };
  const navEntries = NAVIGABLE_LANDING_SECTION_LABELS.filter(
    (k) => navMap[k] && isLandingSectionVisible(visibility, k),
  ).map((k) => ({
    id: LANDING_PAGE_SECTION_ANCHOR_ID[k],
    label: navLabelShort(k),
    fullLabel: k,
  }));
  const hasNav = !suppressSectionNav && !showPublicSiteNav && navEntries.length > 0;
  const showMobileBurger = hasNav || showPublicSiteNav;

  const [scrollHidden, setScrollHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accueilMenuOpen, setAccueilMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const headerMeasureRef = useRef<HTMLElement | null>(null);
  const accueilCloseTimerRef = useRef<number | null>(null);
  const [viewportFixedSpacerPx, setViewportFixedSpacerPx] = useState(72);

  const scrollBehavior = content.scrollBehavior ?? "fixed";
  const goToLandingSection = useGoToLandingSection(() => {
    setAccueilMenuOpen(false);
    setMenuOpen(false);
  });

  const openAccueilMenu = () => {
    if (accueilCloseTimerRef.current != null) {
      window.clearTimeout(accueilCloseTimerRef.current);
      accueilCloseTimerRef.current = null;
    }
    setAccueilMenuOpen(true);
  };

  const scheduleCloseAccueilMenu = () => {
    if (accueilCloseTimerRef.current != null) {
      window.clearTimeout(accueilCloseTimerRef.current);
    }
    accueilCloseTimerRef.current = window.setTimeout(() => {
      setAccueilMenuOpen(false);
      accueilCloseTimerRef.current = null;
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (accueilCloseTimerRef.current != null) {
        window.clearTimeout(accueilCloseTimerRef.current);
      }
    };
  }, []);

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
  }, [positionMode, menuOpen]);

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
        setMenuOpen(false);
        setAccueilMenuOpen(false);
      } else if (delta < -10) {
        setScrollHidden(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollBehavior]);

  useEffect(() => {
    if (!menuOpen && !accueilMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setAccueilMenuOpen(false);
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (headerMeasureRef.current && !headerMeasureRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setAccueilMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen, accueilMenuOpen]);

  const memberSpaceHref =
    content.loginCta.href.trim() && content.loginCta.href.trim() !== "#"
      ? content.loginCta.href.trim()
      : "/auth";
  const closeMenu = () => setMenuOpen(false);

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

  const sectionNav = (layout: NavLayout, className?: string) =>
    hasNav ? (
      <nav
        className={cn(
          layout === "stacked"
            ? "flex flex-col items-stretch gap-1 text-sm"
            : "max-w-full flex-1 flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm",
          className,
        )}
        aria-label="Sections de la page"
      >
        {navEntries.map(({ id, label, fullLabel }) => (
          <a
            key={id}
            href={`#${id}`}
            title={fullLabel}
            onClick={closeMenu}
            className={cn(
              "transition-colors hover:text-primary",
              layout === "stacked"
                ? "rounded-md px-3 py-2.5 text-muted-foreground hover:bg-muted"
                : "whitespace-nowrap text-muted-foreground underline-offset-4 hover:underline",
            )}
          >
            {label}
          </a>
        ))}
      </nav>
    ) : null;

  const headerShell = (
    <header
      ref={headerMeasureRef}
      className={cn(
        "relative border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90",
        positionMode === "viewport-fixed"
          ? "fixed left-0 right-0 top-0 z-50 w-full"
          : "sticky top-0 z-40",
        scrollBehavior === "disappearing" &&
          "transition-transform duration-300 ease-out will-change-transform",
        scrollBehavior === "disappearing" && scrollHidden && "-translate-y-[calc(100%+1px)]",
        className,
      )}
      onMouseLeave={() => {
        if (showPublicSiteNav) scheduleCloseAccueilMenu();
      }}
    >
      {showPublicSiteNav ? <LandingHashScroll /> : null}
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 md:gap-3 lg:gap-4",
          hasLeft && !hasNav && !hasRight && !showPublicSiteNav && "md:justify-start",
          !hasLeft && !hasNav && hasRight && !showPublicSiteNav && "md:justify-end",
        )}
      >
        {hasLeft && (
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4 md:max-w-[min(100%,24rem)] md:flex-none">
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

        {showPublicSiteNav ? (
          <PublicSiteNavLinks
            layout="inline"
            className="hidden md:flex"
            sectionVisibility={visibility}
            accueilMenuOpen={accueilMenuOpen}
            onAccueilMenuOpenChange={(open) => {
              if (open) openAccueilMenu();
              else scheduleCloseAccueilMenu();
            }}
          />
        ) : null}

        {sectionNav("inline", "hidden border-t-0 md:flex")}

        {showAuth ? (
          <MemberSpaceButton
            hrefWhenLoggedOut={memberSpaceHref}
            layout="inline"
            className={cn(showMobileBurger && "ml-auto md:ml-auto")}
          />
        ) : null}

        {showMobileBurger ? (
          <button
            type="button"
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden",
              !showAuth && "ml-auto",
            )}
            aria-expanded={menuOpen}
            aria-controls={mobileMenuId}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        ) : null}
      </div>

      {showPublicSiteNav && accueilMenuOpen ? (
        <div
          className="absolute left-0 right-0 top-full z-[60] hidden w-full border-b border-border bg-popover text-popover-foreground shadow-lg md:block"
          onMouseEnter={openAccueilMenu}
          onMouseLeave={scheduleCloseAccueilMenu}
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Sections
            </p>
            <AccueilSectionsMegaMenu
              onSelect={goToLandingSection}
              className="sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
              sectionVisibility={visibility}
            />
          </div>
        </div>
      ) : null}

      {showMobileBurger && menuOpen ? (
        <div
          id={mobileMenuId}
          className="max-h-[min(70vh,28rem)] overflow-y-auto border-t border-border px-4 py-3 md:hidden"
        >
          {showPublicSiteNav ? (
            <PublicSiteNavLinks
              layout="stacked"
              onNavigate={closeMenu}
              sectionVisibility={visibility}
            />
          ) : null}
          {sectionNav("stacked")}
        </div>
      ) : null}
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
