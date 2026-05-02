import type { ReactNode } from "react";
import { HeaderSection } from "@/pages/super-admin/LP_Manager/LandingPage/HeaderSection";
import { FooterSection } from "@/pages/super-admin/LP_Manager/LandingPage/FooterSection";
import { DEFAULT_FOOTER_CONTENT, DEFAULT_HEADER_CONTENT } from "@/pages/super-admin/LP_Manager/types";
import { usePublicLpHeader } from "@/hooks/usePublicLpHeader";
import { usePublicLpFooter } from "@/hooks/usePublicLpFooter";

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
  const headerContent = headerRow ?? DEFAULT_HEADER_CONTENT;
  const footerContent = footerRow ?? DEFAULT_FOOTER_CONTENT;

  return (
    <div className="remess-landing-theme flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      {showBrandedHeader ? (
        <HeaderSection content={headerContent} suppressSectionNav showPublicSiteNav />
      ) : null}
      <div className="flex-1">{children}</div>
      {showFooter ? <FooterSection content={footerContent} /> : null}
    </div>
  );
}
