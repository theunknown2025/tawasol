import type { BarometreColumn, BarometreDataRow } from "./barometreDatasetTypes";

/** Filtres interactifs du graphique : une entrée par colonne. */
export type BarometreChartFilterState = {
  /** Colonnes texte : valeurs autorisées (vide = aucune). */
  textSelected: Record<string, string[]>;
  /** Colonnes nombre : série visible sur le graphique. */
  numberEnabled: Record<string, boolean>;
};

export function buildDefaultChartFilters(
  columns: BarometreColumn[],
  rows: BarometreDataRow[],
  yColumnIds?: string[],
): BarometreChartFilterState {
  const textSelected: Record<string, string[]> = {};
  const numberEnabled: Record<string, boolean> = {};
  const ySet = yColumnIds && yColumnIds.length > 0 ? new Set(yColumnIds) : null;

  for (const col of columns) {
    if (col.type === "text") {
      const values = [
        ...new Set(
          rows
            .filter((r) => !r.isTotal)
            .map((r) => String(r.cells[col.id] ?? "").trim())
            .filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b, "fr"));
      textSelected[col.id] = values;
    } else {
      numberEnabled[col.id] = ySet ? ySet.has(col.id) : true;
    }
  }

  return { textSelected, numberEnabled };
}

export function applyBarometreChartFilters(
  columns: BarometreColumn[],
  rows: BarometreDataRow[],
  _xColumnId: string | null,
  _yColumnIds: string[],
  filters: BarometreChartFilterState,
): { filteredRows: BarometreDataRow[]; activeYColumnIds: string[] } {
  const textCols = columns.filter((c) => c.type === "text");

  const filteredRows = rows.filter((row) => {
    if (row.isTotal) return false;
    for (const col of textCols) {
      const allowed = filters.textSelected[col.id];
      if (!allowed) continue;
      const value = String(row.cells[col.id] ?? "").trim();
      if (!allowed.includes(value)) return false;
    }
    return true;
  });

  /** Toutes les colonnes nombre cochéessont des séries affichées. */
  const activeYColumnIds = columns
    .filter((c) => c.type === "number" && filters.numberEnabled[c.id] !== false)
    .map((c) => c.id);

  return { filteredRows, activeYColumnIds };
}

export function distinctTextValues(rows: BarometreDataRow[], columnId: string): string[] {
  return [
    ...new Set(
      rows
        .filter((r) => !r.isTotal)
        .map((r) => String(r.cells[columnId] ?? "").trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, "fr"));
}
