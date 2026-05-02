import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BookOpen, Loader2 } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import { ShareResourceMenu } from "@/components/public/ShareResourceMenu";
import {
  fetchPublishedLibraryBookById,
  fetchSimilarPublishedBooks,
} from "@/lib/publicLibraryBooksApi";
import { incrementLibraryBookClicks } from "@/lib/libraryBookAnalyticsApi";
import { buildArticleShareUrl } from "@/lib/shareLinks";
import { LibraryBookPdfPanel, LibraryBookReviewsPanel } from "./LibraryBookReadingPanels";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SIMILAR_LIMIT = 6;

export default function PublicArticlePage() {
  const { id = "" } = useParams<{ id: string }>();

  const { data: book, isLoading, isError, error } = useQuery({
    queryKey: ["public-article", id],
    queryFn: () => fetchPublishedLibraryBookById(id),
    enabled: !!id,
  });

  const { data: similar = [] } = useQuery({
    queryKey: ["public-article-similar", id],
    queryFn: () => fetchSimilarPublishedBooks(id, SIMILAR_LIMIT),
    enabled: !!id && !!book,
  });

  useEffect(() => {
    if (book?.id) void incrementLibraryBookClicks(book.id);
  }, [book?.id]);

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

  if (isError || !book) {
    const message =
      error instanceof Error ? error.message : "Cette ressource n’existe pas ou n’est plus publiée.";
    return (
      <PublicShell>
        <main className="mx-auto max-w-lg px-4 py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Article introuvable</AlertTitle>
            <AlertDescription className="mt-2">{message}</AlertDescription>
          </Alert>
          <p className="mt-6 text-center text-sm">
            <Link to="/bibliotheque" className="font-medium text-primary underline-offset-4 hover:underline">
              Retour à la bibliothèque
            </Link>
          </p>
        </main>
      </PublicShell>
    );
  }

  const heroSubtitle = [book.author?.trim() || null, book.keywords?.trim() || null]
    .filter(Boolean)
    .join(" · ");

  return (
    <PublicShell>
      <PublicPageHero
        title={book.title}
        description={heroSubtitle || undefined}
        contentMaxWidthClassName="max-w-[calc(100vw-1.5rem)]"
      />
      <main className="mx-auto w-full max-w-[calc(100vw-1.5rem)] space-y-10 px-4 py-8 sm:px-5 md:py-10 lg:px-6 xl:px-8">
        <PublicBreadcrumbs
          items={[
            { label: "Accueil", to: "/" },
            { label: "Bibliothèque", to: "/bibliotheque" },
            { label: book.title },
          ]}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {book.description.trim() ? (
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{book.description}</p>
          ) : null}
          <ShareResourceMenu
            title={book.title}
            description={book.description?.trim() || undefined}
            url={buildArticleShareUrl(book.id)}
            variant="outline"
            size="default"
            className="shrink-0 sm:ml-auto"
          />
        </div>

        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
          <LibraryBookPdfPanel
            bookId={book.id}
            title={book.title}
            pdfUrl={book.pdf_url}
            minHeightClass="min-h-[55vh] lg:min-h-[72vh] xl:min-h-[78vh]"
          />
          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <LibraryBookReviewsPanel bookId={book.id} enabled />
          </aside>
        </div>

        {similar.length > 0 ? (
          <section className="border-t border-border pt-10">
            <h2 className="mb-2 text-lg font-semibold text-foreground">Autres lectures</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Ressources publiées susceptibles de vous intéresser.
            </p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((b) => (
                <li key={b.id}>
                  <Link
                    to={`/article/${b.id}`}
                    className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/30"
                    onClick={() => void incrementLibraryBookClicks(b.id)}
                  >
                    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                      {b.cover_url.trim() ? (
                        <img src={b.cover_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <BookOpen className="h-6 w-6 opacity-40" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{b.title}</p>
                      {b.author.trim() ? (
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{b.author}</p>
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
