import { supabase } from "./supabase";
import { createDefaultNavIncludeSection } from "@/pages/super-admin/LP_Manager/LandingPage/landingPageSectionAnchors";
import {
  DEFAULT_A_PROPOS_REMESS_CONTENT,
  DEFAULT_EQUIPE_REMESS_CONTENT,
  DEFAULT_NOS_MEMBRES_CONTENT,
  DEFAULT_CONTACTER_NOUS_CONTENT,
  DEFAULT_HEADER_CONTENT,
  DEFAULT_HERO_CONTENT,
  DEFAULT_MOT_DU_PRESIDENT_CONTENT,
  DEFAULT_REMESS_EN_CHIFFRES_CONTENT,
  ensureAProposValeursCount,
  ensureRemessChiffresStatsCount,
  normalizeEquipeMembers,
  normalizeNosMembresEntries,
  type AProposRemessContent,
  type EquipeRemessContent,
  type NosMembresContent,
  type ContacterNousContent,
  type HeaderContent,
  type HeroSectionContent,
  type MotDuPresidentContent,
  type RemessEnChiffresContent,
} from "@/pages/super-admin/LP_Manager/types";

const SINGLETON_ID = "default" as const;

function mergeHeaderPayload(raw: unknown): HeaderContent {
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<HeaderContent>;
  return {
    ...DEFAULT_HEADER_CONTENT,
    ...o,
    scrollBehavior: o.scrollBehavior ?? DEFAULT_HEADER_CONTENT.scrollBehavior,
    navIncludeSection: {
      ...createDefaultNavIncludeSection(),
      ...o.navIncludeSection,
    },
    loginCta: { ...DEFAULT_HEADER_CONTENT.loginCta, ...o.loginCta },
    signInCta: { ...DEFAULT_HEADER_CONTENT.signInCta, ...o.signInCta },
  };
}

function mergeHeroPayload(raw: unknown): HeroSectionContent {
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<HeroSectionContent>;
  return {
    ...DEFAULT_HERO_CONTENT,
    ...o,
    settings: { ...DEFAULT_HERO_CONTENT.settings, ...o.settings },
    slides: Array.isArray(o.slides) && o.slides.length > 0 ? o.slides : DEFAULT_HERO_CONTENT.slides,
  };
}

function mergeMotPayload(raw: unknown): MotDuPresidentContent {
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<MotDuPresidentContent>;
  return { ...DEFAULT_MOT_DU_PRESIDENT_CONTENT, ...o };
}

function mergeAProposPayload(raw: unknown): AProposRemessContent {
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<AProposRemessContent>;
  const valeursRaw = Array.isArray(o.valeurs) ? o.valeurs : [];
  const valeurs = ensureAProposValeursCount(
    valeursRaw.length > 0
      ? (valeursRaw as AProposRemessContent["valeurs"])
      : DEFAULT_A_PROPOS_REMESS_CONTENT.valeurs,
  );
  return {
    ...DEFAULT_A_PROPOS_REMESS_CONTENT,
    ...o,
    missionActionKind:
      o.missionActionKind === "document" || o.missionActionKind === "link"
        ? o.missionActionKind
        : DEFAULT_A_PROPOS_REMESS_CONTENT.missionActionKind,
    valeurs,
  };
}

function mergeRemessEnChiffresPayload(raw: unknown): RemessEnChiffresContent {
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<RemessEnChiffresContent>;
  const statsRaw = Array.isArray(o.stats) ? o.stats : [];
  const stats = ensureRemessChiffresStatsCount(
    statsRaw.length > 0
      ? (statsRaw as RemessEnChiffresContent["stats"])
      : DEFAULT_REMESS_EN_CHIFFRES_CONTENT.stats,
  );
  return {
    ...DEFAULT_REMESS_EN_CHIFFRES_CONTENT,
    ...o,
    stats,
  };
}

function mergeEquipeRemessPayload(raw: unknown): EquipeRemessContent {
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<EquipeRemessContent>;
  const membersRaw = Array.isArray(o.members) ? o.members : [];
  return {
    members: normalizeEquipeMembers(membersRaw),
  };
}

function mergeNosMembresPayload(raw: unknown): NosMembresContent {
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<NosMembresContent>;
  const entriesRaw = Array.isArray(o.entries) ? o.entries : [];
  return {
    subtitle:
      typeof o.subtitle === "string"
        ? o.subtitle
        : DEFAULT_NOS_MEMBRES_CONTENT.subtitle,
    entries: normalizeNosMembresEntries(entriesRaw),
  };
}

function readJsonCoord(x: unknown): number | null {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string" && x.trim() !== "") {
    const n = Number(x.trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function mergeContacterNousPayload(raw: unknown): ContacterNousContent {
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<ContacterNousContent>;
  return {
    ...DEFAULT_CONTACTER_NOUS_CONTENT,
    ...o,
    address: typeof o.address === "string" ? o.address : DEFAULT_CONTACTER_NOUS_CONTENT.address,
    phone: typeof o.phone === "string" ? o.phone : DEFAULT_CONTACTER_NOUS_CONTENT.phone,
    whatsapp: typeof o.whatsapp === "string" ? o.whatsapp : DEFAULT_CONTACTER_NOUS_CONTENT.whatsapp,
    email: typeof o.email === "string" ? o.email : DEFAULT_CONTACTER_NOUS_CONTENT.email,
    googleMapsUrl:
      typeof o.googleMapsUrl === "string" ? o.googleMapsUrl : DEFAULT_CONTACTER_NOUS_CONTENT.googleMapsUrl,
    latitude: readJsonCoord(o.latitude),
    longitude: readJsonCoord(o.longitude),
  };
}

export async function fetchLpLandingHeader(): Promise<HeaderContent | null> {
  const { data, error } = await supabase
    .from("lp_landing_header")
    .select("payload")
    .eq("id", SINGLETON_ID)
    .maybeSingle();
  if (error) throw error;
  if (!data?.payload) return null;
  return mergeHeaderPayload(data.payload);
}

export async function upsertLpLandingHeader(payload: HeaderContent): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("lp_landing_header").upsert(
    {
      id: SINGLETON_ID,
      payload,
      updated_by: user?.id ?? null,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function fetchLpLandingHero(): Promise<HeroSectionContent | null> {
  const { data, error } = await supabase
    .from("lp_landing_hero")
    .select("payload")
    .eq("id", SINGLETON_ID)
    .maybeSingle();
  if (error) throw error;
  if (!data?.payload) return null;
  return mergeHeroPayload(data.payload);
}

export async function upsertLpLandingHero(payload: HeroSectionContent): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("lp_landing_hero").upsert(
    {
      id: SINGLETON_ID,
      payload,
      updated_by: user?.id ?? null,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function fetchLpLandingMotDuPresident(): Promise<MotDuPresidentContent | null> {
  const { data, error } = await supabase
    .from("lp_landing_mot_du_president")
    .select("payload")
    .eq("id", SINGLETON_ID)
    .maybeSingle();
  if (error) throw error;
  if (!data?.payload) return null;
  return mergeMotPayload(data.payload);
}

export async function upsertLpLandingMotDuPresident(
  payload: MotDuPresidentContent,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("lp_landing_mot_du_president").upsert(
    {
      id: SINGLETON_ID,
      payload,
      updated_by: user?.id ?? null,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function fetchLpLandingAProposRemess(): Promise<AProposRemessContent | null> {
  const { data, error } = await supabase
    .from("lp_landing_a_propos_remess")
    .select("payload")
    .eq("id", SINGLETON_ID)
    .maybeSingle();
  if (error) throw error;
  if (!data?.payload) return null;
  return mergeAProposPayload(data.payload);
}

export async function upsertLpLandingAProposRemess(payload: AProposRemessContent): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("lp_landing_a_propos_remess").upsert(
    {
      id: SINGLETON_ID,
      payload,
      updated_by: user?.id ?? null,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function fetchLpLandingRemessEnChiffres(): Promise<RemessEnChiffresContent | null> {
  const { data, error } = await supabase
    .from("lp_landing_remess_en_chiffres")
    .select("payload")
    .eq("id", SINGLETON_ID)
    .maybeSingle();
  if (error) throw error;
  if (!data?.payload) return null;
  return mergeRemessEnChiffresPayload(data.payload);
}

export async function upsertLpLandingRemessEnChiffres(
  payload: RemessEnChiffresContent,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("lp_landing_remess_en_chiffres").upsert(
    {
      id: SINGLETON_ID,
      payload,
      updated_by: user?.id ?? null,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function fetchLpLandingEquipeRemess(): Promise<EquipeRemessContent | null> {
  const { data, error } = await supabase
    .from("lp_landing_equipe_remess")
    .select("payload")
    .eq("id", SINGLETON_ID)
    .maybeSingle();
  if (error) throw error;
  if (!data?.payload) return null;
  return mergeEquipeRemessPayload(data.payload);
}

export async function upsertLpLandingEquipeRemess(payload: EquipeRemessContent): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("lp_landing_equipe_remess").upsert(
    {
      id: SINGLETON_ID,
      payload,
      updated_by: user?.id ?? null,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function fetchLpLandingNosMembres(): Promise<NosMembresContent | null> {
  const { data, error } = await supabase
    .from("lp_landing_nos_membres")
    .select("payload")
    .eq("id", SINGLETON_ID)
    .maybeSingle();
  if (error) throw error;
  if (!data?.payload) return null;
  return mergeNosMembresPayload(data.payload);
}

export async function upsertLpLandingNosMembres(payload: NosMembresContent): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("lp_landing_nos_membres").upsert(
    {
      id: SINGLETON_ID,
      payload,
      updated_by: user?.id ?? null,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function fetchLpLandingContacterNous(): Promise<ContacterNousContent | null> {
  const { data, error } = await supabase
    .from("lp_landing_contacter_nous")
    .select("payload")
    .eq("id", SINGLETON_ID)
    .maybeSingle();
  if (error) throw error;
  if (!data?.payload) return null;
  return mergeContacterNousPayload(data.payload);
}

export async function upsertLpLandingContacterNous(payload: ContacterNousContent): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("lp_landing_contacter_nous").upsert(
    {
      id: SINGLETON_ID,
      payload,
      updated_by: user?.id ?? null,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export type LpLandingResolvedContent = {
  header: HeaderContent;
  hero: HeroSectionContent;
  motDuPresident: MotDuPresidentContent;
  aProposRemess: AProposRemessContent;
  remessEnChiffres: RemessEnChiffresContent;
  equipeRemess: EquipeRemessContent;
  nosMembres: NosMembresContent;
  contacterNous: ContacterNousContent;
};

/** Charge toutes les sections (singleton) ; valeurs par défaut si aucune ligne en base. */
export async function fetchAllLpLandingResolved(): Promise<LpLandingResolvedContent> {
  const [h, he, m, a, r, eq, nm, cn] = await Promise.all([
    fetchLpLandingHeader(),
    fetchLpLandingHero(),
    fetchLpLandingMotDuPresident(),
    fetchLpLandingAProposRemess(),
    fetchLpLandingRemessEnChiffres(),
    fetchLpLandingEquipeRemess(),
    fetchLpLandingNosMembres(),
    fetchLpLandingContacterNous(),
  ]);
  return {
    header: h ?? DEFAULT_HEADER_CONTENT,
    hero: he ?? DEFAULT_HERO_CONTENT,
    motDuPresident: m ?? DEFAULT_MOT_DU_PRESIDENT_CONTENT,
    aProposRemess: a ?? DEFAULT_A_PROPOS_REMESS_CONTENT,
    remessEnChiffres: r ?? DEFAULT_REMESS_EN_CHIFFRES_CONTENT,
    equipeRemess: eq ?? DEFAULT_EQUIPE_REMESS_CONTENT,
    nosMembres: nm ?? DEFAULT_NOS_MEMBRES_CONTENT,
    contacterNous: cn ?? DEFAULT_CONTACTER_NOUS_CONTENT,
  };
}
