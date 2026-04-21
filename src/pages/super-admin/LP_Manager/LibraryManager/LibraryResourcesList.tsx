import { useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Loader2,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { deleteLibraryBook } from "./deleteLibraryBook";
import {
  filterBooksBySearch,
  visiblePageIndices,
  type LibraryListViewMode,
} from "./libraryListUtils";
import type { LibraryBook } from "./types";

const QUERY_KEY = ["lp-library-books"] as const;

export type LibraryPageSize = 5 | 15 | 25;

type LibraryResourcesListProps = {
  books: LibraryBook[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onEdit: (book: LibraryBook) => void;
  viewMode: LibraryListViewMode;
  onViewModeChange: (mode: LibraryListViewMode) => void;
  pageSize: LibraryPageSize;
  onPageSizeChange: (size: LibraryPageSize) => void;
  page: number;
  onPageChange: (page: number) => void;
};

export function LibraryResourcesList({
  books,
  isLoading,
  search,
  onSearchChange,
  onEdit,
  viewMode,
  onViewModeChange,
  pageSize,
  onPageSizeChange,
  page,
  onPageChange,
}: LibraryResourcesListProps) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<LibraryBook | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteLibraryBook,
    onSuccess: () => {
      toast.success("Ressource supprimée");
      void queryClient.invalidateQueries({ queryKey: [...QUERY_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["articles-highlight"] });
      void queryClient.invalidateQueries({ queryKey: ["public-library-books"] });
      setDeleteTarget(null);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Suppression impossible");
    },
  });

  const filtered = filterBooksBySearch(books, search);
  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const start = safePage * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const goPrev = () => onPageChange(Math.max(0, safePage - 1));
  const goNext = () => onPageChange(Math.min(totalPages - 1, safePage + 1));

  const bookCard = (book: LibraryBook) => (
    <div
      key={book.id}
      className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[3/4] w-full bg-muted">
        {book.cover_url.trim() ? (
          <img src={book.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <BookOpen className="h-12 w-12 opacity-40" aria-hidden />
            <span className="text-xs">Pas de couverture</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold leading-snug text-foreground">{book.title}</h3>
            {Boolean(book.is_published) && (
              <Badge variant="secondary" className="text-xs">
                Publié
              </Badge>
            )}
          </div>
          {book.author.trim() && <p className="text-sm text-muted-foreground">{book.author}</p>}
        </div>
        {book.description.trim() && (
          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{book.description}</p>
        )}
        {book.keywords.trim() && (
          <div className="flex flex-wrap gap-1">
            {book.keywords
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean)
              .map((kw) => (
                <span
                  key={`${book.id}-${kw}`}
                  className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary"
                >
                  {kw}
                </span>
              ))}
          </div>
        )}
        <div className="mt-auto flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
            onClick={() => onEdit(book)}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Modifier
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteTarget(book)}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Supprimer
          </Button>
        </div>
      </div>
    </div>
  );

  const bookRow = (book: LibraryBook) => (
    <li
      key={book.id}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-sm sm:flex-row sm:items-stretch"
    >
      <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-32 sm:w-20">
        {book.cover_url.trim() ? (
          <img src={book.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <BookOpen className="h-10 w-10 opacity-35" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">{book.title}</h3>
          {Boolean(book.is_published) && (
            <Badge variant="secondary" className="text-xs">
              Publié
            </Badge>
          )}
        </div>
        {book.author.trim() && <p className="text-sm text-muted-foreground">{book.author}</p>}
        {book.description.trim() && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{book.description}</p>
        )}
        {book.keywords.trim() && (
          <div className="flex flex-wrap gap-1">
            {book.keywords
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean)
              .map((kw) => (
                <span
                  key={`${book.id}-r-${kw}`}
                  className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary"
                >
                  {kw}
                </span>
              ))}
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:w-36">
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => onEdit(book)}>
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Modifier
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setDeleteTarget(book)}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Supprimer
        </Button>
      </div>
    </li>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par titre, auteur ou mots-clés…"
            className="pl-9"
            aria-label="Rechercher dans la bibliothèque"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Affichage
          </span>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => {
              if (v === "cards" || v === "rows") onViewModeChange(v);
            }}
            className="justify-start"
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="cards" aria-label="Cartes" className="gap-1.5 px-3">
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Cartes
            </ToggleGroupItem>
            <ToggleGroupItem value="rows" aria-label="Lignes" className="gap-1.5 px-3">
              <List className="h-4 w-4" aria-hidden />
              Lignes
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Par page
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                const n = Number(v) as LibraryPageSize;
                if (n === 5 || n === 15 || n === 25) onPageSizeChange(n);
              }}
            >
              <SelectTrigger className="h-9 w-[8.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 par page</SelectItem>
                <SelectItem value="15">15 par page</SelectItem>
                <SelectItem value="25">25 par page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        </div>
      ) : totalFiltered === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          {books.length === 0
            ? "Aucune ressource pour l’instant. Ajoutez un livre dans l’onglet « Nouvelle ressource »."
            : "Aucun résultat pour cette recherche."}
        </p>
      ) : viewMode === "cards" ? (
        <ul
          className={`grid gap-4 ${
            pageSize <= 5
              ? "sm:grid-cols-2 lg:grid-cols-3"
              : pageSize <= 15
                ? "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          }`}
        >
          {pageItems.map((book) => (
            <li key={book.id}>{bookCard(book)}</li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-3">{pageItems.map((book) => bookRow(book))}</ul>
      )}

      {!isLoading && totalFiltered > 0 && (
        <nav
          className="flex flex-col items-stretch gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between"
          aria-label="Pagination de la liste"
        >
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            {totalFiltered === 0
              ? "—"
              : `${start + 1}–${Math.min(start + pageSize, totalFiltered)} sur ${totalFiltered} résultat${totalFiltered > 1 ? "s" : ""} · page ${safePage + 1} / ${totalPages}`}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={goPrev}
              disabled={safePage <= 0}
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Button>

            <div className="flex flex-wrap items-center justify-center gap-1">
              {visiblePageIndices(safePage, totalPages).map((idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant={idx === safePage ? "default" : "outline"}
                  size="sm"
                  className="h-9 min-w-9 px-2"
                  onClick={() => onPageChange(idx)}
                >
                  {idx + 1}
                </Button>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={goNext}
              disabled={safePage >= totalPages - 1}
              aria-label="Page suivante"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </nav>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette ressource ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {deleteTarget?.title} » sera définitivement retiré de la bibliothèque. Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
