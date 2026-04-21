/** Ordre des sections landing (aperçu & futur éditeur). */
export const LANDING_PAGE_SECTION_LABELS = [
  "Header",
  "Hero",
  "Mot du président",
  "À propos du REMESS",
  "REMESS en chiffres",
  "Équipe REMESS",
  "Nos membres",
  "Nos partenaires",
  "Nos événements",
  "Articles",
  "Contacter nous",
  "Footer",
] as const;

export type LandingPageSectionLabel = (typeof LANDING_PAGE_SECTION_LABELS)[number];
