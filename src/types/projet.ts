export interface ProjetPlanItem {
  id?: string;
  axe: string;
  tache: string;
  responsable_id: string | null;
  responsable_name?: string;
  /** Personnel contributeurs (ids), excluding the responsable */
  contributeur_ids: string[];
  contributeur_names?: string[];
  date_debut: string | null;
  date_fin: string | null;
  livrable: string;
  commentaire: string;
  /** PMO: étape marquée comme terminée (avancement) */
  pmo_step_completed?: boolean;
  ordre?: number;
}

export interface ProjetPlanItemDocument {
  id: string;
  plan_item_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface ProjetDocument {
  id: string;
  projet_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface ProjetKpi {
  id?: string;
  nom: string;
  description: string;
  objectif: string;
  resultat_escompte: string;
  mesure: string;
  frequence: string;
  ordre?: number;
}

export interface Projet {
  id: string;
  nom: string;
  description: string | null;
  zone_region: string | null;
  zone_province: string | null;
  budget: number | null;
  date_debut: string | null;
  date_fin: string | null;
  bailleurs_de_fonds: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjetWithPlan extends Projet {
  plan_items: ProjetPlanItem[];
  kpis: ProjetKpi[];
  documents: ProjetDocument[];
}

export interface ProjetCreateInput {
  nom: string;
  description: string | null;
  zone_region: string | null;
  zone_province: string | null;
  budget: number | null;
  date_debut: string | null;
  date_fin: string | null;
  bailleurs_de_fonds: string[];
  planItems: ProjetPlanItem[];
  kpis: ProjetKpi[];
  /** Local files selected before save; uploaded after projet insert */
  documentFiles?: File[];
}

/** 12 régions du Maroc */
export const MAROC_REGIONS = [
  "Tanger-Tétouan-Al Hoceïma",
  "L'Oriental",
  "Fès-Meknès",
  "Rabat-Salé-Kénitra",
  "Béni Mellal-Khénifra",
  "Casablanca-Settat",
  "Marrakech-Safi",
  "Drâa-Tafilalet",
  "Souss-Massa",
  "Guelmim-Oued Noun",
  "Laâyoune-Sakia El Hamra",
  "Dakhla-Oued Ed-Dahab",
] as const;

export type MarocRegion = (typeof MAROC_REGIONS)[number];

/** Provinces / préfectures par région (découpage territorial 2015) */
export const MAROC_PROVINCES_BY_REGION: Record<MarocRegion, readonly string[]> = {
  "Tanger-Tétouan-Al Hoceïma": [
    "Al Hoceïma",
    "Chefchaouen",
    "Fahs-Anjra",
    "Larache",
    "M'diq-Fnideq",
    "Ouezzane",
    "Tanger-Assilah",
    "Tétouan",
  ],
  "L'Oriental": [
    "Berkane",
    "Driouch",
    "Figuig",
    "Guercif",
    "Jerada",
    "Nador",
    "Oujda-Angad",
    "Taourirt",
  ],
  "Fès-Meknès": [
    "Boulemane",
    "El Hajeb",
    "Fès",
    "Ifrane",
    "Meknès",
    "Moulay Yacoub",
    "Sefrou",
    "Taounate",
    "Taza",
  ],
  "Rabat-Salé-Kénitra": [
    "Kénitra",
    "Khémisset",
    "Rabat",
    "Salé",
    "Sidi Kacem",
    "Sidi Slimane",
    "Skhirate-Témara",
  ],
  "Béni Mellal-Khénifra": [
    "Azilal",
    "Béni Mellal",
    "Fquih Ben Salah",
    "Khénifra",
    "Khouribga",
  ],
  "Casablanca-Settat": [
    "Benslimane",
    "Berrechid",
    "Casablanca",
    "El Jadida",
    "Médiouna",
    "Mohammedia",
    "Nouaceur",
    "Settat",
    "Sidi Bennour",
  ],
  "Marrakech-Safi": [
    "Al Haouz",
    "Chichaoua",
    "El Kelâa des Sraghna",
    "Essaouira",
    "Marrakech",
    "Rehamna",
    "Safi",
    "Youssoufia",
  ],
  "Drâa-Tafilalet": ["Errachidia", "Midelt", "Ouarzazate", "Tinghir", "Zagora"],
  "Souss-Massa": [
    "Agadir Ida-Outanane",
    "Chtouka-Aït Baha",
    "Inezgane-Aït Melloul",
    "Taroudannt",
    "Tata",
    "Tiznit",
  ],
  "Guelmim-Oued Noun": ["Assa-Zag", "Guelmim", "Sidi Ifni", "Tan-Tan"],
  "Laâyoune-Sakia El Hamra": ["Boujdour", "Es-Semara", "Laâyoune", "Tarfaya"],
  "Dakhla-Oued Ed-Dahab": ["Aousserd", "Oued Ed-Dahab"],
};

export function provincesForRegion(region: string): readonly string[] {
  if ((MAROC_REGIONS as readonly string[]).includes(region)) {
    return MAROC_PROVINCES_BY_REGION[region as MarocRegion];
  }
  return [];
}
