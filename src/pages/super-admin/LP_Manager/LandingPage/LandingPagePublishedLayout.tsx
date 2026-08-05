import { ArticlesSection } from "./ArticlesSection";
import { BlogsSection } from "./BlogsSection";
import { AProposRemessSection } from "./AProposRemessSection";
import { EquipeRemessSection } from "./EquipeRemessSection";
import { NosMembresSection } from "./NosMembresSection";
import { GalerieSection } from "./GalerieSection";
import { NosEvenementsSection } from "./NosEvenementsSection";
import { ContacterNousSection } from "./ContacterNousSection";
import { FooterSection } from "./FooterSection";
import { HeaderSection } from "./HeaderSection";
import { HeroSection } from "./HeroSection";
import { LandingPageSectionOutlineTitle } from "./LandingPageSectionOutlineTitle";
import { LandingWaveSection } from "./LandingWaveSection";
import { MotDuPresidentSection } from "./MotDuPresidentSection";
import { RemessEnChiffresSection } from "./RemessEnChiffresSection";
import { BarometreLandingSection } from "./BarometreLandingSection";
import { OpportunitesLandingSection } from "./OpportunitesLandingSection";
import { ProjetsLandingSection } from "./ProjetsLandingSection";
import { LandingVerticalSectionNav } from "./LandingVerticalSectionNav";
import { LANDING_PAGE_SECTION_ANCHOR_ID } from "./landingPageSectionAnchors";
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

export type LandingPagePublishedLayoutProps = {
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
  /** Accueil public : en-tête fixe à la fenêtre pendant le défilement. */
  viewportFixedHeader?: boolean;
  /** Menu site (Accueil, Events, …) + navigation verticale par sections. */
  publicSiteChrome?: boolean;
};

/**
 * Rendu public de la landing : mêmes ancres et ordre que l’aperçu éditeur (sans cadres de section).
 * Logique séparée de `LandingPagePreviewOutline` pour garder le fichier éditeur léger.
 */
export function LandingPagePublishedLayout({
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
  viewportFixedHeader = false,
  publicSiteChrome = false,
}: LandingPagePublishedLayoutProps) {
  return (
    <div className="remess-landing-theme min-h-screen w-full scroll-smooth bg-background text-foreground">
      {publicSiteChrome ? <LandingVerticalSectionNav /> : null}
      <div id={LANDING_PAGE_SECTION_ANCHOR_ID.Header}>
        <HeaderSection
          content={header}
          positionMode={viewportFixedHeader ? "viewport-fixed" : "sticky"}
          showPublicSiteNav={publicSiteChrome}
          suppressSectionNav={publicSiteChrome}
        />
      </div>
      <div id={LANDING_PAGE_SECTION_ANCHOR_ID.Hero} className="scroll-mt-[var(--page-header-height)]">
        <HeroSection content={hero} />
      </div>

      <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID["Mot du président"]} variant="warm">
        <LandingPageSectionOutlineTitle label="Mot du président" />
        <MotDuPresidentSection content={motDuPresident} />
      </LandingWaveSection>

      <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID["À propos du REMESS"]} variant="white">
        <LandingPageSectionOutlineTitle label="À propos du REMESS" />
        <AProposRemessSection content={aProposRemess} />
      </LandingWaveSection>

      <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID["REMESS en chiffres"]} variant="accent">
        <LandingPageSectionOutlineTitle label="REMESS en chiffres" />
        <RemessEnChiffresSection content={remessEnChiffres} hideMainTitle />
      </LandingWaveSection>

      <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID.Cartographie} variant="warm">
        <LandingPageSectionOutlineTitle label="Cartographie" />
        <BarometreLandingSection hideMainTitle />
      </LandingWaveSection>

      <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID["Équipe REMESS"]} variant="cream">
        <LandingPageSectionOutlineTitle label="Équipe REMESS" />
        <EquipeRemessSection content={equipeRemess} />
      </LandingWaveSection>

      <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID["Nos membres"]} variant="white">
        <LandingPageSectionOutlineTitle label="Nos membres" className="py-4 md:py-5" />
        <NosMembresSection content={nosMembres} />
      </LandingWaveSection>

      <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID["Nos événements"]} variant="warm">
        <LandingPageSectionOutlineTitle
          label="Nos événements"
          subtitle="Découvrir les événements organisés par nos membres"
        />
        <NosEvenementsSection />
      </LandingWaveSection>

      <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID.Opportunités} variant="cream">
        <OpportunitesLandingSection />
      </LandingWaveSection>

      <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID.Projets} variant="warm">
        <LandingPageSectionOutlineTitle label="Projets" />
        <ProjetsLandingSection hideMainTitle />
      </LandingWaveSection>

      <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID.Galerie} variant="white">
        <LandingPageSectionOutlineTitle label="Galerie" />
        <GalerieSection content={galerie} />
      </LandingWaveSection>

      <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID.Bibliothèque} variant="cream">
        <LandingPageSectionOutlineTitle
          label="Bibliothèque"
          subtitle="Consulter une bibliothèque riche en ouvrages et publications."
        />
        <ArticlesSection hidePageTitle />
      </LandingWaveSection>

      <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID.Blog} variant="white">
        <LandingPageSectionOutlineTitle label="Blog" />
        <BlogsSection hidePageTitle />
      </LandingWaveSection>

      <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID["Contacter nous"]} variant="accent">
        <LandingPageSectionOutlineTitle label="Contacter nous" />
        <ContacterNousSection content={contacterNous} />
      </LandingWaveSection>

      <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID.Footer} variant="deep">
        <FooterSection content={footer} />
      </LandingWaveSection>
    </div>
  );
}
