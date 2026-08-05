import { ArticlesSection } from "./ArticlesSection";
import { BlogsSection } from "./BlogsSection";
import { AProposRemessSection } from "./AProposRemessSection";
import { EquipeRemessSection } from "./EquipeRemessSection";
import { NosMembresSection } from "./NosMembresSection";
import { GalerieSection } from "./GalerieSection";
import { ContacterNousSection } from "./ContacterNousSection";
import { FooterSection } from "./FooterSection";
import { HeaderSection } from "./HeaderSection";
import { HeroSection } from "./HeroSection";
import { LandingPageSectionOutlineTitle } from "./LandingPageSectionOutlineTitle";
import { LandingWaveSection } from "./LandingWaveSection";
import { MotDuPresidentSection } from "./MotDuPresidentSection";
import { RemessEnChiffresSection } from "./RemessEnChiffresSection";
import { BarometreLandingSection } from "./BarometreLandingSection";
import { ProjetsLandingSection } from "./ProjetsLandingSection";
import { LANDING_PAGE_SECTION_ANCHOR_ID } from "./landingPageSectionAnchors";
import { LANDING_PAGE_SECTION_LABELS } from "./landingPageSectionLabels";
import type { LandingPageOutlineTitleLabel } from "./LandingPageSectionOutlineTitle";
import type { LandingWaveVariant } from "./LandingWaveSection";
import type {
  AProposRemessContent,
  HeaderContent,
  HeroSectionContent,
  MotDuPresidentContent,
  RemessEnChiffresContent,
  EquipeRemessContent,
  NosMembresContent,
  GalerieContent,
  ContacterNousContent,
  FooterContent,
} from "../types";

export type LandingPagePreviewOutlineProps = {
  header: HeaderContent;
  hero: HeroSectionContent;
  motDuPresident: MotDuPresidentContent;
  aProposRemess: AProposRemessContent;
  remessEnChiffres: RemessEnChiffresContent;
  equipeRemess: EquipeRemessContent;
  nosMembres: NosMembresContent;
  galerie: GalerieContent;
  contacterNous: ContacterNousContent;
  footer: FooterContent;
};

const SECTION_WAVE_VARIANT: Partial<Record<string, LandingWaveVariant>> = {
  "Mot du président": "warm",
  "À propos du REMESS": "white",
  "REMESS en chiffres": "accent",
  Cartographie: "warm",
  "Équipe REMESS": "cream",
  "Nos membres": "white",
  "Nos événements": "warm",
  Opportunités: "cream",
  Projets: "warm",
  Galerie: "white",
  Bibliothèque: "cream",
  Blog: "white",
  "Contacter nous": "accent",
  Footer: "deep",
};

/** Grille d’aperçu éditeur : titre par section + contenu réel pour les sections déjà branchées. */
export function LandingPagePreviewOutline({
  header,
  hero,
  motDuPresident,
  aProposRemess,
  remessEnChiffres,
  equipeRemess,
  nosMembres,
  galerie,
  contacterNous,
  footer,
}: LandingPagePreviewOutlineProps) {
  const outlineLabels = LANDING_PAGE_SECTION_LABELS.filter((l) => l !== "Header");
  return (
    <div className="remess-landing-theme min-h-screen w-full bg-background text-foreground">
      <div id={LANDING_PAGE_SECTION_ANCHOR_ID.Header}>
        <HeaderSection content={header} />
      </div>
      {outlineLabels.map((label) => {
        if (label === "Hero") {
          return (
            <div key={label} id={LANDING_PAGE_SECTION_ANCHOR_ID.Hero}>
              <HeroSection content={hero} />
            </div>
          );
        }

        const outlineLabel = label as LandingPageOutlineTitleLabel;
        const variant = SECTION_WAVE_VARIANT[label] ?? "cream";

        return (
          <LandingWaveSection
            key={label}
            id={LANDING_PAGE_SECTION_ANCHOR_ID[label]}
            variant={variant}
          >
            {label !== "Footer" ? (
              <LandingPageSectionOutlineTitle
                label={outlineLabel}
                className={label === "Nos membres" ? "py-4 md:py-5" : undefined}
                subtitle={
                  label === "Nos événements"
                    ? "Découvrir les événements organisés par nos membres"
                    : label === "Bibliothèque"
                      ? "Consulter une bibliothèque riche en ouvrages et publications."
                      : undefined
                }
              />
            ) : null}
            {label === "Mot du président" ? (
              <MotDuPresidentSection content={motDuPresident} />
            ) : label === "À propos du REMESS" ? (
              <AProposRemessSection content={aProposRemess} />
            ) : label === "REMESS en chiffres" ? (
              <RemessEnChiffresSection content={remessEnChiffres} hideMainTitle />
            ) : label === "Cartographie" ? (
              <BarometreLandingSection hideMainTitle />
            ) : label === "Équipe REMESS" ? (
              <EquipeRemessSection content={equipeRemess} />
            ) : label === "Nos membres" ? (
              <NosMembresSection content={nosMembres} />
            ) : label === "Nos événements" ? (
              <div className="min-h-[3rem]" aria-hidden />
            ) : label === "Projets" ? (
              <ProjetsLandingSection hideMainTitle />
            ) : label === "Galerie" ? (
              <GalerieSection content={galerie} />
            ) : label === "Contacter nous" ? (
              <ContacterNousSection content={contacterNous} />
            ) : label === "Bibliothèque" ? (
              <ArticlesSection hidePageTitle />
            ) : label === "Blog" ? (
              <BlogsSection hidePageTitle />
            ) : label === "Footer" ? (
              <FooterSection content={footer} />
            ) : (
              <div className="min-h-[3rem]" aria-hidden />
            )}
          </LandingWaveSection>
        );
      })}
    </div>
  );
}
