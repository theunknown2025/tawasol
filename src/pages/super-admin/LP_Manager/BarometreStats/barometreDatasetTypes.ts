export type BarometreColumnType = "text" | "number";

export type BarometreColumn = {
  id: string;
  label: string;
  type: BarometreColumnType;
};

export type BarometreDataRow = {
  id: string;
  cells: Record<string, string | number | null>;
  /** Ligne de total (exclue des graphiques). */
  isTotal?: boolean;
};

export type BarometreChartType = "bar" | "line" | "area" | "pie";

/** Color mode for X-axis filter legends (not chart data series). */
export type BarometreXFilterColorMode = "unique" | "multiple";

/**
 * Visual layout for a baromètre chart.
 * One layout per dataset; `isUniversal` applies the same layout to all charts.
 */
export type BarometreChartStyle = {
  backgroundColor: string;
  /** Chart height on the public page (px), clamped 400–1200. */
  chartHeight: number;
  xAxisFontSize: number;
  xAxisFontColor: string;
  yAxisFontSize: number;
  yAxisFontColor: string;
  /**
   * X filter legend colors:
   * - `multiple` — each filter value gets a distinct color
   * - `unique` — all filter values share one color
   */
  xFilterColorMode: BarometreXFilterColorMode;
  tooltipFontSize: number;
  tooltipFontColor: string;
  /** If true, this layout is applied to every baromètre chart on save. */
  isUniversal: boolean;
};

/** Fixed palette for chart data series (always multi-color by series index). */
export const DEFAULT_BAROMETRE_CHART_PALETTE = [
  "#1e3a5f",
  "#16a34a",
  "#f97316",
  "#0ea5e9",
  "#e11d48",
  "#eab308",
  "#14b8a6",
  "#3b82f6",
  "#a855f7",
  "#ef4444",
] as const;

/** Fixed palette for X filter legend swatches when mode is `multiple`. */
export const DEFAULT_BAROMETRE_FILTER_PALETTE = [
  "#1e3a5f",
  "#16a34a",
  "#f97316",
  "#0ea5e9",
  "#e11d48",
  "#eab308",
  "#14b8a6",
  "#3b82f6",
  "#a855f7",
  "#ef4444",
] as const;

export const BAROMETRE_CHART_HEIGHT_MIN = 400;
export const BAROMETRE_CHART_HEIGHT_MAX = 1200;
export const BAROMETRE_CHART_HEIGHT_DEFAULT = 420;

export function clampChartHeight(value: number): number {
  if (!Number.isFinite(value)) return BAROMETRE_CHART_HEIGHT_DEFAULT;
  return Math.min(
    BAROMETRE_CHART_HEIGHT_MAX,
    Math.max(BAROMETRE_CHART_HEIGHT_MIN, Math.round(value)),
  );
}

export function createDefaultChartStyle(): BarometreChartStyle {
  return {
    backgroundColor: "#ffffff",
    chartHeight: BAROMETRE_CHART_HEIGHT_DEFAULT,
    xAxisFontSize: 11,
    xAxisFontColor: "#64748b",
    yAxisFontSize: 11,
    yAxisFontColor: "#64748b",
    xFilterColorMode: "multiple",
    tooltipFontSize: 12,
    tooltipFontColor: "#0f172a",
    isUniversal: false,
  };
}

export function normalizeChartStyle(raw: unknown): BarometreChartStyle {
  const base = createDefaultChartStyle();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const o = raw as Record<string, unknown>;

  // Backward compat: older drafts stored `seriesColorMode`.
  const legacyMode = o.seriesColorMode === "unique" ? "unique" : o.seriesColorMode === "multiple" ? "multiple" : null;
  const xFilterColorMode: BarometreXFilterColorMode =
    o.xFilterColorMode === "unique" || o.xFilterColorMode === "multiple"
      ? o.xFilterColorMode
      : legacyMode ?? base.xFilterColorMode;

  return {
    backgroundColor:
      typeof o.backgroundColor === "string" && o.backgroundColor.trim()
        ? o.backgroundColor
        : base.backgroundColor,
    chartHeight:
      typeof o.chartHeight === "number" ? clampChartHeight(o.chartHeight) : base.chartHeight,
    xAxisFontSize:
      typeof o.xAxisFontSize === "number" && Number.isFinite(o.xAxisFontSize)
        ? Math.min(24, Math.max(8, Math.round(o.xAxisFontSize)))
        : base.xAxisFontSize,
    xAxisFontColor:
      typeof o.xAxisFontColor === "string" && o.xAxisFontColor.trim()
        ? o.xAxisFontColor
        : base.xAxisFontColor,
    yAxisFontSize:
      typeof o.yAxisFontSize === "number" && Number.isFinite(o.yAxisFontSize)
        ? Math.min(24, Math.max(8, Math.round(o.yAxisFontSize)))
        : base.yAxisFontSize,
    yAxisFontColor:
      typeof o.yAxisFontColor === "string" && o.yAxisFontColor.trim()
        ? o.yAxisFontColor
        : base.yAxisFontColor,
    xFilterColorMode,
    tooltipFontSize:
      typeof o.tooltipFontSize === "number" && Number.isFinite(o.tooltipFontSize)
        ? Math.min(24, Math.max(8, Math.round(o.tooltipFontSize)))
        : base.tooltipFontSize,
    tooltipFontColor:
      typeof o.tooltipFontColor === "string" && o.tooltipFontColor.trim()
        ? o.tooltipFontColor
        : base.tooltipFontColor,
    isUniversal: o.isUniversal === true,
  };
}

/** Chart data series color (fixed palette, independent of filter legend mode). */
export function resolveSeriesColor(_style: BarometreChartStyle | null | undefined, index: number): string {
  return DEFAULT_BAROMETRE_CHART_PALETTE[index % DEFAULT_BAROMETRE_CHART_PALETTE.length]!;
}

/** X filter legend swatch color. */
export function resolveXFilterLegendColor(
  mode: BarometreXFilterColorMode,
  index: number,
): string {
  if (mode === "unique") return DEFAULT_BAROMETRE_FILTER_PALETTE[0]!;
  return DEFAULT_BAROMETRE_FILTER_PALETTE[index % DEFAULT_BAROMETRE_FILTER_PALETTE.length]!;
}

export type BarometreDataset = {
  id: string;
  name: string;
  description: string;
  columns: BarometreColumn[];
  rows: BarometreDataRow[];
  x_column_id: string | null;
  y_column_ids: string[];
  chart_type: BarometreChartType;
  chart_style: BarometreChartStyle;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type BarometreDatasetInput = {
  name: string;
  description: string;
  columns: BarometreColumn[];
  rows: BarometreDataRow[];
  x_column_id: string | null;
  y_column_ids: string[];
  chart_type: BarometreChartType;
  chart_style: BarometreChartStyle;
  is_published: boolean;
  display_order?: number;
};

export const BAROMETRE_CHART_TYPE_OPTIONS: { value: BarometreChartType; label: string }[] = [
  { value: "bar", label: "Barres" },
  { value: "line", label: "Lignes" },
  { value: "area", label: "Aires" },
  { value: "pie", label: "Camembert" },
];

export function newColumnId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `col_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newRowId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyDatasetDraft(): Omit<BarometreDatasetInput, "is_published"> & {
  is_published: false;
} {
  const labelCol: BarometreColumn = {
    id: newColumnId(),
    label: "Secteur",
    type: "text",
  };
  const year = new Date().getFullYear();
  const yearCols: BarometreColumn[] = [year - 1, year].map((y) => ({
    id: newColumnId(),
    label: String(y),
    type: "number" as const,
  }));
  const columns = [labelCol, ...yearCols];
  return {
    name: "",
    description: "",
    columns,
    rows: [
      {
        id: newRowId(),
        cells: Object.fromEntries(columns.map((c) => [c.id, c.type === "number" ? 0 : ""])),
      },
    ],
    x_column_id: labelCol.id,
    y_column_ids: yearCols.map((c) => c.id),
    chart_type: "bar",
    chart_style: createDefaultChartStyle(),
    is_published: false,
  };
}

export function inferAxisDefaults(columns: BarometreColumn[]): {
  x_column_id: string | null;
  y_column_ids: string[];
} {
  const textCol = columns.find((c) => c.type === "text");
  const numberCols = columns.filter((c) => c.type === "number");
  return {
    x_column_id: textCol?.id ?? columns[0]?.id ?? null,
    y_column_ids: numberCols.map((c) => c.id),
  };
}
