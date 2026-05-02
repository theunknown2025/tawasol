import { ArticlesSection } from "./ArticlesSection";
import { BlogsSection } from "./BlogsSection";
import { AProposRemessSection } from "./AProposRemessSection";
import { EquipeRemessSection } from "./EquipeRemessSection";
import { NosMembresSection } from "./NosMembresSection";
import { NosEvenementsSection } from "./NosEvenementsSection";
import { ContacterNousSection } from "./ContacterNousSection";
import { FooterSection } from "./FooterSection";
import { HeaderSection } from "./HeaderSection";
import { HeroSection } from "./HeroSection";
import { LandingPageSectionOutlineTitle } from "./LandingPageSectionOutlineTitle";
import { MotDuPresidentSection } from "./MotDuPresidentSection";
import { RemessEnChiffresSection } from "./RemessEnChiffresSection";
import { BarometreLandingSection } from "./BarometreLandingSection";
import { LANDING_PAGE_SECTION_ANCHOR_ID } from "./landingPageSectionAnchors";
import type {
  AProposRemessContent,
  HeaderContent,
  HeroSectionContent,
  MotDuPresidentContent,
  RemessEnChiffresContent,
  EquipeRemessContent,
  NosMembresContent,
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
  contacterNous: ContacterNousContent;
  footer: FooterContent;
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
  contacterNous,
  footer,
}: LandingPagePublishedLayoutProps) {
  return (
    <div className="remess-landing-theme min-h-screen w-full scroll-smooth bg-background text-foreground">
      <div id={LANDING_PAGE_SECTION_ANCHOR_ID.Header}>
        <HeaderSection content={header} />
      </div>
      <div id={LANDING_PAGE_SECTION_ANCHOR_ID.Hero}>
        <HeroSection content={hero} />
      </div>
      <section
        id={LANDING_PAGE_SECTION_ANCHOR_ID["Mot du président"]}
        className="border-t border-border"
      >
        <LandingPageSectionOutlineTitle label="Mot du président" />
        <MotDuPresidentSection content={motDuPresident} />
      </section>
      <section
        id={LANDING_PAGE_SECTION_ANCHOR_ID["À propos du REMESS"]}
        className="border-t border-border"
      >
        <LandingPageSectionOutlineTitle label="À propos du REMESS" />
        <AProposRemessSection content={aProposRemess} />
      </section>
      <section
        id={LANDING_PAGE_SECTION_ANCHOR_ID["REMESS en chiffres"]}
        className="border-t border-border"
      >
        <LandingPageSectionOutlineTitle label="REMESS en chiffres" />
        <RemessEnChiffresSection content={remessEnChiffres} hideMainTitle />
      </section>
      <section id={LANDING_PAGE_SECTION_ANCHOR_ID.Baromètre} className="border-t border-border">
        <LandingPageSectionOutlineTitle label="Baromètre" />
        <BarometreLandingSection hideMainTitle />
      </section>
      <section
        id={LANDING_PAGE_SECTION_ANCHOR_ID["Équipe REMESS"]}
        className="border-t border-border"
      >
        <LandingPageSectionOutlineTitle label="Équipe REMESS" />
        <EquipeRemessSection content={equipeRemess} />
      </section>
      <section
        id={LANDING_PAGE_SECTION_ANCHOR_ID["Nos membres"]}
        className="border-t border-border"
      >
        <LandingPageSectionOutlineTitle label="Nos membres" className="py-4 md:py-5" />
        <NosMembresSection content={nosMembres} />
      </section>
      <section
        id={LANDING_PAGE_SECTION_ANCHOR_ID["Nos événements"]}
        className="border-t border-border"
      >
        <LandingPageSectionOutlineTitle
          label="Nos événements"
          subtitle="Découvrir les événements organisés par nos membres"
        />
        <NosEvenementsSection />
      </section>
      <section id={LANDING_PAGE_SECTION_ANCHOR_ID.Articles} className="border-t border-border">
        <LandingPageSectionOutlineTitle label="Articles" />
        <ArticlesSection hidePageTitle />
      </section>
      <section id={LANDING_PAGE_SECTION_ANCHOR_ID.Blog} className="border-t border-border">
        <LandingPageSectionOutlineTitle label="Blog" />
        <BlogsSection hidePageTitle />
      </section>
      <section
        id={LANDING_PAGE_SECTION_ANCHOR_ID["Contacter nous"]}
        className="border-t border-border"
      >
        <LandingPageSectionOutlineTitle label="Contacter nous" />
        <ContacterNousSection content={contacterNous} />
      </section>
      <section id={LANDING_PAGE_SECTION_ANCHOR_ID.Footer} className="border-t border-border">
        <FooterSection content={footer} />
      </section>
    </div>
  );
}
