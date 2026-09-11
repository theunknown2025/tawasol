import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  MessageSquareQuote,
  Info,
  BarChart3,
  Map,
  BarChart2,
  Users,
  UsersRound,
  UserCircle,
  Handshake,
  CalendarDays,
  Briefcase,
  FolderKanban,
  Images,
  Library,
  Newspaper,
  Mail,
} from "lucide-react";
import { LANDING_PAGE_SECTION_ANCHOR_ID } from "./landingPageSectionAnchors";
import type { LandingPageSectionLabel } from "./landingPageSectionLabels";

export type LandingVerticalNavItem = {
  anchorId: string;
  label: string;
  icon: LucideIcon;
  /** Label canonique pour la carte de visibilité. */
  sectionLabel: LandingPageSectionLabel;
};

/** Ordre des sections sur la landing publique (hors Header / Footer). */
export const LANDING_VERTICAL_NAV_SECTIONS: LandingVerticalNavItem[] = [
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID.Hero,
    label: "Accueil",
    icon: Sparkles,
    sectionLabel: "Hero",
  },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID["Mot du président"],
    label: "Mot du président",
    icon: MessageSquareQuote,
    sectionLabel: "Mot du président",
  },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID["À propos du REMESS"],
    label: "À propos du REMESS",
    icon: Info,
    sectionLabel: "À propos du REMESS",
  },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID["REMESS en chiffres"],
    label: "REMESS en chiffres",
    icon: BarChart3,
    sectionLabel: "REMESS en chiffres",
  },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID.Cartographie,
    label: "Cartographie",
    icon: Map,
    sectionLabel: "Cartographie",
  },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID.Baromètre,
    label: "Baromètre",
    icon: BarChart2,
    sectionLabel: "Baromètre",
  },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID["Conseil Administrative REMESS"],
    label: "Conseil Administrative REMESS",
    icon: Users,
    sectionLabel: "Conseil Administrative REMESS",
  },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID.Équipe,
    label: "Équipe",
    icon: UsersRound,
    sectionLabel: "Équipe",
  },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID["Nos membres"],
    label: "Nos membres",
    icon: UserCircle,
    sectionLabel: "Nos membres",
  },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID["Nos partenaires"],
    label: "Nos partenaires",
    icon: Handshake,
    sectionLabel: "Nos partenaires",
  },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID["Nos événements"],
    label: "Nos événements",
    icon: CalendarDays,
    sectionLabel: "Nos événements",
  },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID.Opportunités,
    label: "Opportunités",
    icon: Briefcase,
    sectionLabel: "Opportunités",
  },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID.Projets,
    label: "Projets",
    icon: FolderKanban,
    sectionLabel: "Projets",
  },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID.Galerie,
    label: "Galerie",
    icon: Images,
    sectionLabel: "Galerie",
  },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID.Bibliothèque,
    label: "Bibliothèque",
    icon: Library,
    sectionLabel: "Bibliothèque",
  },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID.Blog,
    label: "Blog",
    icon: Newspaper,
    sectionLabel: "Blog",
  },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID["Contacter nous"],
    label: "Contacter nous",
    icon: Mail,
    sectionLabel: "Contacter nous",
  },
];
