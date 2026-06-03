import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  MessageSquareQuote,
  Info,
  BarChart3,
  Map,
  Users,
  UserCircle,
  CalendarDays,
  Briefcase,
  Images,
  Library,
  Newspaper,
  Mail,
} from "lucide-react";
import { LANDING_PAGE_SECTION_ANCHOR_ID } from "./landingPageSectionAnchors";

export type LandingVerticalNavItem = {
  anchorId: string;
  label: string;
  icon: LucideIcon;
};

/** Ordre des sections sur la landing publique (hors Header / Footer). */
export const LANDING_VERTICAL_NAV_SECTIONS: LandingVerticalNavItem[] = [
  { anchorId: LANDING_PAGE_SECTION_ANCHOR_ID.Hero, label: "Accueil", icon: Sparkles },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID["Mot du président"],
    label: "Mot du président",
    icon: MessageSquareQuote,
  },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID["À propos du REMESS"],
    label: "À propos du REMESS",
    icon: Info,
  },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID["REMESS en chiffres"],
    label: "REMESS en chiffres",
    icon: BarChart3,
  },
  { anchorId: LANDING_PAGE_SECTION_ANCHOR_ID.Cartographie, label: "Cartographie", icon: Map },
  { anchorId: LANDING_PAGE_SECTION_ANCHOR_ID["Équipe REMESS"], label: "Équipe REMESS", icon: Users },
  { anchorId: LANDING_PAGE_SECTION_ANCHOR_ID["Nos membres"], label: "Nos membres", icon: UserCircle },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID["Nos événements"],
    label: "Nos événements",
    icon: CalendarDays,
  },
  { anchorId: LANDING_PAGE_SECTION_ANCHOR_ID.Opportunités, label: "Opportunités", icon: Briefcase },
  { anchorId: LANDING_PAGE_SECTION_ANCHOR_ID.Galerie, label: "Galerie", icon: Images },
  { anchorId: LANDING_PAGE_SECTION_ANCHOR_ID.Bibliothèque, label: "Bibliothèque", icon: Library },
  { anchorId: LANDING_PAGE_SECTION_ANCHOR_ID.Blog, label: "Blog", icon: Newspaper },
  {
    anchorId: LANDING_PAGE_SECTION_ANCHOR_ID["Contacter nous"],
    label: "Contacter nous",
    icon: Mail,
  },
];
