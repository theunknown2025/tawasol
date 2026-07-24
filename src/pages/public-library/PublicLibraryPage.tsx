import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { BookOpen, FileText, Loader2, Library } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import { ShareResourceMenu } from "@/components/public/ShareResourceMenu";
import {
  PublicPagedListPagination,
  PublicPagedListToolbar,
  type PublicListViewMode,
  type PublicPageSize,
} from "@/components/public/PublicPagedListControls";
import { fetchPublishedLibraryBooks, type PublicLibraryBook } from "@/lib/publicLibraryBooksApi";
import { incrementLibraryBookClicks } from "@/lib/libraryBookAnalyticsApi";
import { buildLibraryBookShareUrl } from "@/lib/shareLinks";
import { Button } from "@/components/ui/button";

function LibraryBookCard({ book }: { book: PublicLibraryBook }) {
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-[#8f3119]/5 transition-shadow hover:shadow-md">
      <div className="relative aspect-[3/4] w-full bg-muted">
        {book.cover_url.trim() ? (
          <img src={book.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <BookOpen className="h-16 w-16 opacity-25" aria-hidden />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="font-semibold leading-snug text-foreground">{book.title}</h2>
        {book.author.trim() && <p className="text-sm text-muted-foreground">{book.author}</p>}
        {book.description.trim() && (
          <p className="line-clamp-3 text-xs text-muted-foreground">{book.description}</p>
        )}
        <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:items-center">
          <Button type="button" className="w-full flex-1 gap-2 sm:w-auto" asChild>
            <Link
              to={`/article/${book.id}`}
              onClick={() => void incrementLibraryBookClicks(book.id)}
            >
              <FileText className="h-4 w-4" aria-hidden />
              {book.pdf_url.trim() ? "Lire le document" : "Voir la fiche"}
            </Link>
          </Button>
          <ShareResourceMenu
            title={book.title}
            description={book.description?.trim() || undefined}
            url={buildLibraryBookShareUrl(book.id)}
            variant="outline"
            size="sm"
            className="w-full shrink-0 sm:w-auto"
          />
        </div>
      </div>
    </li>
  );
}

function LibraryBookRow({ book }: { book: PublicLibraryBook }) {
  return (
    <li className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-[#8f3119]/5 transition-shadow hover:shadow-md sm:flex-row sm:items-stretch">
      <div className="relative h-40 w-28 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-32 sm:w-24">
        {book.cover_url.trim() ? (
          <img src={book.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <BookOpen className="h-10 w-10 opacity-25" aria-hidden />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <h2 className="text-lg font-semibold leading-snug text-foreground">{book.title}</h2>
          {book.author.trim() && <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>}
        </div>
        {book.description.trim() && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{book.description}</p>
        )}
        <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
          <Button type="button" className="w-full gap-2 sm:w-auto" asChild>
            <Link
              to={`/article/${book.id}`}
              onClick={() => void incrementLibraryBookClicks(book.id)}
            >
              <FileText className="h-4 w-4" aria-hidden />
              {book.pdf_url.trim() ? "Lire le document" : "Voir la fiche"}
            </Link>
          </Button>
          <ShareResourceMenu
            title={book.title}
            description={book.description?.trim() || undefined}
            url={buildLibraryBookShareUrl(book.id)}
            variant="outline"
            size="sm"
            className="w-full shrink-0 sm:w-auto"
          />
        </div>
      </div>
    </li>
  );
}

export default function PublicLibraryPage() {
  const [searchParams] = useSearchParams();
  const livreRedirect = searchParams.get("livre")?.trim() ?? "";
  const [viewMode, setViewMode] = useState<PublicListViewMode>("cards");
  const [pageSize, setPageSize] = useState<PublicPageSize>(9);
  const [page, setPage] = useState(0);

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["public-library-books", "all"],
    queryFn: () => fetchPublishedLibraryBooks(),
  });

  const totalCount = books.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages - 1);

  const pageItems = useMemo(() => {
    const start = currentPage * pageSize;
    return books.slice(start, start + pageSize);
  }, [books, currentPage, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [pageSize, viewMode]);

  if (livreRedirect) {
    return <Navigate to={`/article/${encodeURIComponent(livreRedirect)}`} replace />;
  }

  return (
    <PublicShell>
      <PublicPageHero
        title="Bibliothèque"
        description="Toutes nos ressources publiées. Ouvrez une ressource sur sa page dédiée pour lire le PDF, partager et consulter les avis."
      />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:py-10 lg:px-8">
        <PublicBreadcrumbs items={[{ label: "Accueil", to: "/" }, { label: "Bibliothèque" }]} />

        <header className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/15 p-2.5 ring-1 ring-primary/20">
              <Library className="h-7 w-7 text-primary" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground md:text-xl">Ressources</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Ouvrez une fiche pour lire le document, partager le lien et consulter les avis.
              </p>
            </div>
          </div>
          {!isLoading && totalCount > 0 ? (
            <PublicPagedListToolbar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          ) : null}
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
          </div>
        ) : books.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
            Aucune ressource publiée pour le moment.
          </p>
        ) : (
          <>
            {viewMode === "cards" ? (
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pageItems.map((book) => (
                  <LibraryBookCard key={book.id} book={book} />
                ))}
              </ul>
            ) : (
              <ul className="space-y-3">
                {pageItems.map((book) => (
                  <LibraryBookRow key={book.id} book={book} />
                ))}
              </ul>
            )}

            <PublicPagedListPagination
              page={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
              itemLabel="ressource"
              ariaLabel="Pagination de la bibliothèque"
            />
          </>
        )}
      </main>
    </PublicShell>
  );
}
