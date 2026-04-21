import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileText, Loader2, Library } from "lucide-react";
import { HeaderSection } from "@/pages/super-admin/LP_Manager/LandingPage/HeaderSection";
import { DEFAULT_HEADER_CONTENT } from "@/pages/super-admin/LP_Manager/types";
import { fetchLpLandingHeader } from "@/lib/lpLandingSectionsDb";
import { fetchPublishedLibraryBooks, type PublicLibraryBook } from "@/lib/publicLibraryBooksApi";
import { incrementLibraryBookClicks } from "@/lib/libraryBookAnalyticsApi";
import { Button } from "@/components/ui/button";
import { LibraryResourceDialog } from "./LibraryResourceDialog";

export default function PublicLibraryPage() {
  const [selected, setSelected] = useState<PublicLibraryBook | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: headerRow } = useQuery({
    queryKey: ["lp-landing-header-public"],
    queryFn: async () => {
      try {
        return await fetchLpLandingHeader();
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });

  const headerContent = headerRow ?? DEFAULT_HEADER_CONTENT;

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["public-library-books", "all"],
    queryFn: () => fetchPublishedLibraryBooks(),
  });

  const openBook = (book: PublicLibraryBook) => {
    void incrementLibraryBookClicks(book.id);
    setSelected(book);
    setDialogOpen(true);
  };

  return (
    <div className="remess-landing-theme min-h-screen bg-background text-foreground">
      <HeaderSection content={headerContent} suppressSectionNav />

      <main className="mx-auto max-w-6xl px-4 py-10 md:py-14 lg:px-8">
        <header className="mb-10 flex flex-col gap-3 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/15 p-2.5 ring-1 ring-primary/20">
              <Library className="h-7 w-7 text-primary" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Bibliothèque</h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Toutes nos ressources publiées. Ouvrez un document pour le lire ici, le télécharger ou
                laisser un avis.
              </p>
            </div>
          </div>
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
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <li
                key={book.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-[#8f3119]/5 transition-shadow hover:shadow-md"
              >
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
                  {book.author.trim() && (
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                  )}
                  {book.description.trim() && (
                    <p className="line-clamp-3 text-xs text-muted-foreground">{book.description}</p>
                  )}
                  <div className="mt-auto pt-2">
                    <Button type="button" className="w-full gap-2" onClick={() => openBook(book)}>
                      <FileText className="h-4 w-4" aria-hidden />
                      {book.pdf_url.trim() ? "Lire le document" : "Voir la fiche"}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <LibraryResourceDialog
        book={selected}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
