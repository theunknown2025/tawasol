import { ArticlesSection } from "./ArticlesSection";
import { BlogsSection } from "./BlogsSection";
import { AProposRemessSection } from "./AProposRemessSection";
import { EquipeRemessSection } from "./EquipeRemessSection";
import { NosMembresSection } from "./NosMembresSection";
import { ContacterNousSection } from "./ContacterNousSection";
import { FooterSection } from "./FooterSection";
import { HeaderSection } from "./HeaderSection";
import { HeroSection } from "./HeroSection";
import { LandingPageSectionOutlineTitle } from "./LandingPageSectionOutlineTitle";
import { MotDuPresidentSection } from "./MotDuPresidentSection";
import { RemessEnChiffresSection } from "./RemessEnChiffresSection";
import { BarometreLandingSection } from "./BarometreLandingSection";
import { LANDING_PAGE_SECTION_ANCHOR_ID } from "./landingPageSectionAnchors";
import { LANDING_PAGE_SECTION_LABELS } from "./landingPageSectionLabels";
import type { LandingPageOutlineTitleLabel } from "./LandingPageSectionOutlineTitle";
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

export type LandingPagePreviewOutlineProps = {
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

/** Grille d’aperçu éditeur : titre par section + contenu réel pour les sections déjà branchées. */
export function LandingPagePreviewOutline({
  header,
  hero,
  motDuPresident,
  aProposRemess,
  remessEnChiffres,
  equipeRemess,
  nosMembres,
  contacterNous,
  footer,
}: LandingPagePreviewOutlineProps) {
  const outlineLabels = LANDING_PAGE_SECTION_LABELS.filter((l) => l !== "Header");
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div id={LANDING_PAGE_SECTION_ANCHOR_ID.Header} className="border-b border-border">
        <HeaderSection content={header} />
      </div>
      {outlineLabels.map((label) => {
        if (label === "Hero") {
          return (
            <div
              key={label}
              id={LANDING_PAGE_SECTION_ANCHOR_ID.Hero}
              className="border-b border-border"
            >
              <HeroSection content={hero} />
            </div>
          );
        }

        const outlineLabel = label as LandingPageOutlineTitleLabel;

        return (
          <section
            key={label}
            id={LANDING_PAGE_SECTION_ANCHOR_ID[label]}
            className="border-b border-border"
          >
            <LandingPageSectionOutlineTitle
              label={outlineLabel}
              className={label === "Nos membres" ? "py-4 md:py-5" : undefined}
              subtitle={
                label === "Nos événements"
                  ? "Découvrir les événements organisés par nos membres"
                  : undefined
              }
            />
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
            ) : label === "Contacter nous" ? (
              <ContacterNousSection content={contacterNous} />
            ) : label === "Articles" ? (
              <ArticlesSection hidePageTitle />
            ) : label === "Blog" ? (
              <BlogsSection hidePageTitle />
            ) : label === "Footer" ? (
              <FooterSection content={footer} />
            ) : (
              <div className="min-h-[3rem]" aria-hidden />
            )}
          </section>
        );
      })}
    </div>
  );
}
