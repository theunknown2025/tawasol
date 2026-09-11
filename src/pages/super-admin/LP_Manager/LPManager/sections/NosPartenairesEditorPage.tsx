import { useState } from "react";
import { Handshake, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NosPartenairesSection } from "../../LandingPage/NosPartenairesSection";
import { LandingPagePreviewer } from "../../LandingPage/LandingPagePreviewer";
import { NosPartenairesManager } from "../NosPartenairesManager";
import { useLpLandingContent } from "../../LpLandingContentContext";

export default function NosPartenairesEditorPage() {
  const { nosPartenaires, setNosPartenaires } = useLpLandingContent();
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <Handshake className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">Nos partenaires</h1>
            <p className="text-sm text-muted-foreground">
              Ajoutez nom, logo, URL du site et description. Sur la landing, deux cartes s’affichent à
              la fois : logo à gauche, titre en haut, aperçu de la description (10 mots) à droite, et
              « Plus » ouvre la fiche complète. Enregistrez depuis la barre du gestionnaire LP.
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
          <h2 className="mb-4 text-lg font-semibold text-foreground">Fiches partenaires</h2>
          <NosPartenairesManager value={nosPartenaires} onChange={setNosPartenaires} />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Aperçu</h2>
          <div className="rounded-2xl border border-border bg-muted/30 shadow-sm ring-1 ring-border/50">
            <div className="border-b border-border bg-background/80 px-3 py-2 text-center text-xs font-medium text-muted-foreground">
              Logo à gauche · titre en haut · « Plus » pour le détail
            </div>
            <div className="px-2 pb-4 pt-4">
              <NosPartenairesSection content={nosPartenaires} />
            </div>
          </div>
        </div>
      </div>

      <LandingPagePreviewer open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  );
}
