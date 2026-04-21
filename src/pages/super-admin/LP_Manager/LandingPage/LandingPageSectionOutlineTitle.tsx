import {
  BarChart3,
  CalendarDays,
  Handshake,
  Info,
  Mail,
  Newspaper,
  PanelBottom,
  Quote,
  type LucideIcon,
  UserSquare2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingPageSectionLabel } from "./landingPageSectionLabels";

/** Sections qui affichent un titre « cadre » au-dessus du bloc (comme l’aperçu éditeur). */
export type LandingPageOutlineTitleLabel = Exclude<LandingPageSectionLabel, "Hero" | "Header">;

const SECTION_TITLE_ICONS: Record<LandingPageOutlineTitleLabel, LucideIcon> = {
  "Mot du président": Quote,
  "À propos du REMESS": Info,
  "REMESS en chiffres": BarChart3,
  "Équipe REMESS": Users,
  "Nos membres": UserSquare2,
  "Nos partenaires": Handshake,
  "Nos événements": CalendarDays,
  Articles: Newspaper,
  "Contacter nous": Mail,
  Footer: PanelBottom,
};

/**
 * Titre de section (aperçu & page publique) : centré, icône + libellé, cohérent avec l’éditeur.
 */
export function LandingPageSectionOutlineTitle({
  label,
  className,
}: {
  label: LandingPageOutlineTitleLabel;
  /** Ex. espacement réduit pour une section avec sous-titre + carrousel serrés */
  className?: string;
}) {
  const Icon = SECTION_TITLE_ICONS[label];
  return (
    <h2
      className={cn(
        "group flex cursor-default select-none items-center justify-center gap-3 px-4 py-8 text-center text-xl font-semibold tracking-tight text-muted-foreground transition-colors duration-200 hover:text-foreground md:gap-3.5 md:py-10 md:text-2xl lg:text-3xl",
        className,
      )}
    >
      <Icon
        className="h-7 w-7 shrink-0 opacity-90 transition-all duration-200 group-hover:scale-110 group-hover:text-primary md:h-8 md:w-8 lg:h-9 lg:w-9"
        aria-hidden
      />
      <span className="border-b-[3px] border-transparent pb-1 transition-all duration-200 group-hover:border-primary group-hover:text-foreground">
        {label}
      </span>
    </h2>
  );
}
