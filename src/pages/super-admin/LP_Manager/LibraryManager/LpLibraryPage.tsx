import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Library } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditResourceDialog } from "./EditResourceDialog";
import { fetchLibraryBooks } from "./fetchLibraryBooks";
import { filterBooksBySearch } from "./libraryListUtils";
import { LibraryStatisticsTab } from "./LibraryStatisticsTab";
import { LibraryResourcesList, type LibraryPageSize } from "./LibraryResourcesList";
import type { LibraryListViewMode } from "./libraryListUtils";
import { NewResource } from "./NewResource";
import type { LibraryBook } from "./types";

const QUERY_KEY = ["lp-library-books"] as const;

export default function LpLibraryPage() {
  const [tab, setTab] = useState("new");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<LibraryListViewMode>("cards");
  const [pageSize, setPageSize] = useState<LibraryPageSize>(15);
  const [page, setPage] = useState(0);
  const [editBook, setEditBook] = useState<LibraryBook | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const { data: books = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEY],
    queryFn: fetchLibraryBooks,
  });

  const filteredCount = useMemo(
    () => filterBooksBySearch(books, search).length,
    [books, search],
  );

  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(Math.max(0, p), totalPages - 1));
  }, [totalPages, filteredCount, pageSize]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const handlePageSizeChange = useCallback((size: LibraryPageSize) => {
    setPageSize(size);
    setPage(0);
  }, []);

  const stats = useMemo(() => {
    const published = books.filter((b) => b.is_published).length;
    const withPdf = books.filter((b) => (b.pdf_url ?? "").trim().length > 0).length;
    return { total: books.length, published, withPdf };
  }, [books]);

  const openEdit = (book: LibraryBook) => {
    setEditBook(book);
    setEditOpen(true);
  };

  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2">
          <Library className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bibliothèque</h1>
          <p className="text-sm text-muted-foreground">
            Ressources documentaires : création, liste avec affichage cartes ou lignes, pagination et
            indicateurs.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-2 p-2 sm:grid-cols-3 sm:gap-1">
            <TabsTrigger value="new" className="py-2.5">
              Nouvelle ressource
            </TabsTrigger>
            <TabsTrigger value="list" className="py-2.5">
              Liste des ressources
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2 py-2.5">
              <BarChart3 className="hidden h-4 w-4 sm:inline" aria-hidden />
              Statistiques
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-0 focus-visible:outline-none">
            <NewResource />
          </TabsContent>

          <TabsContent value="list" className="mt-0 space-y-4 focus-visible:outline-none">
            <h2 className="text-lg font-semibold text-foreground">Ressources</h2>
            <LibraryResourcesList
              books={books}
              isLoading={isLoading}
              search={search}
              onSearchChange={handleSearchChange}
              onEdit={openEdit}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              page={page}
              onPageChange={setPage}
            />
          </TabsContent>

          <TabsContent value="stats" className="mt-0 space-y-6 focus-visible:outline-none">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-muted-foreground">
                    Total ressources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tabular-nums text-foreground">{stats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-muted-foreground">
                    Publiées sur le site
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tabular-nums text-primary">{stats.published}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-muted-foreground">
                    Avec document PDF
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tabular-nums text-foreground">{stats.withPdf}</p>
                </CardContent>
              </Card>
            </div>
            <p className="text-sm text-muted-foreground">
              Les ressources publiées apparaissent dans la section Articles de la landing et sur la page
              publique <span className="font-mono text-xs">/bibliotheque</span>. Les clics et téléchargements
              sont comptés sur le site public (ressources publiées uniquement).
            </p>
            <LibraryStatisticsTab books={books} />
          </TabsContent>
        </Tabs>
      </div>

      <EditResourceDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditBook(null);
        }}
        book={editBook}
      />
    </div>
  );
}
