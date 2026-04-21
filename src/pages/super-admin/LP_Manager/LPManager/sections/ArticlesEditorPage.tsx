import { useState } from "react";
import { ExternalLink, Maximize2, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArticlesSection } from "../../LandingPage/ArticlesSection";
import { LandingPagePreviewer } from "../../LandingPage/LandingPagePreviewer";

export default function ArticlesEditorPage() {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <Newspaper className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">Articles</h1>
            <p className="text-sm text-muted-foreground">
              La section affiche les trois dernières ressources publiées (bibliothèque). Un bouton
              renvoie vers la page publique{" "}
              <code className="rounded bg-muted px-1 text-xs">/bibliotheque</code> (PDF, avis,
              téléchargement).
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Gérez les livres, PDF et publication dans{" "}
              <Link
                to="/admin/remess-landing/library"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Bibliothèque
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link to="/bibliotheque" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" aria-hidden />
              Ouvrir /bibliotheque
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Aperçu plein écran"
            title="Aperçu plein écran"
            onClick={() => setPreviewOpen(true)}
          >
            <Maximize2 className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-sm ring-1 ring-border/50">
        <ArticlesSection />
      </div>

      <LandingPagePreviewer open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  );
}
