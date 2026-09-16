import { ArticlesSection } from "./ArticlesSection";
import { BilanRemessSection } from "./BilanRemessSection";
import { BlogsSection } from "./BlogsSection";
import { AProposRemessSection } from "./AProposRemessSection";
import { EquipeRemessSection } from "./EquipeRemessSection";
import { EquipeSection } from "./EquipeSection";
import { NosMembresSection } from "./NosMembresSection";
import { NosPartenairesSection } from "./NosPartenairesSection";
import { GalerieSection } from "./GalerieSection";
import { ContacterNousSection } from "./ContacterNousSection";
import { FooterSection } from "./FooterSection";
import { HeaderSection } from "./HeaderSection";
import { HeroSection } from "./HeroSection";
import { LandingPageSectionOutlineTitle } from "./LandingPageSectionOutlineTitle";
import { LandingWaveSection } from "./LandingWaveSection";
import { MotDuPresidentSection } from "./MotDuPresidentSection";
import { BarometreLandingSection } from "./BarometreLandingSection";
import { BarometreDonneesLandingSection } from "./BarometreDonneesLandingSection";
import { ProjetsLandingSection } from "./ProjetsLandingSection";
import { LANDING_PAGE_SECTION_ANCHOR_ID } from "./landingPageSectionAnchors";
import { LANDING_PAGE_SECTION_LABELS } from "./landingPageSectionLabels";
import type { LandingPageOutlineTitleLabel } from "./LandingPageSectionOutlineTitle";
import type { LandingWaveVariant } from "./LandingWaveSection";
import {
  createDefaultSectionVisibility,
  isLandingSectionVisible,
  type LandingSectionVisibilityMap,
} from "@/lib/lpLandingSectionVisibility";
import type {
  AProposRemessContent,
  HeaderContent,
  HeroSectionContent,
  MotDuPresidentContent,
  RemessEnChiffresContent,
  EquipeRemessContent,
  EquipeContent,
  NosMembresContent,
  NosPartenairesContent,
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
  equipe: EquipeContent;
  nosMembres: NosMembresContent;
  nosPartenaires: NosPartenairesContent;
  galerie: GalerieContent;
  contacterNous: ContacterNousContent;
  footer: FooterContent;
  sectionVisibility?: LandingSectionVisibilityMap;
};

const SECTION_WAVE_VARIANT: Partial<Record<string, LandingWaveVariant>> = {
  "Mot du président": "warm",
  "À propos du REMESS": "white",
  Cartographie: "warm",
  Baromètre: "white",
  "Conseil Administrative REMESS": "cream",
  Équipe: "white",
  "Nos membres": "cream",
  "Nos partenaires": "white",
  "Nos événements": "warm",
  Opportunités: "cream",
  Projets: "warm",
  Galerie: "cream",
  Bibliothèque: "white",
  "Bilan REMESS": "cream",
  Blog: "cream",
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
  equipe,
  nosMembres,
  nosPartenaires,
  galerie,
  contacterNous,
  footer,
  sectionVisibility = createDefaultSectionVisibility(),
}: LandingPagePreviewOutlineProps) {
  const outlineLabels = LANDING_PAGE_SECTION_LABELS.filter(
    (l) =>
      l !== "Header" &&
      l !== "REMESS en chiffres" &&
      isLandingSectionVisible(sectionVisibility, l),
  );
  const showChiffres = isLandingSectionVisible(sectionVisibility, "REMESS en chiffres");
  return (
    <div className="remess-landing-theme min-h-screen w-full bg-background text-foreground">
      {isLandingSectionVisible(sectionVisibility, "Header") ? (
        <div id={LANDING_PAGE_SECTION_ANCHOR_ID.Header}>
          <HeaderSection content={header} sectionVisibility={sectionVisibility} />
        </div>
      ) : null}
      {outlineLabels.map((label) => {
        if (label === "Hero") {
          return (
            <div
              key={label}
              id={LANDING_PAGE_SECTION_ANCHOR_ID.Hero}
              className="relative z-10 overflow-visible"
            >
              <HeroSection
                content={hero}
                chiffres={remessEnChiffres}
                showChiffres={showChiffres}
              />
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
                className={
                  label === "Nos membres" ||
                  label === "Nos partenaires" ||
                  label === "Conseil Administrative REMESS" ||
                  label === "Équipe"
                    ? "py-4 md:py-5"
                    : undefined
                }
                subtitle={
                  label === "Nos événements"
                    ? "Découvrir les événements organisés par nos membres"
                    : label === "Bibliothèque"
                      ? "Consulter une bibliothèque riche en ouvrages et publications."
                      : label === "Bilan REMESS"
                        ? "Nos réalisations et notre impact sur les territoires."
                        : undefined
                }
              />
            ) : null}
            {label === "Mot du président" ? (
              <MotDuPresidentSection content={motDuPresident} />
            ) : label === "À propos du REMESS" ? (
              <AProposRemessSection content={aProposRemess} />
            ) : label === "Cartographie" ? (
              <BarometreLandingSection hideMainTitle />
            ) : label === "Baromètre" ? (
              <BarometreDonneesLandingSection hideMainTitle />
            ) : label === "Conseil Administrative REMESS" ? (
              <EquipeRemessSection content={equipeRemess} />
            ) : label === "Équipe" ? (
              <EquipeSection content={equipe} />
            ) : label === "Nos membres" ? (
              <NosMembresSection content={nosMembres} />
            ) : label === "Nos partenaires" ? (
              <NosPartenairesSection content={nosPartenaires} />
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
            ) : label === "Bilan REMESS" ? (
              <BilanRemessSection hidePageTitle />
            ) : label === "Blog" ? (
              <BlogsSection hidePageTitle />
            ) : label === "Footer" ? (
              <FooterSection content={footer} contact={contacterNous} />
            ) : (
              <div className="min-h-[3rem]" aria-hidden />
            )}
          </LandingWaveSection>
        );
      })}
    </div>
  );
}
