import { useState } from "react";
import { Maximize2, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MotDuPresidentSection } from "../../LandingPage/MotDuPresidentSection";
import { LandingPagePreviewer } from "../../LandingPage/LandingPagePreviewer";
import { MotDuPresidentManager } from "../MotDuPresidentManager";
import { useLpLandingContent } from "../../LpLandingContentContext";

export default function MotDuPresidentEditorPage() {
  const { motDuPresident, setMotDuPresident } = useLpLandingContent();
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <Quote className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">Mot du président</h1>
            <p className="text-sm text-muted-foreground">
              Photo, identité, texte et signature affichée avec une police dédiée.
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
          <MotDuPresidentManager value={motDuPresident} onChange={setMotDuPresident} />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Aperçu</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-muted/30 shadow-sm ring-1 ring-border/50">
            <MotDuPresidentSection content={motDuPresident} />
          </div>
        </div>
      </div>

      <LandingPagePreviewer open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  );
}
