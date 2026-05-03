import * as XLSX from "xlsx";

export type BarometreBreakdownType = "region" | "sector";

export type ParsedBarometreRow = {
  categoryLabel: string;
  cooperatives: number;
  adherents: number;
};

export type ParsedBarometreWorkbook = {
  regions: ParsedBarometreRow[];
  sectors: ParsedBarometreRow[];
  warnings: string[];
};

function normalizeCell(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number" && Number.isFinite(v)) return String(Math.trunc(v));
  return String(v).replace(/\u00a0/g, " ").trim();
}

function parseIntFr(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
  const raw = normalizeCell(v).replace(/\s/g, "").replace(/,/g, "");
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function rowLooksLikeTotal(category: string): boolean {
  return /^total\b/i.test(category) || /^t\.?\s*o\.?\s*t\.?\s*a\.?\s*l/i.test(category);
}

type HeaderMatch = {
  breakdown: BarometreBreakdownType;
  catIdx: number;
  coopIdx: number;
  adhIdx: number;
};

function findHeaderInRow(row: unknown[]): Omit<HeaderMatch, "breakdown"> & { breakdown: BarometreBreakdownType | null } | null {
  const cells = row.map((c) => normalizeCell(c).toLowerCase());
  let coopIdx = -1;
  let adhIdx = -1;
  let breakdown: BarometreBreakdownType | null = null;

  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    if (!c) continue;
    if (c.includes("coopér") || c.includes("cooperat") || /^coop/i.test(c)) coopIdx = i;
    if (c.includes("adhér") || c.includes("adherent") || c.includes("adhérent")) adhIdx = i;
    if (c.includes("région") || c === "region" || c.includes("region")) breakdown = "region";
    if (c.includes("secteur") || c.includes("activit")) breakdown = "sector";
  }

  if (coopIdx < 0 || adhIdx < 0) return null;

  const used = new Set([coopIdx, adhIdx]);
  const catIdx = cells.findIndex((_, i) => !used.has(i) && normalizeCell(row[i]) !== "");
  const resolvedCat = catIdx >= 0 ? catIdx : 0;

  if (!breakdown) {
    const h0 = cells[resolvedCat] ?? "";
    if (h0.includes("région") || h0.includes("region")) breakdown = "region";
    else if (h0.includes("secteur") || h0.includes("activit")) breakdown = "sector";
  }

  return { breakdown, catIdx: resolvedCat, coopIdx, adhIdx };
}

function parseSheet(
  worksheet: XLSX.WorkSheet,
  forcedType: BarometreBreakdownType | null,
  sheetName: string,
): { type: BarometreBreakdownType; rows: ParsedBarometreRow[]; warning?: string } | null {
  const matrix = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: true,
  }) as unknown[][];

  let headerRow = -1;
  let match: HeaderMatch | null = null;

  for (let r = 0; r < Math.min(matrix.length, 25); r++) {
    const row = matrix[r];
    if (!Array.isArray(row) || row.length < 3) continue;
    const m = findHeaderInRow(row);
    if (m) {
      const breakdown = forcedType ?? m.breakdown;
      if (!breakdown) continue;
      headerRow = r;
      match = { breakdown, catIdx: m.catIdx, coopIdx: m.coopIdx, adhIdx: m.adhIdx };
      break;
    }
  }

  if (!match || headerRow < 0) {
    return null;
  }

  const out: ParsedBarometreRow[] = [];
  for (let r = headerRow + 1; r < matrix.length; r++) {
    const row = matrix[r];
    if (!Array.isArray(row)) continue;
    const cat = normalizeCell(row[match.catIdx]);
    if (!cat) continue;
    if (rowLooksLikeTotal(cat)) continue;

    const coop = parseIntFr(row[match.coopIdx]);
    const adh = parseIntFr(row[match.adhIdx]);
    if (coop == null && adh == null) continue;
    out.push({
      categoryLabel: cat,
      cooperatives: coop ?? 0,
      adherents: adh ?? 0,
    });
  }

  if (out.length === 0) {
    return {
      type: match.breakdown,
      rows: [],
      warning: `Feuille « ${sheetName} » : aucune ligne de données trouvée.`,
    };
  }

  return { type: match.breakdown, rows: out };
}

function inferForcedTypeFromSheetName(name: string): BarometreBreakdownType | null {
  const n = name.toLowerCase();
  if (n.includes("région") || n.includes("region")) return "region";
  if (n.includes("secteur") || n.includes("activ") || n.includes("sector")) return "sector";
  return null;
}

/**
 * Parse un classeur Excel : une ou plusieurs feuilles avec colonnes catégorie / coopératives / adhérents.
 * Deux feuilles sans en-tête explicite : 1ʳᵉ = régions, 2ᵉ = secteurs (heuristique).
 */
export function parseBarometreWorkbook(buffer: ArrayBuffer): ParsedBarometreWorkbook {
  const warnings: string[] = [];
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetNames = workbook.SheetNames.filter((n) => !n.startsWith("_"));

  if (sheetNames.length === 0) {
    return { regions: [], sectors: [], warnings: ["Aucune feuille dans le fichier."] };
  }

  let regions: ParsedBarometreRow[] = [];
  let sectors: ParsedBarometreRow[] = [];

  const parsed: { type: BarometreBreakdownType; rows: ParsedBarometreRow[]; name: string }[] = [];

  for (let i = 0; i < sheetNames.length; i++) {
    const name = sheetNames[i];
    const ws = workbook.Sheets[name];
    if (!ws) continue;

    let forced: BarometreBreakdownType | null = inferForcedTypeFromSheetName(name);
    if (!forced && sheetNames.length === 2) {
      forced = i === 0 ? "region" : "sector";
    }

    const result = parseSheet(ws, forced, name);
    if (!result) {
      warnings.push(`Feuille « ${name} » : en-têtes (région/secteur, coopératives, adhérents) introuvables.`);
      continue;
    }
    if (result.warning) warnings.push(result.warning);
    parsed.push({ type: result.type, rows: result.rows, name });
  }

  for (const p of parsed) {
    if (p.type === "region") {
      if (regions.length > 0) warnings.push(`Plusieurs feuilles région : fusion de « ${p.name} ».`);
      regions = regions.concat(p.rows);
    } else {
      if (sectors.length > 0) warnings.push(`Plusieurs feuilles secteur : fusion de « ${p.name} ».`);
      sectors = sectors.concat(p.rows);
    }
  }

  if (regions.length === 0) warnings.push("Aucune donnée « par région » détectée.");
  if (sectors.length === 0) warnings.push("Aucune donnée « par secteur / activité » détectée.");

  return { regions, sectors, warnings };
}
