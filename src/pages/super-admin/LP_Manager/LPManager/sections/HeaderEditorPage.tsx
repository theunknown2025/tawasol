import { useState } from "react";
import { Maximize2, PanelTop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderSection } from "../../LandingPage/HeaderSection";
import { LandingPagePreviewer } from "../../LandingPage/LandingPagePreviewer";
import { HeaderManager } from "../HeaderManager";
import { useLpLandingContent } from "../../LpLandingContentContext";

export default function HeaderEditorPage() {
  const { header, setHeader } = useLpLandingContent();
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <PanelTop className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">Header</h1>
            <p className="text-sm text-muted-foreground">
              Logo, titre à côté, affichage optionnel des blocs et boutons Connexion / inscription.
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
          <HeaderManager value={header} onChange={setHeader} />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Aperçu</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-muted/30 shadow-sm ring-1 ring-border/50">
            <HeaderSection content={header} className="relative" />
            <p className="border-t border-border bg-background px-4 py-3 text-center text-xs text-muted-foreground">
              Aperçu du bandeau — le hero suit sur la page complète.
            </p>
          </div>
        </div>
      </div>

      <LandingPagePreviewer open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  );
}
