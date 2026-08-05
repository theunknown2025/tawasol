import type { CSSProperties } from "react";
import {
  createDefaultNavIncludeSection,
  type NavigableLandingSectionLabel,
} from "./LandingPage/landingPageSectionAnchors";

export type { NavigableLandingSectionLabel };

export type HeroSlideBackground =
  | { type: "solid"; color: string }
  | { type: "gradient"; from: string; to: string; angleDeg: number }
  /** Image en fond ; opacité du voile sombre (0–100) pour la lisibilité du texte */
  | {
      type: "image";
      url: string;
      overlayOpacity?: number;
      /** Position verticale 0–100 (haut → bas) */
      positionY?: number;
      /** @deprecated ancien cadrage horizontal — migré vers positionY si absent */
      positionX?: number;
    };

export type HeroCta = {
  label: string;
  href: string;
};

export type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  /** Texte libre (horaires, date d’événement, etc.) — optionnel */
  timeLabel: string;
  background: HeroSlideBackground;
  /** Si false, les boutons d’action ne s’affichent pas sur cette diapositive */
  showActionButtons?: boolean;
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
};

export type HeroSliderSettings = {
  /** Durée d’affichage de chaque diapositive avant passage automatique */
  slideDurationSec: number;
  showNavArrows: boolean;
};

export type HeroSectionContent = {
  slides: HeroSlide[];
  settings: HeroSliderSettings;
};

function newSlideId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultSlide(index: number): HeroSlide {
  return {
    id: newSlideId(),
    title: index === 0 ? "Votre message principal" : `Titre ${index + 1}`,
    subtitle:
      index === 0
        ? "Une phrase courte qui explique la valeur de votre offre et invite à l’action."
        : "Sous-titre de la diapositive.",
    timeLabel: "",
    background: { type: "solid", color: "#4f46e5" },
    showActionButtons: true,
    primaryCta: { label: "Commencer", href: "#" },
    secondaryCta: { label: "En savoir plus", href: "#" },
  };
}

export const HERO_SLIDE_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export function ensureSlideCount(count: number, current: HeroSlide[]): HeroSlide[] {
  const n = Math.min(Math.max(1, Math.round(count)), 8);
  if (current.length === n) return current;
  if (current.length > n) return current.slice(0, n);
  const next = current.map((s) => ({ ...s, id: s.id || newSlideId() }));
  while (next.length < n) {
    next.push(createDefaultSlide(next.length));
  }
  return next;
}

export function slideBackgroundStyle(bg: HeroSlideBackground): CSSProperties {
  if (bg.type === "solid") {
    return { backgroundColor: bg.color };
  }
  if (bg.type === "gradient") {
    return {
      backgroundImage: `linear-gradient(${bg.angleDeg}deg, ${bg.from}, ${bg.to})`,
    };
  }
  const url = bg.url.trim();
  const opacity = Math.min(100, Math.max(0, bg.overlayOpacity ?? 35)) / 100;
  const positionY = Math.min(
    100,
    Math.max(0, bg.positionY ?? bg.positionX ?? 50),
  );
  const base: CSSProperties = {
    backgroundSize: "cover",
    backgroundPosition: `center ${positionY}%`,
    backgroundRepeat: "no-repeat",
  };
  if (!url) {
    return { ...base, backgroundColor: "#1e1b4b" };
  }
  return {
    ...base,
    backgroundImage: `linear-gradient(rgba(0,0,0,${opacity}), rgba(0,0,0,${opacity})), url(${JSON.stringify(url)})`,
  };
}

export const DEFAULT_HERO_CONTENT: HeroSectionContent = {
  slides: [createDefaultSlide(0)],
  settings: {
    slideDurationSec: 5,
    showNavArrows: true,
  },
};

export type TextDirection = "ltr" | "rtl";

export const MOT_DU_PRESIDENT_SIGNATURE_FONTS = [
  // Arabic calligraphy / display (Google Fonts Arabic)
  { id: "aref-ruqaa", label: "Aref Ruqaa (عربي)", family: '"Aref Ruqaa", serif', script: "arabic" },
  { id: "aref-ruqaa-ink", label: "Aref Ruqaa Ink (عربي)", family: '"Aref Ruqaa Ink", serif', script: "arabic" },
  { id: "katibeh", label: "Katibeh (عربي)", family: '"Katibeh", cursive', script: "arabic" },
  { id: "amiri", label: "Amiri (عربي)", family: '"Amiri", serif', script: "arabic" },
  { id: "scheherazade-new", label: "Scheherazade New (عربي)", family: '"Scheherazade New", serif', script: "arabic" },
  { id: "lateef", label: "Lateef (عربي)", family: '"Lateef", serif', script: "arabic" },
  { id: "mirza", label: "Mirza (عربي)", family: '"Mirza", serif', script: "arabic" },
  { id: "lemonada", label: "Lemonada (عربي)", family: '"Lemonada", cursive', script: "arabic" },
  { id: "rakkas", label: "Rakkas (عربي)", family: '"Rakkas", cursive', script: "arabic" },
  { id: "noto-naskh-arabic", label: "Noto Naskh Arabic (عربي)", family: '"Noto Naskh Arabic", serif', script: "arabic" },
  { id: "reem-kufi", label: "Reem Kufi (عربي)", family: '"Reem Kufi", sans-serif', script: "arabic" },
  // Latin script signatures
  { id: "great-vibes", label: "Great Vibes (Latin)", family: '"Great Vibes", cursive', script: "latin" },
  { id: "dancing-script", label: "Dancing Script (Latin)", family: '"Dancing Script", cursive', script: "latin" },
  { id: "pacifico", label: "Pacifico (Latin)", family: '"Pacifico", cursive', script: "latin" },
  { id: "satisfy", label: "Satisfy (Latin)", family: '"Satisfy", cursive', script: "latin" },
  { id: "allura", label: "Allura (Latin)", family: '"Allura", cursive', script: "latin" },
  { id: "sacramento", label: "Sacramento (Latin)", family: '"Sacramento", cursive', script: "latin" },
  { id: "caveat", label: "Caveat (Latin)", family: '"Caveat", cursive', script: "latin" },
  { id: "parisienne", label: "Parisienne (Latin)", family: '"Parisienne", cursive', script: "latin" },
  { id: "alex-brush", label: "Alex Brush (Latin)", family: '"Alex Brush", cursive', script: "latin" },
] as const;

export type MotDuPresidentSignatureFontId =
  (typeof MOT_DU_PRESIDENT_SIGNATURE_FONTS)[number]["id"];

export const MOT_DU_PRESIDENT_SIGNATURE_SIZES = [
  { id: "sm", label: "Petit", px: 28 },
  { id: "md", label: "Moyen", px: 36 },
  { id: "lg", label: "Grand", px: 44 },
  { id: "xl", label: "Très grand", px: 56 },
] as const;

export type MotDuPresidentSignatureSizeId =
  (typeof MOT_DU_PRESIDENT_SIGNATURE_SIZES)[number]["id"];

export type MotDuPresidentContent = {
  /** URL publique (bucket `landing_page`) ou data URL de secours */
  presidentImageUrl: string;
  presidentName: string;
  position: string;
  messageText: string;
  /** Direction du bloc texte (nom, fonction, message) */
  messageDirection: TextDirection;
  /** Texte affiché avec une police « signature » */
  signature: string;
  signatureDirection: TextDirection;
  signatureFont: MotDuPresidentSignatureFontId;
  signatureSize: MotDuPresidentSignatureSizeId;
};

export const DEFAULT_MOT_DU_PRESIDENT_CONTENT: MotDuPresidentContent = {
  presidentImageUrl: "",
  presidentName: "",
  position: "",
  messageText: "",
  messageDirection: "ltr",
  signature: "",
  signatureDirection: "ltr",
  signatureFont: "great-vibes",
  signatureSize: "md",
};

export function resolveMotDuPresidentSignatureFont(
  id: string | undefined,
): (typeof MOT_DU_PRESIDENT_SIGNATURE_FONTS)[number] {
  return (
    MOT_DU_PRESIDENT_SIGNATURE_FONTS.find((f) => f.id === id) ??
    MOT_DU_PRESIDENT_SIGNATURE_FONTS[0]
  );
}

export function resolveMotDuPresidentSignatureSize(
  id: string | undefined,
): (typeof MOT_DU_PRESIDENT_SIGNATURE_SIZES)[number] {
  return (
    MOT_DU_PRESIDENT_SIGNATURE_SIZES.find((s) => s.id === id) ??
    MOT_DU_PRESIDENT_SIGNATURE_SIZES[1]
  );
}

export const A_PROPOS_VALEURS_MIN = 4;
export const A_PROPOS_VALEURS_MAX = 6;

export const A_PROPOS_VALEUR_ICON_KEYS = [
  "heart",
  "shield",
  "lightbulb",
  "users",
  "handshake",
  "target",
  "leaf",
  "award",
  "sparkles",
  "globe2",
  "trendingUp",
  "compass",
] as const;

export type AProposValeurIconKey = (typeof A_PROPOS_VALEUR_ICON_KEYS)[number];

export function isAProposValeurIconKey(s: string): s is AProposValeurIconKey {
  return (A_PROPOS_VALEUR_ICON_KEYS as readonly string[]).includes(s);
}

export type AProposMissionActionKind = "link" | "document";

export type AProposValeurItem = {
  id: string;
  title: string;
  description: string;
  iconKey: AProposValeurIconKey;
};

export type AProposRemessContent = {
  missionEyebrow: string;
  missionTitle: string;
  missionStatement: string;
  missionActionLabel: string;
  missionActionKind: AProposMissionActionKind;
  missionActionHref: string;
  missionDocumentUrl: string;
  valeursSectionTitle: string;
  valeurs: AProposValeurItem[];
};

function newAProposValeurId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `valeur-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultAProposValeur(index: number): AProposValeurItem {
  const iconKey = A_PROPOS_VALEUR_ICON_KEYS[index % A_PROPOS_VALEUR_ICON_KEYS.length];
  return {
    id: newAProposValeurId(),
    title: `Valeur ${index + 1}`,
    description: "Courte description de cette valeur pour vos visiteurs.",
    iconKey,
  };
}

export function ensureAProposValeursCount(items: AProposValeurItem[]): AProposValeurItem[] {
  const trimmed = items.slice(0, A_PROPOS_VALEURS_MAX).map((v, i) => ({
    ...v,
    id: typeof v.id === "string" && v.id.trim().length > 0 ? v.id.trim() : newAProposValeurId(),
    title: typeof v.title === "string" ? v.title : `Valeur ${i + 1}`,
    description: typeof v.description === "string" ? v.description : "",
    iconKey: isAProposValeurIconKey(String(v.iconKey)) ? v.iconKey : "heart",
  }));
  const next = [...trimmed];
  while (next.length < A_PROPOS_VALEURS_MIN) {
    next.push(createDefaultAProposValeur(next.length));
  }
  return next;
}

export const DEFAULT_A_PROPOS_REMESS_CONTENT: AProposRemessContent = {
  missionEyebrow: "À propos",
  missionTitle: "Mission du REMESS",
  missionStatement:
    "Rédigez ici la mission du REMESS : pourquoi vous existez, qui vous servez, et l’impact visé. Ce texte s’affiche à gauche sur la landing page.",
  missionActionLabel: "En savoir plus",
  missionActionKind: "link",
  missionActionHref: "#",
  missionDocumentUrl: "",
  valeursSectionTitle: "Nos Valeurs",
  valeurs: Array.from({ length: A_PROPOS_VALEURS_MIN }, (_, i) => createDefaultAProposValeur(i)),
};

export const REMESS_CHIFFRES_STATS_MIN = 3;
export const REMESS_CHIFFRES_STATS_MAX = 12;

export type RemessEnChiffreStatItem = {
  id: string;
  /** Affichage libre : « 120+ », « 98 % », « 15k »… */
  numberValue: string;
  title: string;
  description: string;
  iconKey: AProposValeurIconKey;
};

export type RemessEnChiffresContent = {
  subtitle: string;
  stats: RemessEnChiffreStatItem[];
};

function newRemessChiffreStatId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `chiffre-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultRemessChiffreStat(index: number): RemessEnChiffreStatItem {
  const samples = ["120+", "48", "15"];
  const titles = ["Membres actifs", "Projets soutenus", "Pays représentés"];
  return {
    id: newRemessChiffreStatId(),
    numberValue: samples[index % samples.length] ?? `${index + 1}`,
    title: titles[index % titles.length] ?? `Indicateur ${index + 1}`,
    description: "Brève explication de ce que représente ce chiffre.",
    iconKey: A_PROPOS_VALEUR_ICON_KEYS[index % A_PROPOS_VALEUR_ICON_KEYS.length],
  };
}

export function ensureRemessChiffresStatsCount(
  items: RemessEnChiffreStatItem[],
): RemessEnChiffreStatItem[] {
  const trimmed = items.slice(0, REMESS_CHIFFRES_STATS_MAX).map((s, i) => ({
    ...s,
    id: typeof s.id === "string" && s.id.trim().length > 0 ? s.id.trim() : newRemessChiffreStatId(),
    numberValue: typeof s.numberValue === "string" ? s.numberValue : "",
    title: typeof s.title === "string" ? s.title : `Indicateur ${i + 1}`,
    description: typeof s.description === "string" ? s.description : "",
    iconKey: isAProposValeurIconKey(String(s.iconKey)) ? s.iconKey : "heart",
  }));
  const next = [...trimmed];
  while (next.length < REMESS_CHIFFRES_STATS_MIN) {
    next.push(createDefaultRemessChiffreStat(next.length));
  }
  return next;
}

export const DEFAULT_REMESS_EN_CHIFFRES_CONTENT: RemessEnChiffresContent = {
  subtitle: "Quelques repères qui illustrent l’engagement et l’ampleur du réseau.",
  stats: Array.from({ length: REMESS_CHIFFRES_STATS_MIN }, (_, i) =>
    createDefaultRemessChiffreStat(i),
  ),
};

export const EQUIPE_BIO_MAX_CHARS = 300;
export const EQUIPE_MEMBERS_MAX = 24;

export type EquipeMember = {
  id: string;
  /** URL publique (bucket `landing_page`, segment `equipe-remess`) ou data URL */
  photoUrl: string;
  fullName: string;
  /** Rôle / fonction affiché sous le nom */
  functionTitle: string;
  bio: string;
  linkedinUrl: string;
  email: string;
};

export type EquipeRemessContent = {
  members: EquipeMember[];
};

function newEquipeMemberId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `equipe-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultEquipeMember(index: number): EquipeMember {
  return {
    id: newEquipeMemberId(),
    photoUrl: "",
    fullName: `Membre ${index + 1}`,
    functionTitle: "Fonction",
    bio: "Courte biographie (visible au survol de la carte).",
    linkedinUrl: "",
    email: "",
  };
}

function clampBio(s: string): string {
  const t = typeof s === "string" ? s : "";
  return t.length > EQUIPE_BIO_MAX_CHARS ? t.slice(0, EQUIPE_BIO_MAX_CHARS) : t;
}

export function normalizeEquipeMembers(members: unknown[]): EquipeMember[] {
  const raw = Array.isArray(members) ? members : [];
  return raw.slice(0, EQUIPE_MEMBERS_MAX).map((item, i) => {
    const o = (typeof item === "object" && item !== null ? item : {}) as Partial<EquipeMember>;
    return {
      id: typeof o.id === "string" && o.id.trim().length > 0 ? o.id.trim() : newEquipeMemberId(),
      photoUrl: typeof o.photoUrl === "string" ? o.photoUrl : "",
      fullName: typeof o.fullName === "string" ? o.fullName : "",
      functionTitle: typeof o.functionTitle === "string" ? o.functionTitle : "",
      bio: clampBio(typeof o.bio === "string" ? o.bio : ""),
      linkedinUrl: typeof o.linkedinUrl === "string" ? o.linkedinUrl : "",
      email: typeof o.email === "string" ? o.email : "",
    };
  });
}

export const DEFAULT_EQUIPE_REMESS_CONTENT: EquipeRemessContent = {
  members: [],
};

export const NOS_MEMBRES_SHORT_DESC_MAX = 400;
export const NOS_MEMBRES_ENTRIES_MAX = 24;
export const NOS_MEMBRES_ORG_LINKS_MAX = 10;

export type NosMembresOrgLinkKind = "website" | "linkedin" | "instagram";

export type NosMembresOrgLink = {
  id: string;
  kind: NosMembresOrgLinkKind;
  url: string;
};

export type NosMembresOrganization = {
  /** Logo (URL publique bucket `landing_page` / `nos-membres` ou saisie manuelle) */
  logoUrl: string;
  name: string;
  /** Affichée au survol de la carte */
  shortDescription: string;
  links: NosMembresOrgLink[];
};

export type NosMembresRepresentative = {
  fullName: string;
  position: string;
  email: string;
  linkedinUrl: string;
};

export type NosMembresEntry = {
  id: string;
  organization: NosMembresOrganization;
  representative: NosMembresRepresentative;
};

export type NosMembresContent = {
  subtitle: string;
  entries: NosMembresEntry[];
};

function newNosMembresEntryId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `nos-membres-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function newNosMembresOrgLinkId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `nos-membres-link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function isNosMembresOrgLinkKind(x: string): x is NosMembresOrgLinkKind {
  return x === "website" || x === "linkedin" || x === "instagram";
}

export function clampNosMembresShortDescription(s: string): string {
  const t = typeof s === "string" ? s : "";
  return t.length > NOS_MEMBRES_SHORT_DESC_MAX ? t.slice(0, NOS_MEMBRES_SHORT_DESC_MAX) : t;
}

export function normalizeNosMembresOrgLinks(raw: unknown[]): NosMembresOrgLink[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.slice(0, NOS_MEMBRES_ORG_LINKS_MAX).map((item) => {
    const o = (typeof item === "object" && item !== null ? item : {}) as Partial<NosMembresOrgLink>;
    const kindRaw = typeof o.kind === "string" ? o.kind : "website";
    return {
      id:
        typeof o.id === "string" && o.id.trim().length > 0 ? o.id.trim() : newNosMembresOrgLinkId(),
      kind: isNosMembresOrgLinkKind(kindRaw) ? kindRaw : "website",
      url: typeof o.url === "string" ? o.url : "",
    };
  });
}

export function normalizeNosMembresEntries(raw: unknown[]): NosMembresEntry[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.slice(0, NOS_MEMBRES_ENTRIES_MAX).map((item, index) => {
    const o = (typeof item === "object" && item !== null ? item : {}) as Partial<NosMembresEntry>;
    const org = (typeof o.organization === "object" && o.organization !== null
      ? o.organization
      : {}) as Partial<NosMembresOrganization>;
    const rep = (typeof o.representative === "object" && o.representative !== null
      ? o.representative
      : {}) as Partial<NosMembresRepresentative>;
    return {
      id: typeof o.id === "string" && o.id.trim().length > 0 ? o.id.trim() : newNosMembresEntryId(),
      organization: {
        logoUrl: typeof org.logoUrl === "string" ? org.logoUrl : "",
        name: typeof org.name === "string" ? org.name : `Membre ${index + 1}`,
        shortDescription: clampNosMembresShortDescription(
          typeof org.shortDescription === "string" ? org.shortDescription : "",
        ),
        links: normalizeNosMembresOrgLinks(org.links as unknown[]),
      },
      representative: {
        fullName: typeof rep.fullName === "string" ? rep.fullName : "",
        position: typeof rep.position === "string" ? rep.position : "",
        email: typeof rep.email === "string" ? rep.email : "",
        linkedinUrl: typeof rep.linkedinUrl === "string" ? rep.linkedinUrl : "",
      },
    };
  });
}

export function createDefaultNosMembresOrgLink(kind: NosMembresOrgLinkKind = "website"): NosMembresOrgLink {
  return { id: newNosMembresOrgLinkId(), kind, url: "" };
}

export function createDefaultNosMembresEntry(index: number): NosMembresEntry {
  return {
    id: newNosMembresEntryId(),
    organization: {
      logoUrl: "",
      name: `Organisation ${index + 1}`,
      shortDescription: "Brève présentation de l’organisation (visible au survol de la carte).",
      links: [],
    },
    representative: {
      fullName: "",
      position: "",
      email: "",
      linkedinUrl: "",
    },
  };
}

export const DEFAULT_NOS_MEMBRES_CONTENT: NosMembresContent = {
  subtitle: "Découvrez quelques organisations membres du REMESS et leurs représentants.",
  entries: [],
};

/** Section « Galerie » (landing) */
export const GALERIE_DISPLAY_MODES = ["slider", "catalogue", "collage"] as const;
export type GalerieDisplayMode = (typeof GALERIE_DISPLAY_MODES)[number];

export const GALERIE_CATALOGUES_MAX = 20;
export const GALERIE_IMAGES_MAX = 50;

export type GalerieImage = {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
};

export type GalerieCatalogue = {
  id: string;
  name: string;
  description: string;
  images: GalerieImage[];
};

export type GalerieContent = {
  subtitle: string;
  displayMode: GalerieDisplayMode;
  catalogues: GalerieCatalogue[];
};

function newGalerieCatalogueId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `galerie-cat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function newGalerieImageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `galerie-img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function isGalerieDisplayMode(x: string): x is GalerieDisplayMode {
  return (GALERIE_DISPLAY_MODES as readonly string[]).includes(x);
}

export function normalizeGalerieImages(raw: unknown[]): GalerieImage[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.slice(0, GALERIE_IMAGES_MAX).map((item, index) => {
    const o = (typeof item === "object" && item !== null ? item : {}) as Partial<GalerieImage>;
    return {
      id: typeof o.id === "string" && o.id.trim().length > 0 ? o.id.trim() : newGalerieImageId(),
      imageUrl: typeof o.imageUrl === "string" ? o.imageUrl : "",
      title: typeof o.title === "string" ? o.title : `Photo ${index + 1}`,
      description: typeof o.description === "string" ? o.description : "",
    };
  });
}

export function normalizeGalerieCatalogues(raw: unknown[]): GalerieCatalogue[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.slice(0, GALERIE_CATALOGUES_MAX).map((item, index) => {
    const o = (typeof item === "object" && item !== null ? item : {}) as Partial<GalerieCatalogue>;
    const imagesRaw = Array.isArray(o.images) ? o.images : [];
    return {
      id: typeof o.id === "string" && o.id.trim().length > 0 ? o.id.trim() : newGalerieCatalogueId(),
      name: typeof o.name === "string" && o.name.trim() ? o.name : `Catalogue ${index + 1}`,
      description: typeof o.description === "string" ? o.description : "",
      images: normalizeGalerieImages(imagesRaw),
    };
  });
}

export function createDefaultGalerieImage(index: number): GalerieImage {
  return {
    id: newGalerieImageId(),
    imageUrl: "",
    title: `Photo ${index + 1}`,
    description: "",
  };
}

export function createDefaultGalerieCatalogue(index: number): GalerieCatalogue {
  return {
    id: newGalerieCatalogueId(),
    name: `Catalogue ${index + 1}`,
    description: "",
    images: [],
  };
}

export const DEFAULT_GALERIE_CONTENT: GalerieContent = {
  subtitle: "Parcourez nos albums photos par thème ou consultez l’ensemble de la galerie.",
  displayMode: "catalogue",
  catalogues: [],
};

/** Section « Contacter nous » (landing) */
export type ContacterNousContent = {
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  /** Lien Google Maps (partage ou carte avec @lat,lng dans l’URL, ou lien embed) */
  googleMapsUrl: string;
  /** Extrait de l’URL ou saisi ; utilisés pour la carte intégrée */
  latitude: number | null;
  longitude: number | null;
};

export const DEFAULT_CONTACTER_NOUS_CONTENT: ContacterNousContent = {
  address: "",
  phone: "",
  whatsapp: "",
  email: "",
  googleMapsUrl: "",
  latitude: null,
  longitude: null,
};

export const FOOTER_SHORT_TEXT_MAX_CHARS = 250;
export const FOOTER_NAV_LINKS_MAX = 10;
export const FOOTER_ELEMENTS_PER_COLUMN_MAX = 8;
export const FOOTER_SOCIAL_KEYS = [
  "facebook",
  "linkedin",
  "instagram",
  "youtube",
  "x",
] as const;

export type FooterSocialKey = (typeof FOOTER_SOCIAL_KEYS)[number];

export type FooterSocialLink = {
  key: FooterSocialKey;
  label: string;
  url: string;
};

export type FooterQuickNavLink = {
  id: string;
  label: string;
  href: string;
};

export type FooterElementColumn = {
  title: string;
  items: string[];
};

export type FooterContent = {
  logoUrl: string;
  shortText: string;
  socialLinks: FooterSocialLink[];
  quickNavigation: FooterQuickNavLink[];
  elementsColumns: [FooterElementColumn, FooterElementColumn];
  copyrightText: string;
};

function newFooterNavLinkId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `footer-nav-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clampFooterShortText(value: string): string {
  const t = typeof value === "string" ? value : "";
  return t.length > FOOTER_SHORT_TEXT_MAX_CHARS ? t.slice(0, FOOTER_SHORT_TEXT_MAX_CHARS) : t;
}

function normalizeFooterSocialLinks(raw: unknown[]): FooterSocialLink[] {
  const input = Array.isArray(raw) ? raw : [];
  const byKey = new Map<FooterSocialKey, FooterSocialLink>();
  for (const item of input) {
    const o = (typeof item === "object" && item !== null ? item : {}) as Partial<FooterSocialLink>;
    if (!FOOTER_SOCIAL_KEYS.includes(o.key as FooterSocialKey)) continue;
    const key = o.key as FooterSocialKey;
    byKey.set(key, {
      key,
      label: typeof o.label === "string" && o.label.trim() ? o.label : key.toUpperCase(),
      url: typeof o.url === "string" ? o.url : "",
    });
  }
  return FOOTER_SOCIAL_KEYS.map((key) => {
    const current = byKey.get(key);
    return current ?? { key, label: key.toUpperCase(), url: "" };
  });
}

export function normalizeFooterQuickNavigation(raw: unknown[]): FooterQuickNavLink[] {
  const input = Array.isArray(raw) ? raw : [];
  return input.slice(0, FOOTER_NAV_LINKS_MAX).map((item, index) => {
    const o = (typeof item === "object" && item !== null ? item : {}) as Partial<FooterQuickNavLink>;
    return {
      id: typeof o.id === "string" && o.id.trim() ? o.id.trim() : newFooterNavLinkId(),
      label: typeof o.label === "string" ? o.label : `Lien ${index + 1}`,
      href: typeof o.href === "string" ? o.href : "#",
    };
  });
}

function normalizeFooterColumn(raw: unknown, fallbackTitle: string): FooterElementColumn {
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<FooterElementColumn>;
  const itemsRaw = Array.isArray(o.items) ? o.items : [];
  return {
    title: typeof o.title === "string" && o.title.trim() ? o.title : fallbackTitle,
    items: itemsRaw
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter((x) => x.length > 0)
      .slice(0, FOOTER_ELEMENTS_PER_COLUMN_MAX),
  };
}

export function normalizeFooterColumns(raw: unknown): [FooterElementColumn, FooterElementColumn] {
  const input = Array.isArray(raw) ? raw : [];
  const col1 = normalizeFooterColumn(input[0], "Éléments colonne 1");
  const col2 = normalizeFooterColumn(input[1], "Éléments colonne 2");
  return [col1, col2];
}

export function createDefaultFooterQuickNavLink(index: number): FooterQuickNavLink {
  return {
    id: newFooterNavLinkId(),
    label: `Lien rapide ${index + 1}`,
    href: "#",
  };
}

export const DEFAULT_FOOTER_CONTENT: FooterContent = {
  logoUrl: "",
  shortText: "",
  socialLinks: FOOTER_SOCIAL_KEYS.map((key) => ({ key, label: key.toUpperCase(), url: "" })),
  quickNavigation: [
    { id: newFooterNavLinkId(), label: "Accueil", href: "#lp-section-hero" },
    { id: newFooterNavLinkId(), label: "À propos", href: "#lp-section-a-propos-du-remess" },
    { id: newFooterNavLinkId(), label: "Contacter nous", href: "#lp-section-contacter-nous" },
  ],
  elementsColumns: [
    { title: "Éléments colonne 1", items: [] },
    { title: "Éléments colonne 2", items: [] },
  ],
  copyrightText: "REMESS. Tous droits réservés.",
};

export function mergeFooterPayload(raw: unknown): FooterContent {
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<FooterContent>;
  return {
    logoUrl: typeof o.logoUrl === "string" ? o.logoUrl : DEFAULT_FOOTER_CONTENT.logoUrl,
    shortText: clampFooterShortText(typeof o.shortText === "string" ? o.shortText : ""),
    socialLinks: normalizeFooterSocialLinks(o.socialLinks as unknown[]),
    quickNavigation: normalizeFooterQuickNavigation(o.quickNavigation as unknown[]),
    elementsColumns: normalizeFooterColumns(o.elementsColumns),
    copyrightText:
      typeof o.copyrightText === "string" && o.copyrightText.trim()
        ? o.copyrightText
        : DEFAULT_FOOTER_CONTENT.copyrightText,
  };
}

export type HeaderAuthCta = {
  label: string;
  href: string;
};

/** Barre toujours visible en haut au scroll, ou masquée au scroll vers le bas. */
export type HeaderScrollBehavior = "fixed" | "disappearing";

export type HeaderNavIncludeMap = Record<NavigableLandingSectionLabel, boolean>;

export type HeaderContent = {
  /** Logo (URL publique ou data URL) */
  logoUrl: string;
  /** Titre affiché à côté du logo */
  title: string;
  showLogo: boolean;
  showTitle: boolean;
  /** Afficher les boutons Connexion / inscription */
  showAuthButtons: boolean;
  /** Fixe (sticky) ou masquée au scroll vers le bas */
  scrollBehavior: HeaderScrollBehavior;
  /** Sections reliées au header par des liens d’ancrage */
  navIncludeSection: HeaderNavIncludeMap;
  loginCta: HeaderAuthCta;
  signInCta: HeaderAuthCta;
};

export const DEFAULT_HEADER_CONTENT: HeaderContent = {
  logoUrl: "",
  title: "REMESS",
  showLogo: true,
  showTitle: true,
  showAuthButtons: true,
  scrollBehavior: "fixed",
  navIncludeSection: createDefaultNavIncludeSection(),
  loginCta: { label: "Connexion", href: "/auth" },
  signInCta: { label: "S'inscrire", href: "/auth" },
};

/** Ancien format hero (une seule carte) — utile si vous chargez du JSON persisté. */
export type LegacyHeroSectionContent = {
  headline: string;
  subheadline: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

export function isLegacyHeroContent(x: unknown): x is LegacyHeroSectionContent {
  return (
    typeof x === "object" &&
    x !== null &&
    "headline" in x &&
    !("slides" in x) &&
    typeof (x as LegacyHeroSectionContent).headline === "string"
  );
}

export function migrateLegacyHeroContent(legacy: LegacyHeroSectionContent): HeroSectionContent {
  return {
    slides: [
      {
        id: newSlideId(),
        title: legacy.headline,
        subtitle: legacy.subheadline,
        timeLabel: "",
        background: { type: "solid", color: "#4f46e5" },
        showActionButtons: true,
        primaryCta: { label: legacy.primaryCtaLabel, href: legacy.primaryCtaHref },
        secondaryCta: { label: legacy.secondaryCtaLabel, href: legacy.secondaryCtaHref },
      },
    ],
    settings: { slideDurationSec: 5, showNavArrows: true },
  };
}
