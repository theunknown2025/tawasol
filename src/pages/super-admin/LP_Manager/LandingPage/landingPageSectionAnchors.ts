import type { LandingPageSectionLabel } from "./landingPageSectionLabels";
import { LANDING_PAGE_SECTION_LABELS } from "./landingPageSectionLabels";

/** Sections pouvant recevoir un lien d’ancrage dans le header (hors « Header »). */
export type NavigableLandingSectionLabel = Exclude<LandingPageSectionLabel, "Header">;

export const NAVIGABLE_LANDING_SECTION_LABELS = LANDING_PAGE_SECTION_LABELS.filter(
  (l): l is NavigableLandingSectionLabel => l !== "Header",
);

/** Identifiants HTML pour ancres (#…) — alignés sur l’aperçu pleine page. */
export const LANDING_PAGE_SECTION_ANCHOR_ID: Record<LandingPageSectionLabel, string> = {
  Header: "lp-section-header",
  Hero: "lp-section-hero",
  "Mot du président": "lp-section-mot-du-president",
  "À propos du REMESS": "lp-section-a-propos-du-remess",
  "REMESS en chiffres": "lp-section-remess-en-chiffres",
  "Équipe REMESS": "lp-section-equipe-remess",
  "Nos membres": "lp-section-nos-membres",
  "Nos partenaires": "lp-section-nos-partenaires",
  "Nos événements": "lp-section-nos-evenements",
  Articles: "lp-section-articles",
  "Contacter nous": "lp-section-contacter-nous",
  Footer: "lp-section-footer",
};

export function createDefaultNavIncludeSection(): Record<NavigableLandingSectionLabel, boolean> {
  return Object.fromEntries(
    NAVIGABLE_LANDING_SECTION_LABELS.map((k) => [k, false]),
  ) as Record<NavigableLandingSectionLabel, boolean>;
}
