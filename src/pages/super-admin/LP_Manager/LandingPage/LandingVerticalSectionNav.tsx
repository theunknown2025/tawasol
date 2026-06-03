import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LANDING_VERTICAL_NAV_SECTIONS } from "./landingVerticalNavConfig";

function scrollToSection(anchorId: string) {
  const el = document.getElementById(anchorId);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function LandingVerticalSectionNav() {
  const [activeId, setActiveId] = useState<string | null>(
    LANDING_VERTICAL_NAV_SECTIONS[0]?.anchorId ?? null,
  );

  useEffect(() => {
    const elements = LANDING_VERTICAL_NAV_SECTIONS.map((s) =>
      document.getElementById(s.anchorId),
    ).filter((el): el is HTMLElement => el != null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.15, 0.4, 0.6] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-2 md:flex lg:right-5"
      aria-label="Navigation des sections"
    >
      {LANDING_VERTICAL_NAV_SECTIONS.map(({ anchorId, label, icon: Icon }) => {
        const active = activeId === anchorId;
        return (
          <button
            key={anchorId}
            type="button"
            onClick={() => scrollToSection(anchorId)}
            className="group flex items-center justify-end gap-2 outline-none"
            aria-label={`Aller à ${label}`}
            aria-current={active ? "true" : undefined}
          >
            <span
              className={cn(
                "flex max-w-0 items-center gap-2 overflow-hidden rounded-full border border-transparent bg-card/95 px-0 py-1.5 text-sm font-medium text-foreground opacity-0 shadow-md backdrop-blur transition-all duration-300 ease-out",
                "group-hover:max-w-[14rem] group-hover:border-border group-hover:px-3 group-hover:opacity-100",
                "group-focus-visible:max-w-[14rem] group-focus-visible:border-border group-focus-visible:px-3 group-focus-visible:opacity-100",
                active && "max-w-[14rem] border-border px-3 opacity-100",
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="truncate whitespace-nowrap">{label}</span>
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full bg-primary/35 ring-2 ring-background transition-all duration-300 ease-out",
                "h-2.5 w-2.5 group-hover:h-3.5 group-hover:w-3.5 group-hover:bg-primary",
                "group-focus-visible:h-3.5 group-focus-visible:w-3.5 group-focus-visible:bg-primary",
                active && "h-3.5 w-3.5 bg-primary",
              )}
              aria-hidden
            />
          </button>
        );
      })}
    </nav>
  );
}
