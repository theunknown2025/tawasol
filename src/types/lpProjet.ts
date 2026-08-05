import type {
  AProposValeurIconKey,
  HeroSlideBackground,
} from "@/pages/super-admin/LP_Manager/types";

export type LpProjetStatus = "draft" | "published";
export type LpProjetsDisplayMode = "card" | "rows";

export type LpProjetResult = {
  id: string;
  numberValue: string;
  iconKey: AProposValeurIconKey;
  title: string;
};

export type LpProjetPartner = {
  id: string;
  name: string;
  logoUrl: string;
};

export type LpProjet = {
  id: string;
  title: string;
  banner: HeroSlideBackground;
  dateDebut: string | null;
  dateFin: string | null;
  description: string;
  results: LpProjetResult[];
  zones: string[];
  partners: LpProjetPartner[];
  status: LpProjetStatus;
  publicSlug: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LpProjetInput = Omit<
  LpProjet,
  "id" | "publicSlug" | "publishedAt" | "createdAt" | "updatedAt"
>;

export type LpProjetsPublicSettings = {
  displayMode: LpProjetsDisplayMode;
  pageSize: number;
};

export type LpProjetsLandingStats = {
  projectCount: number;
  zoneCount: number;
  realisationCount: number;
};

export function formatLpProjetDates(start: string | null, end: string | null): string {
  if (!start && !end) return "—";
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `À partir du ${fmt(start)}`;
  return `Jusqu'au ${fmt(end!)}`;
}

export function newLpProjetResultId(): string {
  return crypto.randomUUID();
}

export function newLpProjetPartnerId(): string {
  return crypto.randomUUID();
}

export function createEmptyLpProjetResult(): LpProjetResult {
  return {
    id: newLpProjetResultId(),
    numberValue: "",
    iconKey: "target",
    title: "",
  };
}

export function createEmptyLpProjetPartner(): LpProjetPartner {
  return {
    id: newLpProjetPartnerId(),
    name: "",
    logoUrl: "",
  };
}

export function createEmptyLpProjetInput(): LpProjetInput {
  return {
    title: "",
    banner: { type: "solid", color: "#0f766e" },
    dateDebut: null,
    dateFin: null,
    description: "",
    results: [],
    zones: [],
    partners: [],
    status: "draft",
  };
}
