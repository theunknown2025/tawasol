import { useState } from "react";
import { Eye, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingPagePreviewer } from "../../LandingPage/LandingPagePreviewer";
import { useLpLandingContent } from "../../LpLandingContentContext";
import { SectionVisibilityManager } from "../SectionVisibilityManager";

export default function SectionVisibilityEditorPage() {
  const { sectionVisibility, persistSectionVisibility } = useLpLandingContent();
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <Eye className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">Visibilité des sections</h1>
            <p className="text-sm text-muted-foreground">
              Afficher ou masquer chaque composant de la landing (header inclus) sur la page
              principale et dans le mega-menu Accueil.
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

      <div className="max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Sections</h2>
        <SectionVisibilityManager
          value={sectionVisibility}
          onChange={persistSectionVisibility}
        />
      </div>

      <LandingPagePreviewer open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  );
}
