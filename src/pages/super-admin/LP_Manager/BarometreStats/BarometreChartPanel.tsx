import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  BarometreChartType,
  BarometreColumn,
  BarometreDataRow,
} from "./barometreDatasetTypes";
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
  height?: number;
  className?: string;
  /** Masque les filtres (ex. carte compacte landing). */
  hideFilters?: boolean;
  /** Affiche les filtres uniquement après clic sur l’icône engrenage. */
  filtersBehindGear?: boolean;
  showDownload?: boolean;
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
  height = 280,
  className,
  hideFilters = false,
  filtersBehindGear = false,
  showDownload = true,
  toolbarExtra,
}: Props) {
  const [filters, setFilters] = useState<BarometreChartFilterState>(() =>
    buildDefaultChartFilters(columns, rows, yColumnIds),
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

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
    setFiltersOpen(false);
  }, [structureKey, columns, rows, yColumnIds]);

  const { filteredRows, activeYColumnIds } = useMemo(
    () => applyBarometreChartFilters(columns, rows, xColumnId, yColumnIds, filters),
    [columns, rows, xColumnId, yColumnIds, filters],
  );

  const showFilters =
    !hideFilters && (!filtersBehindGear || filtersOpen);

  return (
    <div className={cn("space-y-3", className)}>
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
          />
        ) : null}
        {toolbarExtra}
      </div>

      {showFilters ? (
        <BarometreChartColumnFilters
          columns={columns}
          rows={rows}
          filters={filters}
          onChange={setFilters}
        />
      ) : null}

      <BarometreFlexibleChart
        columns={columns}
        rows={filteredRows}
        xColumnId={xColumnId}
        yColumnIds={activeYColumnIds}
        chartType={chartType}
        height={height}
      />
    </div>
  );
}
