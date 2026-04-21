import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { fetchAllLpLandingResolved } from "@/lib/lpLandingSectionsDb";
import { LandingPagePublishedLayout } from "@/pages/super-admin/LP_Manager/LandingPage/LandingPagePublishedLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function PublicLandingPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["public-landing", "all-sections"],
    queryFn: fetchAllLpLandingResolved,
    staleTime: 60_000,
  });

  if (isLoading && !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
        <p className="text-sm">Chargement de la page…</p>
      </div>
    );
  }

  if (isError || !data) {
    const message =
      error instanceof Error ? error.message : "Impossible de charger le contenu pour le moment.";
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-3">
            <span>{message}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              {isFetching ? "Nouvel essai…" : "Réessayer"}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      {isFetching && !isLoading ? (
        <div
          className="pointer-events-none fixed right-4 top-4 z-50 rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs text-muted-foreground shadow-md backdrop-blur"
          aria-live="polite"
        >
          Mise à jour…
        </div>
      ) : null}
      <LandingPagePublishedLayout
        header={data.header}
        hero={data.hero}
        motDuPresident={data.motDuPresident}
        aProposRemess={data.aProposRemess}
        remessEnChiffres={data.remessEnChiffres}
        equipeRemess={data.equipeRemess}
        nosMembres={data.nosMembres}
        contacterNous={data.contacterNous}
      />
    </div>
  );
}
