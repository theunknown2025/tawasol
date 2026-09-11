import * as XLSX from "xlsx";
import {
  newRowId,
  type BarometreColumn,
  type BarometreDataRow,
} from "./barometreDatasetTypes";

export type BarometreExcelImportResult = {
  rows: BarometreDataRow[];
  warnings: string[];
};

function normalizeHeader(v: unknown): string {
  return String(v ?? "")
    .replace(/\u00a0/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number" && Number.isFinite(v)) {
    return Number.isInteger(v) ? String(v) : String(v);
  }
  return String(v).replace(/\u00a0/g, " ").trim();
}

function parseNumber(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const raw = normalizeText(v).replace(/\s/g, "").replace(/,/g, "");
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function looksLikeTotal(label: string): boolean {
  return /^total\b/i.test(label) || /^t\.?\s*o\.?\s*t\.?\s*a\.?\s*l/i.test(label);
}

/**
 * Importe un classeur Excel dont la 1ʳᵉ ligne d’en-têtes doit correspondre
 * aux libellés des colonnes déjà définies (ordre libre).
 */
export function parseBarometreDatasetExcel(
  buffer: ArrayBuffer,
  columns: BarometreColumn[],
): BarometreExcelImportResult {
  if (columns.length === 0) {
    throw new Error("Définissez d’abord les colonnes avant d’importer un fichier Excel.");
  }

  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("Le fichier Excel ne contient aucune feuille.");

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: true,
  }) as unknown[][];

  if (!matrix.length) throw new Error("La feuille Excel est vide.");

  let headerRowIndex = -1;
  let headerCells: string[] = [];
  for (let i = 0; i < Math.min(matrix.length, 15); i++) {
    const row = matrix[i] ?? [];
    const cells = row.map(normalizeHeader);
    if (cells.some((c) => c.length > 0)) {
      headerRowIndex = i;
      headerCells = cells;
      break;
    }
  }
  if (headerRowIndex < 0) throw new Error("Impossible de trouver une ligne d’en-têtes.");

  const warnings: string[] = [];
  const colIndexById = new Map<string, number>();

  for (const col of columns) {
    const want = normalizeHeader(col.label);
    if (!want) {
      throw new Error(`La colonne « ${col.id} » n’a pas de libellé. Nommez toutes les colonnes.`);
    }
    const idx = headerCells.findIndex((h) => h === want);
    if (idx < 0) {
      throw new Error(
        `Colonne manquante dans Excel : « ${col.label} ». Le fichier doit contenir les mêmes en-têtes que vos colonnes.`,
      );
    }
    colIndexById.set(col.id, idx);
  }

  const expected = new Set(columns.map((c) => normalizeHeader(c.label)));
  const extras = headerCells.filter((h) => h && !expected.has(h));
  if (extras.length > 0) {
    warnings.push(
      `Colonnes Excel ignorées (non définies) : ${extras.slice(0, 8).join(", ")}${extras.length > 8 ? "…" : ""}`,
    );
  }

  const textCol = columns.find((c) => c.type === "text");
  const rows: BarometreDataRow[] = [];

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const raw = matrix[r] ?? [];
    const cells: Record<string, string | number | null> = {};
    let anyValue = false;

    for (const col of columns) {
      const idx = colIndexById.get(col.id)!;
      const cell = raw[idx];
      if (col.type === "number") {
        const n = parseNumber(cell);
        cells[col.id] = n;
        if (n !== 0 || normalizeText(cell) !== "") anyValue = true;
      } else {
        const t = normalizeText(cell);
        cells[col.id] = t;
        if (t) anyValue = true;
      }
    }

    if (!anyValue) continue;

    const label = textCol ? String(cells[textCol.id] ?? "") : "";
    rows.push({
      id: newRowId(),
      cells,
      isTotal: label ? looksLikeTotal(label) : false,
    });
  }

  if (rows.length === 0) {
    throw new Error("Aucune ligne de données trouvée sous les en-têtes.");
  }

  return { rows, warnings };
}
