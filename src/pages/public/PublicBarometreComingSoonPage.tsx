import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { BarometreChartPanel } from "@/pages/super-admin/LP_Manager/BarometreStats/BarometreChartPanel";
import { fetchPublishedBarometreDatasets } from "@/pages/super-admin/LP_Manager/BarometreStats/barometreDatasetsApi";

function chartAnchorId(id: string) {
  return `barometre-chart-${id}`;
}

/** Distance from viewport top when the sidebar pins (≈ site header clearance). */
const SIDEBAR_PIN_TOP_PX = 96;

export default function PublicBarometreComingSoonPage() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["barometre-datasets-published"],
    queryFn: fetchPublishedBarometreDatasets,
    staleTime: 60_000,
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [openNav, setOpenNav] = useState<string[]>([]);

  const sidebarAnchorRef = useRef<HTMLElement>(null);
  const sidebarInnerRef = useRef<HTMLDivElement>(null);
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [sidebarBox, setSidebarBox] = useState({ left: 0, width: 280, height: 0 });

  const updateSidebarPin = useCallback(() => {
    const anchor = sidebarAnchorRef.current;
    const inner = sidebarInnerRef.current;
    if (!anchor || !inner) return;

    // Sidebar is hidden below lg — never pin on narrow viewports.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setSidebarPinned(false);
      return;
    }

    const anchorRect = anchor.getBoundingClientRect();
    const shouldPin = anchorRect.top <= SIDEBAR_PIN_TOP_PX;

    setSidebarBox({
      left: anchorRect.left,
      width: anchorRect.width,
      height: inner.offsetHeight,
    });
    setSidebarPinned(shouldPin);
  }, []);

  useEffect(() => {
    updateSidebarPin();
    window.addEventListener("scroll", updateSidebarPin, { passive: true });
    window.addEventListener("resize", updateSidebarPin);
    return () => {
      window.removeEventListener("scroll", updateSidebarPin);
      window.removeEventListener("resize", updateSidebarPin);
    };
  }, [updateSidebarPin, data.length]);

  const scrollToChart = useCallback((id: string) => {
    setActiveId(id);
    const el = document.getElementById(chartAnchorId(id));
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const onNavValueChange = (next: string[]) => {
    const newlyOpened = next.find((id) => !openNav.includes(id));
    setOpenNav(next);
    if (newlyOpened) scrollToChart(newlyOpened);
    // Accordion open/close changes height — refresh pin metrics next frame.
    requestAnimationFrame(updateSidebarPin);
  };

  return (
    <PublicShell>
      <PublicPageHero
        title="Baromètre"
        description="Indicateurs et statistiques du REMESS."
        contentMaxWidthClassName="max-w-[1600px]"
      />
      <main className="mx-auto flex w-full max-w-[100vw] flex-col px-3 py-8 sm:px-5 md:px-8 md:py-10 lg:px-10 xl:px-12">
        <div className="mb-8 max-w-[1600px]">
          <PublicBreadcrumbs
            items={[
              { label: "Accueil", to: "/" },
              { label: "Baromètre" },
            ]}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            <span>Chargement des indicateurs…</span>
          </div>
        ) : isError ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Les indicateurs ne sont pas disponibles pour le moment.
          </p>
        ) : data.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Aucun graphique publié pour le moment.
          </p>
        ) : (
          <div className="grid w-full gap-8 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] lg:gap-10 xl:gap-12">
            <aside
              ref={sidebarAnchorRef}
              className="relative hidden min-w-0 lg:block"
              style={
                sidebarPinned
                  ? { height: sidebarBox.height || undefined }
                  : undefined
              }
            >
              <div
                ref={sidebarInnerRef}
                className={cn(
                  "max-h-[calc(100vh-7rem)] overflow-y-auto",
                  sidebarPinned && "fixed z-10",
                )}
                style={
                  sidebarPinned
                    ? {
                        top: SIDEBAR_PIN_TOP_PX,
                        left: sidebarBox.left,
                        width: sidebarBox.width,
                      }
                    : undefined
                }
              >
                <div className="pr-2 sm:pr-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Graphiques
                  </p>
                  <Accordion
                    type="multiple"
                    value={openNav}
                    onValueChange={onNavValueChange}
                    className="w-full"
                  >
                    {data.map((dataset) => {
                      const isActive = dataset.id === activeId;
                      return (
                        <AccordionItem
                          key={dataset.id}
                          value={dataset.id}
                          className="border-border/60"
                        >
                          <AccordionTrigger
                            className={cn(
                              "py-3 text-left text-sm hover:no-underline",
                              isActive
                                ? "font-semibold text-foreground"
                                : "font-medium text-muted-foreground hover:text-foreground",
                            )}
                            onClick={() => scrollToChart(dataset.id)}
                          >
                            <span className="pr-2 leading-snug">{dataset.name}</span>
                          </AccordionTrigger>
                          <AccordionContent className="pb-3">
                            {dataset.description ? (
                              <p className="text-xs leading-relaxed text-muted-foreground">
                                {dataset.description}
                              </p>
                            ) : (
                              <p className="text-xs italic text-muted-foreground/80">
                                Aucune description.
                              </p>
                            )}
                            <button
                              type="button"
                              className="mt-2 text-xs font-medium text-primary underline-offset-2 hover:underline"
                              onClick={() => scrollToChart(dataset.id)}
                            >
                              Voir le graphique
                            </button>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
              </div>
            </aside>

            <div className="flex w-full min-w-0 flex-col gap-14 md:gap-16">
              {data.map((dataset, index) => (
                <section
                  key={dataset.id}
                  id={chartAnchorId(dataset.id)}
                  className="scroll-mt-24"
                  onMouseEnter={() => setActiveId(dataset.id)}
                  onFocusCapture={() => setActiveId(dataset.id)}
                >
                  <header className="mb-5 flex flex-col gap-1 sm:mb-6">
                    <div className="flex items-baseline gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                        {dataset.name}
                      </h2>
                    </div>
                    {dataset.description ? (
                      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:pl-9">
                        {dataset.description}
                      </p>
                    ) : null}
                  </header>

                  <BarometreChartPanel
                    title={dataset.name}
                    columns={dataset.columns}
                    rows={dataset.rows}
                    xColumnId={dataset.x_column_id}
                    yColumnIds={dataset.y_column_ids}
                    chartType={dataset.chart_type}
                    chartStyle={dataset.chart_style}
                    filtersBehindGear
                    filtersPlacement="aside"
                    downloadIconOnly
                  />
                </section>
              ))}
            </div>
          </div>
        )}
      </main>
    </PublicShell>
  );
}
