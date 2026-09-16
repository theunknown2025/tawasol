import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import { ShareResourceMenu } from "@/components/public/ShareResourceMenu";
import {
  fetchPublishedBilanById,
  fetchSimilarPublishedBilans,
} from "@/lib/publicBilanApi";
import { incrementBilanDocumentClicks } from "@/lib/bilanAnalyticsApi";
import { buildBilanShareUrl } from "@/lib/shareLinks";
import { BilanPdfPanel, BilanReviewsPanel } from "./BilanReadingPanels";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SIMILAR_LIMIT = 4;

export default function PublicBilanDetailPage() {
  const { id = "" } = useParams<{ id: string }>();

  const { data: doc, isLoading, isError, error } = useQuery({
    queryKey: ["public-bilan", id],
    queryFn: () => fetchPublishedBilanById(id),
    enabled: !!id,
  });

  const { data: similar = [] } = useQuery({
    queryKey: ["public-bilan-similar", id],
    queryFn: () => fetchSimilarPublishedBilans(id, SIMILAR_LIMIT),
    enabled: !!id && !!doc,
  });

  useEffect(() => {
    if (doc?.id) void incrementBilanDocumentClicks(doc.id);
  }, [doc?.id]);

  if (!id) {
    return (
      <PublicShell>
        <main className="mx-auto max-w-3xl px-4 py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Identifiant manquant</AlertTitle>
            <AlertDescription>Cette adresse n’est pas valide.</AlertDescription>
          </Alert>
        </main>
      </PublicShell>
    );
  }

  if (isLoading) {
    return (
      <PublicShell>
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
        </div>
      </PublicShell>
    );
  }

  if (isError || !doc) {
    const message =
      error instanceof Error ? error.message : "Ce bilan n’existe pas ou n’est plus publié.";
    return (
      <PublicShell>
        <main className="mx-auto max-w-lg px-4 py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Bilan introuvable</AlertTitle>
            <AlertDescription className="mt-2">{message}</AlertDescription>
          </Alert>
          <p className="mt-6 text-center text-sm">
            <Link
              to="/bilan-remess"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Retour aux bilans
            </Link>
          </p>
        </main>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <PublicPageHero
        title={doc.title}
        description={`Bilan ${doc.year}`}
        contentMaxWidthClassName="max-w-7xl"
      />
      <main className="mx-auto w-full max-w-7xl space-y-10 px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        <PublicBreadcrumbs
          items={[
            { label: "Accueil", to: "/" },
            { label: "Bilan REMESS", to: "/bilan-remess" },
            { label: doc.title },
          ]}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {doc.description.trim() ? (
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {doc.description}
            </p>
          ) : null}
          <ShareResourceMenu
            title={doc.title}
            description={doc.description?.trim() || undefined}
            url={buildBilanShareUrl(doc.id)}
            variant="outline"
            size="default"
            className="shrink-0 sm:ml-auto"
          />
        </div>

        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
          <BilanPdfPanel
            documentId={doc.id}
            title={doc.title}
            pdfUrl={doc.pdf_url}
            minHeightClass="min-h-[55vh] lg:min-h-[72vh] xl:min-h-[78vh]"
          />
          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <BilanReviewsPanel documentId={doc.id} enabled />
          </aside>
        </div>

        {similar.length > 0 ? (
          <section className="border-t border-border pt-10">
            <h2 className="mb-2 text-lg font-semibold text-foreground">Autres bilans</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {similar.map((b) => (
                <li key={b.id}>
                  <Link
                    to={`/bilan-remess/${b.id}`}
                    className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/30"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold tabular-nums text-primary">
                      {b.year}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 font-medium text-foreground">{b.title}</p>
                      {b.description.trim() ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {b.description}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </PublicShell>
  );
}
