import { useQuery } from "@tanstack/react-query";
import { BookOpen, Loader2, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fetchArticlesHighlightBooks, type PublicLibraryBook } from "@/lib/publicLibraryBooksApi";

function ArticleBookCard({ book }: { book: PublicLibraryBook }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[3/4] w-full bg-muted">
        {book.cover_url.trim() ? (
          <img src={book.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <BookOpen className="h-14 w-14 opacity-30" aria-hidden />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">{book.title}</h3>
        {book.author.trim() && (
          <p className="text-sm text-muted-foreground">{book.author}</p>
        )}
        {book.description.trim() && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{book.description}</p>
        )}
      </div>
    </article>
  );
}

type ArticlesSectionProps = {
  /**
   * Quand un titre de section parent est déjà affiché (`LandingPageSectionOutlineTitle`),
   * masque l’en-tête interne (icône + « Articles » + sous-texte) pour éviter le doublon.
   */
  hidePageTitle?: boolean;
};

export function ArticlesSection({ hidePageTitle = false }: ArticlesSectionProps) {
  const { data: books = [], isLoading } = useQuery({
    queryKey: ["articles-highlight", 3],
    queryFn: () => fetchArticlesHighlightBooks(3),
  });

  return (
    <div
      className={`mx-auto max-w-6xl px-4 lg:px-8 ${hidePageTitle ? "pb-10 pt-0 md:pb-14" : "py-10 md:py-14"}`}
    >
      {!hidePageTitle ? (
        <header className="mb-8 text-center md:mb-10">
          <div className="mb-3 flex justify-center">
            <span className="inline-flex rounded-xl bg-primary/10 p-3 text-primary">
              <Newspaper className="h-7 w-7 md:h-8 md:w-8" aria-hidden />
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Articles</h2>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Les trois dernières ressources enregistrées dans la bibliothèque (visibles publiquement une fois
            publiées).
          </p>
        </header>
      ) : (
        <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-muted-foreground md:mb-10 md:text-base">
          Les trois dernières ressources enregistrées dans la bibliothèque (visibles publiquement une fois
          publiées).
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        </div>
      ) : books.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Aucune ressource dans la bibliothèque pour l’instant. Ajoutez des livres depuis la section
          Bibliothèque (super admin).
        </p>
      ) : (
        <ul className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <li key={book.id}>
              <ArticleBookCard book={book} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-center">
        <Button asChild size="lg" className="min-w-[16rem] gap-2">
          <Link to="/bibliotheque">Naviguer tous nos ressources</Link>
        </Button>
      </div>
    </div>
  );
}
