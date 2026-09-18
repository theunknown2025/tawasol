/** Champs exportables des coopératives (éléments d'information). */
export const CARTOGRAPHIE_INFO_FIELD_OPTIONS = [
  { key: "nom", label: "Nom de la coopérative" },
  { key: "description", label: "Description" },
  { key: "sous_secteur", label: "Sous-secteur" },
  { key: "adresse", label: "Adresse" },
  { key: "coordonnees", label: "Coordonnées (longitude / latitude)" },
  { key: "temps_de_travail", label: "Temps de travail" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "liens", label: "Liens" },
] as const;

export type CartographieInfoFieldKey = (typeof CARTOGRAPHIE_INFO_FIELD_OPTIONS)[number]["key"];

export const CARTOGRAPHIE_INFO_FIELD_KEYS = CARTOGRAPHIE_INFO_FIELD_OPTIONS.map(
  (o) => o.key,
) as CartographieInfoFieldKey[];

export type CartographieInfoRequestStatus = "pending" | "approved" | "rejected";

export type CartographieInfoRequestFilters = {
  activities: string[];
  provinces: string[];
  communes: string[];
};

export type CartographieInfoRequest = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  fonction: string;
  etablissement: string;
  requestedFields: CartographieInfoFieldKey[];
  filterActivities: string[];
  filterProvinces: string[];
  filterCommunes: string[];
  usageDescription: string;
  adminComment: string | null;
  status: CartographieInfoRequestStatus;
  reviewedAt: string | null;
  reviewedBy: string | null;
  emailSentAt: string | null;
  emailError: string | null;
  createdAt: string;
  updatedAt: string;
};

export const CARTOGRAPHIE_INFO_STATUS_LABELS: Record<CartographieInfoRequestStatus, string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Rejetée",
};

export function isCartographieInfoFieldKey(value: string): value is CartographieInfoFieldKey {
  return (CARTOGRAPHIE_INFO_FIELD_KEYS as string[]).includes(value);
}

export function labelForInfoField(key: string): string {
  const found = CARTOGRAPHIE_INFO_FIELD_OPTIONS.find((o) => o.key === key);
  return found?.label ?? key;
}

export function normalizeStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const t = item.trim();
    if (!t || out.includes(t)) continue;
    out.push(t);
  }
  return out;
}
