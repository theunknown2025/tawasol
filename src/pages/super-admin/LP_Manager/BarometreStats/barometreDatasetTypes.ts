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

export type BarometreDataset = {
  id: string;
  name: string;
  description: string;
  columns: BarometreColumn[];
  rows: BarometreDataRow[];
  x_column_id: string | null;
  y_column_ids: string[];
  chart_type: BarometreChartType;
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
  is_published: boolean;
  display_order?: number;
};

export const BAROMETRE_CHART_TYPE_OPTIONS: { value: BarometreChartType; label: string }[] = [
  { value: "bar", label: "Barres" },
  { value: "line", label: "Courbes" },
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
