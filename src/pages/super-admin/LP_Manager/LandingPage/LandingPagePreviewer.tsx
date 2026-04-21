import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLpLandingContent } from "../LpLandingContentContext";
import Main from "./Main";

type LandingPagePreviewerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LandingPagePreviewer({ open, onOpenChange }: LandingPagePreviewerProps) {
  const {
    header,
    hero,
    motDuPresident,
    aProposRemess,
    remessEnChiffres,
    equipeRemess,
    nosMembres,
    contacterNous,
  } = useLpLandingContent();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label="Aperçu plein écran de la landing page"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <p className="text-sm font-medium text-foreground">Aperçu — landing page</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" aria-hidden />
          Fermer
        </Button>
      </header>
      <div className="min-h-0 flex-1 scroll-smooth overflow-y-auto overflow-x-hidden">
        <Main
          header={header}
          hero={hero}
          motDuPresident={motDuPresident}
          aProposRemess={aProposRemess}
          remessEnChiffres={remessEnChiffres}
          equipeRemess={equipeRemess}
          nosMembres={nosMembres}
          contacterNous={contacterNous}
          showSectionOutline
        />
      </div>
    </div>,
    document.body,
  );
}
