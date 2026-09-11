import type { ReactNode } from "react";
import { HeaderSection } from "@/pages/super-admin/LP_Manager/LandingPage/HeaderSection";
import { FooterSection } from "@/pages/super-admin/LP_Manager/LandingPage/FooterSection";
import { LandingWaveSection } from "@/pages/super-admin/LP_Manager/LandingPage/LandingWaveSection";
import { LANDING_PAGE_SECTION_ANCHOR_ID } from "@/pages/super-admin/LP_Manager/LandingPage/landingPageSectionAnchors";
import {
  DEFAULT_CONTACTER_NOUS_CONTENT,
  DEFAULT_FOOTER_CONTENT,
  DEFAULT_HEADER_CONTENT,
} from "@/pages/super-admin/LP_Manager/types";
import { usePublicLpHeader } from "@/hooks/usePublicLpHeader";
import { usePublicLpFooter } from "@/hooks/usePublicLpFooter";
import { usePublicLpContacterNous } from "@/hooks/usePublicLpContacterNous";
import { usePublicLpSectionVisibility } from "@/hooks/usePublicLpSectionVisibility";
import {
  createDefaultSectionVisibility,
  isLandingSectionVisible,
} from "@/lib/lpLandingSectionVisibility";

type PublicShellProps = {
  children: ReactNode;
  /** When false, only children are shown (rare). */
  showBrandedHeader?: boolean;
  /** Même pied de page que la landing (contenu `lp_landing_footer`). */
  showFooter?: boolean;
};

export function PublicShell({
  children,
  showBrandedHeader = true,
  showFooter = true,
}: PublicShellProps) {
  const { data: headerRow } = usePublicLpHeader();
  const { data: footerRow } = usePublicLpFooter();
  const { data: contacterNousRow } = usePublicLpContacterNous();
  const { data: sectionVisibility } = usePublicLpSectionVisibility();
  const headerContent = headerRow ?? DEFAULT_HEADER_CONTENT;
  const footerContent = footerRow ?? DEFAULT_FOOTER_CONTENT;
  const contacterNous = contacterNousRow ?? DEFAULT_CONTACTER_NOUS_CONTENT;
  const visibility = sectionVisibility ?? createDefaultSectionVisibility();
  const showHeader = showBrandedHeader && isLandingSectionVisible(visibility, "Header");
  const showFooterSection = showFooter && isLandingSectionVisible(visibility, "Footer");

  return (
    <div className="remess-landing-theme flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      {showHeader ? (
        <HeaderSection
          content={headerContent}
          suppressSectionNav
          showPublicSiteNav
          sectionVisibility={visibility}
        />
      ) : null}
      <div className="flex-1">{children}</div>
      {showFooterSection ? (
        <LandingWaveSection id={LANDING_PAGE_SECTION_ANCHOR_ID.Footer} variant="deep">
          <FooterSection content={footerContent} contact={contacterNous} />
        </LandingWaveSection>
      ) : null}
    </div>
  );
}
