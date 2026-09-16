import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Loader2 } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import { fetchPublishedBilanDocuments } from "@/lib/publicBilanApi";
import { BilanTimeline } from "./BilanTimeline";

export default function PublicBilanPage() {
  const { data: documents = [], isLoading, isError } = useQuery({
    queryKey: ["public-bilan-documents"],
    queryFn: () => fetchPublishedBilanDocuments(),
  });

  return (
    <PublicShell>
      <PublicPageHero
        title="Bilan REMESS"
        description="Retrouvez les bilans annuels du REMESS, présentés chronologiquement."
        contentMaxWidthClassName="max-w-7xl"
      />
      <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        <PublicBreadcrumbs
          items={[{ label: "Accueil", to: "/" }, { label: "Bilan REMESS" }]}
        />

        <div className="mx-auto max-w-3xl">
          {isLoading ? (
            <div className="flex justify-center py-20 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
            </div>
          ) : isError ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-8 text-center text-sm text-destructive">
              Impossible de charger les bilans pour le moment.
            </p>
          ) : documents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-16 text-center">
              <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" aria-hidden />
              <p className="text-sm text-muted-foreground">Aucun bilan publié pour l’instant.</p>
            </div>
          ) : (
            <BilanTimeline documents={documents} />
          )}
        </div>
      </main>
    </PublicShell>
  );
}
