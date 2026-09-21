import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  BarometreChartStyle,
  BarometreChartType,
  BarometreColumn,
  BarometreDataRow,
} from "./barometreDatasetTypes";
import { createDefaultChartStyle } from "./barometreDatasetTypes";
import {
  applyBarometreChartFilters,
  buildDefaultChartFilters,
  type BarometreChartFilterState,
} from "./barometreChartFilterUtils";
import { BarometreChartColumnFilters } from "./BarometreChartColumnFilters";
import { BarometreChartDownloadButton } from "./BarometreChartDownloadButton";
import { BarometreFlexibleChart } from "./BarometreFlexibleChart";

type Props = {
  title: string;
  columns: BarometreColumn[];
  rows: BarometreDataRow[];
  xColumnId: string | null;
  yColumnIds: string[];
  chartType: BarometreChartType;
  chartStyle?: BarometreChartStyle | null;
  /** Override chart height; defaults to `chartStyle.chartHeight` when set. */
  height?: number;
  className?: string;
  /** Masque les filtres (ex. carte compacte landing). */
  hideFilters?: boolean;
  /** Affiche les filtres uniquement après clic sur l’icône engrenage. */
  filtersBehindGear?: boolean;
  /**
   * `top` — filtres au-dessus du graphique.
   * `aside` — filtres à droite du graphique (accordéons).
   */
  filtersPlacement?: "top" | "aside";
  showDownload?: boolean;
  /** Bouton téléchargement en icône seule. */
  downloadIconOnly?: boolean;
  /** Contenu à droite de la barre d’outils (ex. plein écran). */
  toolbarExtra?: ReactNode;
};

export function BarometreChartPanel({
  title,
  columns,
  rows,
  xColumnId,
  yColumnIds,
  chartType,
  chartStyle,
  height,
  className,
  hideFilters = false,
  filtersBehindGear = false,
  filtersPlacement = "top",
  showDownload = true,
  downloadIconOnly = false,
  toolbarExtra,
}: Props) {
  const style = chartStyle ?? createDefaultChartStyle();
  const resolvedHeight = height ?? style.chartHeight;
  const [filters, setFilters] = useState<BarometreChartFilterState>(() =>
    buildDefaultChartFilters(columns, rows, yColumnIds),
  );
  const [filtersOpen, setFiltersOpen] = useState(
    () => filtersPlacement === "aside" || !filtersBehindGear,
  );

  const structureKey = useMemo(
    () =>
      `${columns.map((c) => `${c.id}:${c.label}:${c.type}`).join("|")}#${rows.length}#${yColumnIds.join(",")}#${rows
        .slice(0, 3)
        .map((r) => r.id)
        .join(",")}`,
    [columns, rows, yColumnIds],
  );

  useEffect(() => {
    setFilters(buildDefaultChartFilters(columns, rows, yColumnIds));
    setFiltersOpen(filtersPlacement === "aside" || !filtersBehindGear);
  }, [structureKey, columns, rows, yColumnIds, filtersBehindGear, filtersPlacement]);

  const { filteredRows, activeYColumnIds } = useMemo(
    () => applyBarometreChartFilters(columns, rows, xColumnId, yColumnIds, filters),
    [columns, rows, xColumnId, yColumnIds, filters],
  );

  const showFilters =
    !hideFilters && (!filtersBehindGear || filtersOpen);

  const filtersNode = showFilters ? (
    <BarometreChartColumnFilters
      columns={columns}
      rows={rows}
      filters={filters}
      onChange={setFilters}
      xFilterColorMode={style.xFilterColorMode}
      variant={filtersPlacement === "aside" ? "aside" : "grid"}
      className={
        filtersPlacement === "aside"
          ? "rounded-xl border border-border/80 bg-card/60 p-3 sm:p-4"
          : undefined
      }
    />
  ) : null;

  const toolbar = (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {!hideFilters && filtersBehindGear ? (
        <Button
          type="button"
          variant={filtersOpen ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-label={filtersOpen ? "Masquer les filtres" : "Afficher les filtres"}
          aria-pressed={filtersOpen}
          title="Filtres"
        >
          <Settings2 className="h-4 w-4" aria-hidden />
        </Button>
      ) : null}
      {showDownload ? (
        <BarometreChartDownloadButton
          fileName={title}
          columns={columns}
          rows={filteredRows}
          iconOnly={downloadIconOnly}
        />
      ) : null}
      {toolbarExtra}
    </div>
  );

  if (filtersPlacement === "aside") {
    return (
      <div className={cn("space-y-3", className)}>
        {toolbar}
        <div
          className={cn(
            "grid gap-5 lg:gap-6",
            showFilters
              ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]"
              : "grid-cols-1",
          )}
        >
          <div className="min-w-0 overflow-visible">
            <BarometreFlexibleChart
              columns={columns}
              rows={filteredRows}
              xColumnId={xColumnId}
              yColumnIds={activeYColumnIds}
              chartType={chartType}
              chartStyle={style}
              height={resolvedHeight}
            />
          </div>
          {filtersNode ? (
            <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
              {filtersNode}
            </aside>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {toolbar}
      {filtersNode}
      <BarometreFlexibleChart
        columns={columns}
        rows={filteredRows}
        xColumnId={xColumnId}
        yColumnIds={activeYColumnIds}
        chartType={chartType}
        chartStyle={style}
        height={resolvedHeight}
      />
    </div>
  );
}
