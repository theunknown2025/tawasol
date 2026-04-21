import {
  DEFAULT_A_PROPOS_REMESS_CONTENT,
  DEFAULT_EQUIPE_REMESS_CONTENT,
  DEFAULT_NOS_MEMBRES_CONTENT,
  DEFAULT_CONTACTER_NOUS_CONTENT,
  DEFAULT_HEADER_CONTENT,
  DEFAULT_HERO_CONTENT,
  DEFAULT_MOT_DU_PRESIDENT_CONTENT,
  DEFAULT_REMESS_EN_CHIFFRES_CONTENT,
  type AProposRemessContent,
  type EquipeRemessContent,
  type NosMembresContent,
  type ContacterNousContent,
  type HeaderContent,
  type HeroSectionContent,
  type MotDuPresidentContent,
  type RemessEnChiffresContent,
} from "../types";
import { LandingPagePreviewOutline } from "./LandingPagePreviewOutline";
import { LandingPagePublishedLayout } from "./LandingPagePublishedLayout";

type MainProps = {
  header?: HeaderContent;
  hero?: HeroSectionContent;
  motDuPresident?: MotDuPresidentContent;
  aProposRemess?: AProposRemessContent;
  remessEnChiffres?: RemessEnChiffresContent;
  equipeRemess?: EquipeRemessContent;
  nosMembres?: NosMembresContent;
  contacterNous?: ContacterNousContent;
  /** Aperçu LP : une zone par section avec son titre (hero = carrousel réel). */
  showSectionOutline?: boolean;
};

export default function Main({
  header = DEFAULT_HEADER_CONTENT,
  hero = DEFAULT_HERO_CONTENT,
  motDuPresident = DEFAULT_MOT_DU_PRESIDENT_CONTENT,
  aProposRemess = DEFAULT_A_PROPOS_REMESS_CONTENT,
  remessEnChiffres = DEFAULT_REMESS_EN_CHIFFRES_CONTENT,
  equipeRemess = DEFAULT_EQUIPE_REMESS_CONTENT,
  nosMembres = DEFAULT_NOS_MEMBRES_CONTENT,
  contacterNous = DEFAULT_CONTACTER_NOUS_CONTENT,
  showSectionOutline,
}: MainProps) {
  if (showSectionOutline) {
    return (
      <LandingPagePreviewOutline
        header={header}
        hero={hero}
        motDuPresident={motDuPresident}
        aProposRemess={aProposRemess}
        remessEnChiffres={remessEnChiffres}
        equipeRemess={equipeRemess}
        nosMembres={nosMembres}
        contacterNous={contacterNous}
      />
    );
  }

  return (
    <LandingPagePublishedLayout
      header={header}
      hero={hero}
      motDuPresident={motDuPresident}
      aProposRemess={aProposRemess}
      remessEnChiffres={remessEnChiffres}
      equipeRemess={equipeRemess}
      nosMembres={nosMembres}
      contacterNous={contacterNous}
    />
  );
}
