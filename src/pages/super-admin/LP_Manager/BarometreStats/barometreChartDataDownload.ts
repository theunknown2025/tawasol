import * as XLSX from "xlsx";
import type { BarometreColumn, BarometreDataRow } from "./barometreDatasetTypes";

function cellToExport(value: string | number | null | undefined): string | number {
  if (value == null) return "";
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return String(value);
}

function slugifyFileName(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60);
  return base || "barometre";
}

/**
 * Télécharge les données affichées (après filtres) en CSV.
 */
export function downloadBarometreChartDataCsv(options: {
  fileName: string;
  columns: BarometreColumn[];
  rows: BarometreDataRow[];
}): void {
  const { fileName, columns, rows } = options;
  const header = columns.map((c) => c.label || c.id);
  const lines = [
    header.map(escapeCsv).join(";"),
    ...rows.map((row) =>
      columns.map((c) => escapeCsv(String(cellToExport(row.cells[c.id])))).join(";"),
    ),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  triggerDownload(blob, `${slugifyFileName(fileName)}.csv`);
}

/**
 * Télécharge les données affichées (après filtres) en Excel (.xlsx).
 */
export function downloadBarometreChartDataXlsx(options: {
  fileName: string;
  columns: BarometreColumn[];
  rows: BarometreDataRow[];
}): void {
  const { fileName, columns, rows } = options;
  const aoa: (string | number)[][] = [
    columns.map((c) => c.label || c.id),
    ...rows.map((row) => columns.map((c) => cellToExport(row.cells[c.id]))),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Données");
  const out = XLSX.write(book, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, `${slugifyFileName(fileName)}.xlsx`);
}

function escapeCsv(value: string): string {
  if (/[;"\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
