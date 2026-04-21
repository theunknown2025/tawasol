import { useState } from "react";
import { Info, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AProposRemessSection } from "../../LandingPage/AProposRemessSection";
import { LandingPagePreviewer } from "../../LandingPage/LandingPagePreviewer";
import { useLpLandingContent } from "../../LpLandingContentContext";
import { AProposRemessManager } from "../AProposRemessManager";

export default function AProposDuRemessEditorPage() {
  const { aProposRemess, setAProposRemess } = useLpLandingContent();
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <Info className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">À propos du REMESS</h1>
            <p className="text-sm text-muted-foreground">
              Mission à gauche (texte + bouton lien ou document PDF). À droite, le bloc « Nos valeurs
              » : cartes carrées avec icône, titre et description (4 à 6 valeurs).
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label="Aperçu plein écran de la landing page"
          title="Aperçu plein écran"
          onClick={() => setPreviewOpen(true)}
        >
          <Maximize2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Réglages</h2>
          <AProposRemessManager value={aProposRemess} onChange={setAProposRemess} />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Aperçu</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-muted/30 shadow-sm ring-1 ring-border/50">
            <AProposRemessSection content={aProposRemess} />
          </div>
        </div>
      </div>

      <LandingPagePreviewer open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  );
}
