import { ArticlesSection } from "./ArticlesSection";
import { BlogsSection } from "./BlogsSection";
import { AProposRemessSection } from "./AProposRemessSection";
import { EquipeRemessSection } from "./EquipeRemessSection";
import { EquipeSection } from "./EquipeSection";
import { NosMembresSection } from "./NosMembresSection";
import { NosPartenairesSection } from "./NosPartenairesSection";
import { GalerieSection } from "./GalerieSection";
import { NosEvenementsSection } from "./NosEvenementsSection";
import { ContacterNousSection } from "./ContacterNousSection";
import { FooterSection } from "./FooterSection";
import { HeaderSection } from "./HeaderSection";
import { HeroSection } from "./HeroSection";
import { LandingPageSectionOutlineTitle } from "./LandingPageSectionOutlineTitle";
import { LandingWaveSection } from "./LandingWaveSection";
import { MotDuPresidentSection } from "./MotDuPresidentSection";
import HeroLatestPublicationsSlider from "@/components/landing/HeroLatestPublicationsSlider";
import { RemessEnChiffresSection } from "./RemessEnChiffresSection";
import { BarometreLandingSection } from "./BarometreLandingSection";
import { BarometreDonneesLandingSection } from "./BarometreDonneesLandingSection";
import { OpportunitesLandingSection } from "./OpportunitesLandingSection";
import { ProjetsLandingSection } from "./ProjetsLandingSection";
import { LANDING_PAGE_SECTION_ANCHOR_ID } from "./landingPageSectionAnchors";
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

export type LandingPagePublishedLayoutProps = {
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
  /** Accueil public : en-tête fixe à la fenêtre pendant le défilement. */
  viewportFixedHeader?: boolean;
  /** Menu site (Accueil, Events, …) avec sous-menu Accueil vers les sections. */
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
  equipe,
  nosMembres,
  nosPartenaires,
  galerie,
  contacterNous,
  footer,
  sectionVisibility = createDefaultSectionVisibility(),
  viewportFixedHeader = false,
  publicSiteChrome = false,
}: LandingPagePublishedLayoutProps) {
  const visible = (label: Parameters<typeof isLandingSectionVisible>[1]) =>
    isLandingSectionVisible(sectionVisibility, label);

  return (
    <div className="remess-landing-theme min-h-screen w-full scroll-smooth bg-background text-foreground">
      {visible("Header") ? (
        <div id={LANDING_PAGE_SECTION_ANCHOR_ID.Header}>
          <HeaderSection
            content={header}
            positionMode={viewportFixedHeader ? "viewport-fixed" : "sticky"}
            showPublicSiteNav={publicSiteChrome}
            suppressSectionNav={publicSiteChrome}
            sectionVisibility={sectionVisibility}
          />
        </div>
      ) : null}
      {visible("Hero") ? (
        <div id={LANDING_PAGE_SECTION_ANCHOR_ID.Hero} className="scroll-mt-[var(--page-header-height)]">
          <HeroSection content={hero} />
        </div>
      ) : null}

      {visible("Mot du président") ? (
        <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID["Mot du président"]} variant="warm">
          <HeroLatestPublicationsSlider />
          <LandingPageSectionOutlineTitle label="Mot du président" />
          <MotDuPresidentSection content={motDuPresident} />
        </LandingWaveSection>
      ) : null}

      {visible("À propos du REMESS") ? (
        <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID["À propos du REMESS"]} variant="white">
          <LandingPageSectionOutlineTitle label="À propos du REMESS" />
          <AProposRemessSection content={aProposRemess} />
        </LandingWaveSection>
      ) : null}

      {visible("REMESS en chiffres") ? (
        <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID["REMESS en chiffres"]} variant="accent">
          <LandingPageSectionOutlineTitle label="REMESS en chiffres" />
          <RemessEnChiffresSection content={remessEnChiffres} hideMainTitle />
        </LandingWaveSection>
      ) : null}

      {visible("Cartographie") ? (
        <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID.Cartographie} variant="warm">
          <LandingPageSectionOutlineTitle label="Cartographie" />
          <BarometreLandingSection hideMainTitle />
        </LandingWaveSection>
      ) : null}

      {visible("Baromètre") ? (
        <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID.Baromètre} variant="white">
          <LandingPageSectionOutlineTitle label="Baromètre" />
          <BarometreDonneesLandingSection hideMainTitle />
        </LandingWaveSection>
      ) : null}

      {visible("Conseil Administrative REMESS") ? (
        <LandingWaveSection
          id={LANDING_PAGE_SECTION_ANCHOR_ID["Conseil Administrative REMESS"]}
          variant="cream"
        >
          <LandingPageSectionOutlineTitle
            label="Conseil Administrative REMESS"
            className="py-4 md:py-5"
          />
          <EquipeRemessSection content={equipeRemess} />
        </LandingWaveSection>
      ) : null}

      {visible("Équipe") ? (
        <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID.Équipe} variant="white">
          <LandingPageSectionOutlineTitle label="Équipe" className="py-4 md:py-5" />
          <EquipeSection content={equipe} />
        </LandingWaveSection>
      ) : null}

      {visible("Nos membres") ? (
        <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID["Nos membres"]} variant="cream">
          <LandingPageSectionOutlineTitle label="Nos membres" className="py-4 md:py-5" />
          <NosMembresSection content={nosMembres} />
        </LandingWaveSection>
      ) : null}

      {visible("Nos partenaires") ? (
        <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID["Nos partenaires"]} variant="white">
          <LandingPageSectionOutlineTitle label="Nos partenaires" className="py-4 md:py-5" />
          <NosPartenairesSection content={nosPartenaires} />
        </LandingWaveSection>
      ) : null}

      {visible("Nos événements") ? (
        <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID["Nos événements"]} variant="warm">
          <LandingPageSectionOutlineTitle
            label="Nos événements"
            subtitle="Découvrir les événements organisés par nos membres"
          />
          <NosEvenementsSection />
        </LandingWaveSection>
      ) : null}

      {visible("Opportunités") ? (
        <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID.Opportunités} variant="cream">
          <OpportunitesLandingSection />
        </LandingWaveSection>
      ) : null}

      {visible("Projets") ? (
        <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID.Projets} variant="warm">
          <LandingPageSectionOutlineTitle label="Projets" />
          <ProjetsLandingSection hideMainTitle />
        </LandingWaveSection>
      ) : null}

      {visible("Galerie") ? (
        <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID.Galerie} variant="white">
          <LandingPageSectionOutlineTitle label="Galerie" />
          <GalerieSection content={galerie} />
        </LandingWaveSection>
      ) : null}

      {visible("Bibliothèque") ? (
        <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID.Bibliothèque} variant="cream">
          <LandingPageSectionOutlineTitle
            label="Bibliothèque"
            subtitle="Consulter une bibliothèque riche en ouvrages et publications."
          />
          <ArticlesSection hidePageTitle />
        </LandingWaveSection>
      ) : null}

      {visible("Blog") ? (
        <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID.Blog} variant="white">
          <LandingPageSectionOutlineTitle label="Blog" />
          <BlogsSection hidePageTitle />
        </LandingWaveSection>
      ) : null}

      {visible("Contacter nous") ? (
        <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID["Contacter nous"]} variant="accent">
          <LandingPageSectionOutlineTitle label="Contacter nous" />
          <ContacterNousSection content={contacterNous} />
        </LandingWaveSection>
      ) : null}

      {visible("Footer") ? (
        <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID.Footer} variant="deep">
          <FooterSection content={footer} contact={contacterNous} />
        </LandingWaveSection>
      ) : null}
    </div>
  );
}
