import { supabase } from "@/lib/supabase";

type PublishedStatRow = {
  president_genre: string | null;
  activite: string | null;
  secteur_activite: string | null;
  commune_id: string | null;
  province_id: string | null;
  province_name: string | null;
};

export type BarometreLandingStats = {
  cooperativesInscrites: number;
  cooperativesPresidentFemme: number;
  secteursActivite: number;
  provincesCouvertes: number;
};

async function fetchPublishedStatRows(): Promise<PublishedStatRow[]> {
  const { data, error } = await supabase
    .from("barometre_cooperatives")
    .select("president_genre, activite, secteur_activite, commune_id, province_id, province_name")
    .eq("is_published", true);

  if (error) throw error;
  return (data ?? []) as PublishedStatRow[];
}

function provinceDedupKey(row: PublishedStatRow): string | null {
  const id = row.province_id?.trim();
  if (id) return `id:${id}`;
  const name = row.province_name?.trim().toLowerCase();
  if (name) return `n:${name}`;
  return null;
}

export function computeBarometreLandingStats(rows: PublishedStatRow[]): BarometreLandingStats {
  const cooperativesInscrites = rows.length;
  const cooperativesPresidentFemme = rows.filter((r) => r.president_genre === "female").length;

  const activites = new Set<string>();
  for (const r of rows) {
    const a = (r.activite ?? r.secteur_activite ?? "").trim();
    if (a) activites.add(a);
  }

  const provinces = new Set<string>();
  for (const r of rows) {
    const k = provinceDedupKey(r);
    if (k) provinces.add(k);
  }

  return {
    cooperativesInscrites,
    cooperativesPresidentFemme,
    secteursActivite: activites.size,
    provincesCouvertes: provinces.size,
  };
}

/** Chiffres publics du baromètre (lignes publiées uniquement), pour la section landing. */
export async function fetchBarometreLandingStats(): Promise<BarometreLandingStats> {
  const rows = await fetchPublishedStatRows();
  return computeBarometreLandingStats(rows);
}
