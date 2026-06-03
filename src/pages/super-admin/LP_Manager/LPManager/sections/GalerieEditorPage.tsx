import { useState } from "react";
import { Images, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalerieSection } from "../../LandingPage/GalerieSection";
import { LandingPagePreviewer } from "../../LandingPage/LandingPagePreviewer";
import { GalerieManager } from "../GalerieManager";
import { useLpLandingContent } from "../../LpLandingContentContext";

export default function GalerieEditorPage() {
  const { galerie, setGalerie } = useLpLandingContent();
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <Images className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">Galerie</h1>
            <p className="text-sm text-muted-foreground">
              Créez des catalogues (nom, description) et ajoutez des photos avec titre et description.
              Choisissez le mode d’affichage : Slider, Catalogue ou Collage. Sur la landing page, les
              catalogues apparaissent en onglets avec « Tous nos photos ». Enregistrez depuis la barre
              du gestionnaire LP.
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
          <GalerieManager value={galerie} onChange={setGalerie} />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Aperçu</h2>
          <div className="rounded-2xl border border-border bg-muted/30 shadow-sm ring-1 ring-border/50">
            <div className="border-b border-border bg-background/80 px-3 py-2 text-center text-xs font-medium text-muted-foreground">
              Aperçu selon le mode d’affichage sélectionné
            </div>
            <div className="px-2 pb-4 pt-4">
              <GalerieSection content={galerie} />
            </div>
          </div>
        </div>
      </div>

      <LandingPagePreviewer open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  );
}
