import { useEffect, useMemo, useState } from "react";
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
  showDownload?: boolean;
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
  showDownload = true,
}: Props) {
  const [filters, setFilters] = useState<BarometreChartFilterState>(() =>
    buildDefaultChartFilters(columns, rows, yColumnIds),
  );

  // Réinitialiser les filtres quand la structure / données changent fortement
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
  }, [structureKey, columns, rows, yColumnIds]);

  const { filteredRows, activeYColumnIds } = useMemo(
    () => applyBarometreChartFilters(columns, rows, xColumnId, yColumnIds, filters),
    [columns, rows, xColumnId, yColumnIds, filters],
  );

  return (
    <div className={cn("space-y-4", className)}>
      {!hideFilters ? (
        <BarometreChartColumnFilters
          columns={columns}
          rows={rows}
          filters={filters}
          onChange={setFilters}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {showDownload ? (
          <BarometreChartDownloadButton
            fileName={title}
            columns={columns}
            rows={filteredRows}
          />
        ) : null}
      </div>

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
