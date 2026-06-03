import type { HeroSlideBackground } from "@/pages/super-admin/LP_Manager/types";

export type OpportunityType = "emploi" | "stage" | "ami" | "tdr" | "formation";
export type OpportunityFormat = "presentiel" | "distance" | "hybride";
export type OpportunityContractType =
  | "stage"
  | "mission"
  | "projet"
  | "freelance"
  | "cdd"
  | "cdi"
  | "anapec";
export type OpportunityStatus = "draft" | "published";
export type ApplicationDecision = "pending" | "accepte" | "sous_reserve" | "rejete";
export type OpportunitiesDisplayMode = "card" | "rows";

export type OpportunityDocument = {
  id: string;
  label: string;
  url: string;
  fileName: string;
};

export type Opportunity = {
  id: string;
  title: string;
  opportunityType: OpportunityType;
  format: OpportunityFormat;
  contractType: OpportunityContractType | null;
  durationStart: string | null;
  durationEnd: string | null;
  salaryMad: number | null;
  deadline: string;
  location: string;
  description: string;
  banner: HeroSlideBackground;
  registrationFormId: string | null;
  documents: OpportunityDocument[];
  status: OpportunityStatus;
  publicSlug: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OpportunityInput = Omit<
  Opportunity,
  "id" | "publicSlug" | "publishedAt" | "createdAt" | "updatedAt"
>;

export type OpportunityApplication = {
  id: string;
  opportunityId: string;
  applicantName: string;
  applicantEmail: string;
  answers: Record<string, string>;
  fileUploads: Record<string, { url: string; path: string; fileName: string }>;
  decision: ApplicationDecision;
  createdAt: string;
  updatedAt: string;
};

export type OpportunitiesPublicSettings = {
  displayMode: OpportunitiesDisplayMode;
  pageSize: number;
};

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  emploi: "Emploi",
  stage: "Stage",
  ami: "AMI",
  tdr: "TDR",
  formation: "Formation",
};

export const OPPORTUNITY_FORMAT_LABELS: Record<OpportunityFormat, string> = {
  presentiel: "Présentiel",
  distance: "Distance",
  hybride: "Hybride",
};

export const OPPORTUNITY_CONTRACT_TYPE_LABELS: Record<OpportunityContractType, string> = {
  stage: "Stage",
  mission: "Mission",
  projet: "Projet",
  freelance: "Freelance",
  cdd: "CDD",
  cdi: "CDI",
  anapec: "ANAPEC",
};

export function formatOpportunityDuration(start: string | null, end: string | null): string {
  if (!start && !end) return "—";
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `À partir du ${fmt(start)}`;
  return `Jusqu'au ${fmt(end!)}`;
}

export const APPLICATION_DECISION_LABELS: Record<ApplicationDecision, string> = {
  pending: "En attente",
  accepte: "Accepté",
  sous_reserve: "Sous réserve",
  rejete: "Rejeté",
};
