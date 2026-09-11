import {
  LANDING_PAGE_SECTION_LABELS,
  type LandingPageSectionLabel,
} from "@/pages/super-admin/LP_Manager/LandingPage/landingPageSectionLabels";
import { LANDING_PAGE_SECTION_ANCHOR_ID } from "@/pages/super-admin/LP_Manager/LandingPage/landingPageSectionAnchors";

/** true = section affichée sur la page principale ; false = masquée. */
export type LandingSectionVisibilityMap = Record<LandingPageSectionLabel, boolean>;

export const PUBLIC_LANDING_VISIBILITY_QUERY_KEY = ["lp-landing-section-visibility-public"] as const;
export const PUBLIC_LANDING_ALL_SECTIONS_QUERY_KEY = ["public-landing", "all-sections"] as const;

/** Toutes les sections visibles par défaut (comportement historique). */
export function createDefaultSectionVisibility(): LandingSectionVisibilityMap {
  return Object.fromEntries(
    LANDING_PAGE_SECTION_LABELS.map((label) => [label, true]),
  ) as LandingSectionVisibilityMap;
}

export function mergeSectionVisibilityPayload(raw: unknown): LandingSectionVisibilityMap {
  const defaults = createDefaultSectionVisibility();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults;
  const r = raw as Record<string, unknown>;
  const next = { ...defaults };
  for (const label of LANDING_PAGE_SECTION_LABELS) {
    if (typeof r[label] === "boolean") {
      next[label] = r[label];
    }
  }
  return next;
}

/** Affiché uniquement si explicitement true (défaut = true si clé absente). */
export function isLandingSectionVisible(
  visibility: LandingSectionVisibilityMap | null | undefined,
  label: LandingPageSectionLabel,
): boolean {
  if (!visibility) return true;
  const value = visibility[label];
  if (typeof value !== "boolean") return true;
  return value === true;
}

/** Ancre HTML → label de section (pour filtrer le mega-menu Accueil). */
const ANCHOR_TO_SECTION_LABEL = Object.fromEntries(
  LANDING_PAGE_SECTION_LABELS.map((label) => [LANDING_PAGE_SECTION_ANCHOR_ID[label], label]),
) as Record<string, LandingPageSectionLabel>;

export function landingSectionLabelFromAnchorId(
  anchorId: string,
): LandingPageSectionLabel | undefined {
  return ANCHOR_TO_SECTION_LABEL[anchorId];
}
