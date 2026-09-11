import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { BookOpen, FileText, Loader2, Search, X } from "lucide-react";
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
import { buildLibraryBookShareUrl } from "@/lib/shareLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function filterBooksBySearch(books: PublicLibraryBook[], query: string): PublicLibraryBook[] {
  const q = query.trim().toLowerCase();
  if (!q) return books;
  return books.filter((b) => {
    const hay = `${b.title} ${b.author} ${b.keywords} ${b.description}`.toLowerCase();
    return q
      .split(/\s+/)
      .filter(Boolean)
      .every((token) => hay.includes(token));
  });
}

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
            <Link to={`/article/${book.id}`}>
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
            <Link to={`/article/${book.id}`}>
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
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<PublicListViewMode>("cards");
  const [pageSize, setPageSize] = useState<PublicPageSize>(9);
  const [page, setPage] = useState(0);

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["public-library-books", "all"],
    queryFn: () => fetchPublishedLibraryBooks(),
  });

  const filteredBooks = useMemo(() => filterBooksBySearch(books, search), [books, search]);
  const totalCount = filteredBooks.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const hasActiveSearch = search.trim().length > 0;

  const pageItems = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredBooks.slice(start, start + pageSize);
  }, [filteredBooks, currentPage, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [pageSize, viewMode, search]);

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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative min-w-[14rem] max-w-xl flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par titre, auteur ou mots-clés…"
                  className="pl-9 pr-10"
                  aria-label="Rechercher dans la bibliothèque"
                  autoComplete="off"
                />
                {hasActiveSearch ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearch("")}
                    aria-label="Effacer la recherche"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </Button>
                ) : null}
              </div>
              <PublicPagedListToolbar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                pageSize={pageSize}
                onPageSizeChange={(n) => {
                  if (n === 3 || n === 9 || n === 30) setPageSize(n);
                }}
              />
            </div>

            {totalCount === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
                Aucune ressource ne correspond à votre recherche.
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
          </>
        )}
      </main>
    </PublicShell>
  );
}
