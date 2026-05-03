import { supabase } from "@/lib/supabase";

const BUCKET = "barometre_cooperative_images";
const MAX_BYTES = 5 * 1024 * 1024;

export type CooperativeLink = { url: string; label: string };

export type PresidentGenre = "male" | "female";

export type BarometreCooperative = {
  id: string;
  createdAt: string;
  nom: string;
  tel: string;
  email: string;
  adresse: string;
  activite: string;
  description: string;
  links: CooperativeLink[];
  imageUrl: string | null;
  communeId: string | null;
  provinceId: string | null;
  provinceName: string;
  communeName: string;
  isPublished: boolean;
  presidentGenre: PresidentGenre | null;
  presidentNomComplet: string;
  presidentEmail: string;
  presidentTel: string;
};

type DbRow = {
  id: string;
  created_at: string;
  nom: string;
  tel: string | null;
  email: string | null;
  adresse: string | null;
  activite: string | null;
  secteur_activite: string | null;
  description: string | null;
  links: unknown;
  liens: unknown;
  image_url: string | null;
  commune_id: string | null;
  province_id: string | null;
  province_name: string | null;
  commune_name: string | null;
  is_published: boolean | null;
  president_genre: string | null;
  president_nom_complet: string | null;
  president_email: string | null;
  president_tel: string | null;
};

function parseLinks(raw: unknown): CooperativeLink[] {
  if (!Array.isArray(raw)) return [];
  const out: CooperativeLink[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const url = typeof rec.url === "string" ? rec.url.trim() : "";
    if (!url) continue;
    const label = typeof rec.label === "string" ? rec.label.trim() : "";
    out.push({ url, label });
  }
  return out;
}

function parsePresidentGenre(raw: string | null): PresidentGenre | null {
  if (raw === "male" || raw === "female") return raw;
  return null;
}

function mapRow(row: DbRow): BarometreCooperative {
  const links = parseLinks(row.links ?? row.liens);
  return {
    id: row.id,
    createdAt: row.created_at,
    nom: row.nom,
    tel: row.tel ?? "",
    email: row.email ?? "",
    adresse: row.adresse ?? "",
    activite: (row.activite ?? row.secteur_activite ?? "").trim(),
    description: row.description ?? "",
    links,
    imageUrl: row.image_url ?? null,
    communeId: row.commune_id ?? null,
    provinceId: row.province_id ?? null,
    provinceName: row.province_name ?? "",
    communeName: row.commune_name ?? "",
    isPublished: row.is_published !== false,
    presidentGenre: parsePresidentGenre(row.president_genre ?? null),
    presidentNomComplet: row.president_nom_complet ?? "",
    presidentEmail: row.president_email ?? "",
    presidentTel: row.president_tel ?? "",
  };
}

const COOP_SELECT =
  "id, created_at, nom, tel, email, adresse, activite, secteur_activite, description, links, liens, image_url, commune_id, province_id, province_name, commune_name, is_published, president_genre, president_nom_complet, president_email, president_tel";

/** Données visibles selon RLS (admin : tout ; anon / public : is_published uniquement). */
export async function fetchBarometreCooperatives(): Promise<BarometreCooperative[]> {
  const { data, error } = await supabase.from("barometre_cooperatives").select(COOP_SELECT).order("created_at", {
    ascending: false,
  });

  if (error) throw error;
  return ((data ?? []) as DbRow[]).map(mapRow);
}

export async function fetchBarometreCooperativeById(id: string): Promise<BarometreCooperative | null> {
  const { data, error } = await supabase.from("barometre_cooperatives").select(COOP_SELECT).eq("id", id).maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRow(data as DbRow);
}

export async function uploadBarometreCooperativeImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Veuillez choisir une image (JPEG, PNG, WebP ou GIF).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("L'image ne doit pas dépasser 5 Mo.");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Connexion requise pour téléverser une image.");
  }

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `cooperatives/${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (upErr) throw upErr;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export type InsertBarometreCooperativeInput = {
  nom: string;
  tel: string;
  email: string;
  adresse: string;
  activite: string;
  description: string;
  links: CooperativeLink[];
  imageUrl: string | null;
  provinceId: string | null;
  communeId: string | null;
  provinceName: string | null;
  communeName: string | null;
  isPublished: boolean;
  presidentGenre: PresidentGenre | null;
  presidentNomComplet: string | null;
  presidentEmail: string | null;
  presidentTel: string | null;
};

export async function insertBarometreCooperative(payload: InsertBarometreCooperativeInput): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Connexion requise pour enregistrer une coopérative.");
  }

  const linksJson = payload.links.map((l) => ({ url: l.url, label: l.label }));

  const { error } = await supabase.from("barometre_cooperatives").insert({
    nom: payload.nom,
    tel: payload.tel,
    email: payload.email,
    adresse: payload.adresse,
    description: payload.description,
    activite: payload.activite,
    secteur_activite: payload.activite,
    links: linksJson,
    liens: linksJson,
    image_url: payload.imageUrl,
    longitude: null,
    latitude: null,
    province_id: payload.provinceId,
    commune_id: payload.communeId,
    province_name: payload.provinceName,
    commune_name: payload.communeName,
    province: payload.provinceName,
    commune: payload.communeName,
    created_by: user.id,
    is_published: payload.isPublished,
    president_genre: payload.presidentGenre,
    president_nom_complet: payload.presidentNomComplet,
    president_email: payload.presidentEmail,
    president_tel: payload.presidentTel,
  });

  if (error) throw error;
}

export async function updateBarometreCooperative(id: string, payload: InsertBarometreCooperativeInput): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Connexion requise pour modifier une coopérative.");
  }

  const linksJson = payload.links.map((l) => ({ url: l.url, label: l.label }));

  const { error } = await supabase
    .from("barometre_cooperatives")
    .update({
      nom: payload.nom,
      tel: payload.tel,
      email: payload.email,
      adresse: payload.adresse,
      description: payload.description,
      activite: payload.activite,
      secteur_activite: payload.activite,
      links: linksJson,
      liens: linksJson,
      image_url: payload.imageUrl,
      province_id: payload.provinceId,
      commune_id: payload.communeId,
      province_name: payload.provinceName,
      commune_name: payload.communeName,
      province: payload.provinceName,
      commune: payload.communeName,
      is_published: payload.isPublished,
      president_genre: payload.presidentGenre,
      president_nom_complet: payload.presidentNomComplet,
      president_email: payload.presidentEmail,
      president_tel: payload.presidentTel,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteBarometreCooperative(id: string): Promise<void> {
  const { error } = await supabase.from("barometre_cooperatives").delete().eq("id", id);
  if (error) throw error;
}
