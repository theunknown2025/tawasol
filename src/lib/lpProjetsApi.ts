import { supabase } from "@/lib/supabase";
import { uploadLandingPageImage } from "@/lib/lpLandingPageApi";
import {
  isAProposValeurIconKey,
  type HeroSlideBackground,
} from "@/pages/super-admin/LP_Manager/types";
import type {
  LpProjet,
  LpProjetInput,
  LpProjetPartner,
  LpProjetResult,
  LpProjetsDisplayMode,
  LpProjetsLandingStats,
  LpProjetsPublicSettings,
} from "@/types/lpProjet";

type DbProjet = {
  id: string;
  title: string;
  banner: HeroSlideBackground;
  date_debut: string | null;
  date_fin: string | null;
  description: string;
  results: unknown;
  zones: unknown;
  partners: unknown;
  status: string;
  public_slug: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function normalizeResults(raw: unknown): LpProjetResult[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const id = typeof o.id === "string" && o.id.trim() ? o.id : crypto.randomUUID();
      const numberValue = typeof o.numberValue === "string" ? o.numberValue : String(o.numberValue ?? "");
      const title = typeof o.title === "string" ? o.title : "";
      const iconKey = isAProposValeurIconKey(String(o.iconKey ?? "")) ? o.iconKey : "target";
      return { id, numberValue, iconKey, title } as LpProjetResult;
    })
    .filter((x): x is LpProjetResult => x !== null);
}

function normalizeZones(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((z) => (typeof z === "string" ? z.trim() : String(z ?? "").trim()))
    .filter(Boolean);
}

function normalizePartners(raw: unknown): LpProjetPartner[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const id = typeof o.id === "string" && o.id.trim() ? o.id : crypto.randomUUID();
      const name = typeof o.name === "string" ? o.name : "";
      const logoUrl = typeof o.logoUrl === "string" ? o.logoUrl : "";
      return { id, name, logoUrl };
    })
    .filter((x): x is LpProjetPartner => x !== null);
}

function mapDbToProjet(row: DbProjet): LpProjet {
  return {
    id: row.id,
    title: row.title,
    banner: row.banner ?? { type: "solid", color: "#0f766e" },
    dateDebut: row.date_debut,
    dateFin: row.date_fin,
    description: row.description ?? "",
    results: normalizeResults(row.results),
    zones: normalizeZones(row.zones),
    partners: normalizePartners(row.partners),
    status: row.status === "published" ? "published" : "draft",
    publicSlug: row.public_slug,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDbPayload(input: LpProjetInput) {
  return {
    title: input.title.trim(),
    banner: input.banner,
    date_debut: input.dateDebut || null,
    date_fin: input.dateFin || null,
    description: input.description,
    results: input.results,
    zones: input.zones.map((z) => z.trim()).filter(Boolean),
    partners: input.partners,
    status: input.status,
  };
}

function normalizePageSize(value: number | undefined): 5 | 15 | 50 {
  if (value === 5 || value === 15 || value === 50) return value;
  return 15;
}

export async function fetchAllLpProjets(): Promise<LpProjet[]> {
  const { data, error } = await supabase
    .from("lp_projets")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as DbProjet[]).map(mapDbToProjet);
}

export async function fetchPublishedLpProjets(limit?: number): Promise<LpProjet[]> {
  let query = supabase
    .from("lp_projets")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as DbProjet[]).map(mapDbToProjet);
}

export async function fetchPublicLpProjetBySlug(slug: string): Promise<LpProjet | null> {
  const { data, error } = await supabase
    .from("lp_projets")
    .select("*")
    .eq("public_slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapDbToProjet(data as DbProjet);
}

export async function createLpProjet(input: LpProjetInput): Promise<LpProjet> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("lp_projets")
    .insert({
      ...toDbPayload(input),
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapDbToProjet(data as DbProjet);
}

export async function updateLpProjet(id: string, input: LpProjetInput): Promise<LpProjet> {
  const { data, error } = await supabase
    .from("lp_projets")
    .update(toDbPayload(input))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapDbToProjet(data as DbProjet);
}

export async function deleteLpProjet(id: string): Promise<void> {
  const { error } = await supabase.from("lp_projets").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchLpProjetsPublicSettings(): Promise<LpProjetsPublicSettings> {
  const { data, error } = await supabase
    .from("lp_projets_public_settings")
    .select("display_mode, page_size")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return {
    displayMode: (data?.display_mode as LpProjetsDisplayMode) ?? "card",
    pageSize: normalizePageSize(data?.page_size),
  };
}

export async function updateLpProjetsPublicSettings(
  settings: LpProjetsPublicSettings,
): Promise<void> {
  const { error } = await supabase.from("lp_projets_public_settings").upsert({
    id: 1,
    display_mode: settings.displayMode,
    page_size: normalizePageSize(settings.pageSize),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function fetchLpProjetsLandingStats(): Promise<LpProjetsLandingStats> {
  const projets = await fetchPublishedLpProjets();
  const zoneSet = new Set<string>();
  let realisationCount = 0;
  for (const p of projets) {
    for (const z of p.zones) zoneSet.add(z.toLowerCase());
    realisationCount += p.results.length;
  }
  return {
    projectCount: projets.length,
    zoneCount: zoneSet.size,
    realisationCount,
  };
}

export async function uploadLpProjetBanner(file: File): Promise<string> {
  const { url, usedFallback } = await uploadLandingPageImage(file, "projets-banners");
  if (usedFallback) {
    console.warn("Projet banner used local fallback (storage unavailable)");
  }
  return url;
}

export async function uploadLpProjetPartnerLogo(file: File): Promise<string> {
  const { url, usedFallback } = await uploadLandingPageImage(file, "projets-partners");
  if (usedFallback) {
    console.warn("Partner logo used local fallback (storage unavailable)");
  }
  return url;
}
