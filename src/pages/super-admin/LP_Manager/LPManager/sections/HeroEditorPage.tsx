import { useState } from "react";
import { LayoutTemplate, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSection } from "../../LandingPage/HeroSection";
import { LandingPagePreviewer } from "../../LandingPage/LandingPagePreviewer";
import { HeroSectionManager } from "../HeroSectionManager";
import { useLpLandingContent } from "../../LpLandingContentContext";

export default function HeroEditorPage() {
  const { hero, setHero } = useLpLandingContent();
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <LayoutTemplate className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">Hero</h1>
            <p className="text-sm text-muted-foreground">
              Contenu du bandeau principal ; l’aperçu reflète les réglages en direct.
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
          <HeroSectionManager value={hero} onChange={setHero} />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Aperçu</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-muted/30 shadow-sm ring-1 ring-border/50">
            <div className="max-h-[min(85vh,900px)] overflow-y-auto rounded-b-2xl bg-background">
              <HeroSection content={hero} className="min-h-[50vh] py-14" />
            </div>
          </div>
        </div>
      </div>

      <LandingPagePreviewer open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  );
}
