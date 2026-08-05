import {
  emptyEvaluation,
  EVALUATION_CRITERIA,
  EVALUATION_SCORE_MAX,
  EVALUATION_SCORE_MIN,
  type CooperativeEvaluation,
  type EvaluationCriterionKey,
} from "./barometreEvaluation";
import { normalizeCooperativeLatLng, parseCoordValue } from "./barometreCoords";
import {
  MAX_COOP_PHONES,
  type InsertBarometreCooperativeInput,
  type PresidentGenre,
} from "./barometreCooperativesApi";
import { isValidMoroccoPhone, sanitizeMoroccoPhoneInput } from "./barometrePhone";

/** En-têtes CSV — même ordre que le formulaire « Ajouter une coopérative ». */
export const COOP_CSV_COLUMNS = [
  // Coopérative
  { key: "nom", label: "nom" },
  { key: "telephones", label: "telephones" },
  { key: "email", label: "email" },
  // Adresse
  { key: "longitude_x", label: "longitude_x" },
  { key: "latitude_y", label: "latitude_y" },
  { key: "province", label: "province" },
  { key: "commune", label: "commune" },
  { key: "adresse", label: "adresse" },
  // Président(e)
  { key: "president_genre", label: "president_genre" },
  { key: "president_nom", label: "president_nom" },
  { key: "president_email", label: "president_email" },
  { key: "president_tel", label: "president_tel" },
  // Secteur
  { key: "secteur", label: "secteur" },
  { key: "sous_secteur", label: "sous_secteur" },
  { key: "description", label: "description" },
  // Coordonnées générales
  { key: "temps_de_travail", label: "temps_de_travail" },
  { key: "facebook", label: "facebook" },
  { key: "instagram", label: "instagram" },
  // Publication
  { key: "publier", label: "publier" },
  // Évaluation coopérative
  ...EVALUATION_CRITERIA.map((c) => ({
    key: `eval_${c.key}` as const,
    label: `eval_${c.key}`,
  })),
] as const;

export type CoopCsvColumnKey = (typeof COOP_CSV_COLUMNS)[number]["key"];

const TEMPLATE_EXAMPLE: Record<string, string> = {
  nom: "Coopérative Exemple",
  telephones: "0612345678;0698765432",
  email: "contact@exemple.ma",
  longitude_x: "-8.03",
  latitude_y: "31.51",
  province: "Marrakech",
  commune: "Marrakech",
  adresse: "Rue Exemple, quartier",
  president_genre: "female",
  president_nom: "Fatima Alaoui",
  president_email: "president@exemple.ma",
  president_tel: "0611223344",
  secteur: "Agriculture et élevage",
  sous_secteur: "Maraîchage",
  description: "Présentation courte",
  temps_de_travail: "Temps plein",
  facebook: "https://facebook.com/exemple",
  instagram: "@exemple",
  publier: "non",
  eval_gouvernance: "3",
  eval_conditions_travail: "4",
  eval_developpement_personnel: "",
  eval_transparence: "3",
  eval_ancrage_territorial: "",
  eval_intercooperation: "",
  eval_performance_economique: "4",
  eval_communication_externe: "",
  eval_approche_genre: "5",
  eval_durabilite_environnementale: "",
  eval_innovation: "3",
};

function escapeCsvCell(value: string, delimiter: string): string {
  const needsQuotes =
    value.includes(delimiter) || value.includes('"') || value.includes("\n") || value.includes("\r");
  if (!needsQuotes) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildCoopCsvTemplate(delimiter = ";"): string {
  const headers = COOP_CSV_COLUMNS.map((c) => c.label);
  const row = COOP_CSV_COLUMNS.map((c) => escapeCsvCell(TEMPLATE_EXAMPLE[c.label] ?? "", delimiter));
  // BOM for Excel UTF-8
  return `\uFEFF${headers.join(delimiter)}\n${row.join(delimiter)}\n`;
}

export function downloadCoopCsvTemplate(): void {
  const csv = buildCoopCsvTemplate(";");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "barometre_cooperatives_template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function detectDelimiter(headerLine: string): "," | ";" {
  const commas = (headerLine.match(/,/g) ?? []).length;
  const semis = (headerLine.match(/;/g) ?? []).length;
  return semis > commas ? ";" : ",";
}

/** Parse CSV with quotes ; or , delimiter. */
export function parseCsvText(text: string): { headers: string[]; rows: string[][] } {
  const cleaned = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(lines[0]!);

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        cells.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    return cells;
  };

  const headers = parseLine(lines[0]!).map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

const HEADER_ALIASES: Record<string, CoopCsvColumnKey> = {
  nom: "nom",
  nom_cooperative: "nom",
  secteur: "secteur",
  activite: "secteur",
  sous_secteur: "sous_secteur",
  soussecteur: "sous_secteur",
  telephones: "telephones",
  telephone: "telephones",
  tel: "telephones",
  phones: "telephones",
  email: "email",
  adresse: "adresse",
  adresse_exacte: "adresse",
  province: "province",
  commune: "commune",
  longitude_x: "longitude_x",
  longitude: "longitude_x",
  x: "longitude_x",
  latitude_y: "latitude_y",
  latitude: "latitude_y",
  y: "latitude_y",
  description: "description",
  facebook: "facebook",
  instagram: "instagram",
  temps_de_travail: "temps_de_travail",
  president_genre: "president_genre",
  genre_president: "president_genre",
  president_nom: "president_nom",
  nom_president: "president_nom",
  president_email: "president_email",
  email_president: "president_email",
  president_tel: "president_tel",
  tel_president: "president_tel",
  publier: "publier",
  is_published: "publier",
  ...Object.fromEntries(
    EVALUATION_CRITERIA.map((c) => [`eval_${c.key}`, `eval_${c.key}` as CoopCsvColumnKey]),
  ),
};

export type CoopCsvPreviewRow = {
  rowIndex: number;
  /** Affichage table */
  display: {
    nom: string;
    secteur: string;
    sousSecteur: string;
    telephones: string;
    email: string;
    adresse: string;
    province: string;
    commune: string;
    longitude: string;
    latitude: string;
    publier: string;
  };
  errors: string[];
  payload: InsertBarometreCooperativeInput | null;
};

function cellMap(headers: string[], cells: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((h, i) => {
    const key = HEADER_ALIASES[normalizeHeader(h)];
    if (!key) return;
    out[key] = (cells[i] ?? "").trim();
  });
  return out;
}

function parsePhones(raw: string): { phones: string[]; error?: string } {
  if (!raw.trim()) return { phones: [] };
  const parts = raw
    .split(/[;|,/]/)
    .map((p) => sanitizeMoroccoPhoneInput(p.trim()) || p.trim())
    .filter(Boolean);
  if (parts.length > MAX_COOP_PHONES) {
    return { phones: [], error: `Maximum ${MAX_COOP_PHONES} téléphones` };
  }
  for (let i = 0; i < parts.length; i++) {
    if (!isValidMoroccoPhone(parts[i]!)) {
      return { phones: [], error: `Téléphone ${i + 1} invalide` };
    }
  }
  return { phones: parts };
}

function parseGenre(raw: string): PresidentGenre | null | "invalid" {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (v === "male" || v === "m" || v === "homme") return "male";
  if (v === "female" || v === "f" || v === "femme") return "female";
  return "invalid";
}

function parsePublier(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return v === "oui" || v === "yes" || v === "true" || v === "1" || v === "publie" || v === "publié";
}

function parseEvalScore(raw: string): number | null | "invalid" {
  if (!raw.trim()) return null;
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isInteger(n) || n < EVALUATION_SCORE_MIN || n > EVALUATION_SCORE_MAX) return "invalid";
  return n;
}

export function mapCsvRowsToPreview(headers: string[], rows: string[][]): CoopCsvPreviewRow[] {
  return rows.map((cells, idx) => {
    const map = cellMap(headers, cells);
    const errors: string[] = [];
    const nom = (map.nom ?? "").trim();
    const secteur = (map.secteur ?? "").trim();
    if (!nom) errors.push("Nom obligatoire");
    if (!secteur) errors.push("Secteur obligatoire");

    const { phones, error: phoneErr } = parsePhones(map.telephones ?? "");
    if (phoneErr) errors.push(phoneErr);

    const hasX = Boolean((map.longitude_x ?? "").trim());
    const hasY = Boolean((map.latitude_y ?? "").trim());
    const lngRaw = parseCoordValue(map.longitude_x ?? "");
    const latRaw = parseCoordValue(map.latitude_y ?? "");
    if (hasX || hasY) {
      if (!hasX || !hasY) {
        errors.push("Renseigner X et Y ensemble");
      } else if (lngRaw == null || latRaw == null) {
        errors.push("Coordonnées X/Y invalides");
      } else {
        const normalized = normalizeCooperativeLatLng(latRaw, lngRaw);
        if (!normalized) errors.push("Coordonnées hors WGS84");
      }
    }

    const genre = parseGenre(map.president_genre ?? "");
    if (genre === "invalid") errors.push("president_genre : male ou female");

    const presNom = (map.president_nom ?? "").trim();
    const presEmail = (map.president_email ?? "").trim();
    const presTelRaw = (map.president_tel ?? "").trim();
    const presTel = sanitizeMoroccoPhoneInput(presTelRaw) || presTelRaw;
    const hasPresident = Boolean(genre || presNom || presEmail || presTel);
    if (hasPresident) {
      if (genre !== "male" && genre !== "female") errors.push("Genre président requis");
      if (!presNom) errors.push("Nom président requis");
      if (!presEmail) errors.push("Email président requis");
      if (presTel && !isValidMoroccoPhone(presTel)) errors.push("Tél. président invalide");
    }

    const evaluation = emptyEvaluation();
    for (const c of EVALUATION_CRITERIA) {
      const key = `eval_${c.key}` as CoopCsvColumnKey;
      const score = parseEvalScore(map[key] ?? "");
      if (score === "invalid") {
        errors.push(`${c.label} : score ${EVALUATION_SCORE_MIN}–${EVALUATION_SCORE_MAX}`);
      } else if (score != null) {
        evaluation[c.key as EvaluationCriterionKey] = score;
      }
    }

    let longitude: number | null = null;
    let latitude: number | null = null;
    if (lngRaw != null && latRaw != null) {
      const normalized = normalizeCooperativeLatLng(latRaw, lngRaw);
      if (normalized) {
        longitude = normalized.longitude;
        latitude = normalized.latitude;
      }
    }

    const provinceName = (map.province ?? "").trim() || null;
    const communeName = (map.commune ?? "").trim() || null;
    const adresse = (map.adresse ?? "").trim();
    const locality = [communeName, provinceName].filter(Boolean).join(", ");
    const adresseComposed = [adresse, locality].filter(Boolean).join("\n");

    const display = {
      nom,
      secteur,
      sousSecteur: (map.sous_secteur ?? "").trim(),
      telephones: phones.join("; ") || (map.telephones ?? "").trim(),
      email: (map.email ?? "").trim(),
      adresse: adresseComposed,
      province: provinceName ?? "",
      commune: communeName ?? "",
      longitude: longitude != null ? String(longitude) : (map.longitude_x ?? "").trim(),
      latitude: latitude != null ? String(latitude) : (map.latitude_y ?? "").trim(),
      publier: parsePublier(map.publier ?? "") ? "oui" : "non",
    };

    if (errors.length > 0) {
      return { rowIndex: idx + 2, display, errors, payload: null };
    }

    const payload: InsertBarometreCooperativeInput = {
      nom,
      phones,
      email: (map.email ?? "").trim(),
      adresse: adresseComposed,
      activite: secteur,
      description: (map.description ?? "").trim(),
      links: [],
      imageUrl: null,
      provinceId: null,
      communeId: null,
      provinceName,
      communeName,
      longitude,
      latitude,
      isPublished: parsePublier(map.publier ?? ""),
      presidentGenre: hasPresident ? (genre as PresidentGenre) : null,
      presidentNomComplet: hasPresident ? presNom : null,
      presidentEmail: hasPresident ? presEmail : null,
      presidentTel: hasPresident ? (presTel || null) : null,
      secteur,
      sousSecteur: (map.sous_secteur ?? "").trim() || null,
      tempsDeTravail: (map.temps_de_travail ?? "").trim() || null,
      facebookUrl: (map.facebook ?? "").trim() || null,
      instagramUrl: (map.instagram ?? "").trim() || null,
      evaluation: evaluation as CooperativeEvaluation,
    };

    return { rowIndex: idx + 2, display, errors: [], payload };
  });
}

export function parseCoopCsvFile(text: string): {
  preview: CoopCsvPreviewRow[];
  parseError: string | null;
} {
  const { headers, rows } = parseCsvText(text);
  if (headers.length === 0) {
    return { preview: [], parseError: "Fichier CSV vide." };
  }
  const mappedHeaders = headers.map((h) => HEADER_ALIASES[normalizeHeader(h)]).filter(Boolean);
  if (!mappedHeaders.includes("nom") || !mappedHeaders.includes("secteur")) {
    return {
      preview: [],
      parseError: "Colonnes requises manquantes : nom, secteur. Téléchargez le template.",
    };
  }
  if (rows.length === 0) {
    return { preview: [], parseError: "Aucune ligne de données dans le CSV." };
  }
  return { preview: mapCsvRowsToPreview(headers, rows), parseError: null };
}
