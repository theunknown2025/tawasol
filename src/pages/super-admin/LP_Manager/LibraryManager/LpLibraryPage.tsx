import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, FolderPlus, Library, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { EditResourceDialog } from "./EditResourceDialog";
import { fetchLibraryBooks } from "./fetchLibraryBooks";
import { fetchLibraryGroups } from "./fetchLibraryGroups";
import { filterBooksBySearch } from "./libraryListUtils";
import { LibraryStatisticsTab } from "./LibraryStatisticsTab";
import { LibraryResourcesList, type LibraryPageSize } from "./LibraryResourcesList";
import type { LibraryListViewMode } from "./libraryListUtils";
import { NewResource } from "./NewResource";
import type { LibraryBook } from "./types";

const BOOKS_QUERY_KEY = ["lp-library-books"] as const;
const GROUPS_QUERY_KEY = ["lp-library-groups"] as const;

export default function LpLibraryPage() {
  const [groupId, setGroupId] = useState<string>("");
  const [tab, setTab] = useState("list");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<LibraryListViewMode>("cards");
  const [pageSize, setPageSize] = useState<LibraryPageSize>(15);
  const [page, setPage] = useState(0);
  const [editBook, setEditBook] = useState<LibraryBook | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: [...GROUPS_QUERY_KEY],
    queryFn: fetchLibraryGroups,
  });

  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: [...BOOKS_QUERY_KEY],
    queryFn: fetchLibraryBooks,
  });

  useEffect(() => {
    if (!groups.length) return;
    setGroupId((current) => {
      if (current && groups.some((g) => g.id === current)) return current;
      return groups[0].id;
    });
  }, [groups]);

  const groupBooks = useMemo(
    () => (groupId ? books.filter((b) => b.group_id === groupId) : books),
    [books, groupId],
  );

  const activeGroupName = useMemo(
    () => groups.find((g) => g.id === groupId)?.name ?? "",
    [groups, groupId],
  );

  const filteredCount = useMemo(
    () => filterBooksBySearch(groupBooks, search).length,
    [groupBooks, search],
  );

  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(Math.max(0, p), totalPages - 1));
  }, [totalPages, filteredCount, pageSize]);

  useEffect(() => {
    setSearch("");
    setPage(0);
  }, [groupId]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const handlePageSizeChange = useCallback((size: LibraryPageSize) => {
    setPageSize(size);
    setPage(0);
  }, []);

  const stats = useMemo(() => {
    const published = groupBooks.filter((b) => b.is_published).length;
    const withPdf = groupBooks.filter((b) => (b.pdf_url ?? "").trim().length > 0).length;
    return { total: groupBooks.length, published, withPdf };
  }, [groupBooks]);

  const openEdit = (book: LibraryBook) => {
    setEditBook(book);
    setEditOpen(true);
  };

  const isLoading = groupsLoading || booksLoading;

  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2">
          <Library className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bibliothèque</h1>
          <p className="text-sm text-muted-foreground">
            Organisez les ressources par groupes (onglets), puis créez, listez et suivez les
            indicateurs.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">Groupes de sources</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setCreateGroupOpen(true)}
            >
              <FolderPlus className="h-4 w-4" aria-hidden />
              Nouveau groupe
            </Button>
          </div>

          {groupsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Chargement des groupes…
            </div>
          ) : groups.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
              Aucun groupe pour le moment. Créez un groupe pour commencer à organiser les documents.
            </p>
          ) : (
            <Tabs value={groupId} onValueChange={setGroupId}>
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-2">
                {groups.map((g) => {
                  const count = books.filter((b) => b.group_id === g.id).length;
                  return (
                    <TabsTrigger key={g.id} value={g.id} className="gap-2 py-2.5">
                      {g.name}
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                        {count}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          )}
        </section>

        {groupId ? (
          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList className="grid h-auto w-full grid-cols-1 gap-2 p-2 sm:grid-cols-3 sm:gap-1">
              <TabsTrigger value="new" className="py-2.5">
                Nouvelle ressource
              </TabsTrigger>
              <TabsTrigger value="list" className="py-2.5">
                Liste des ressources
                {activeGroupName ? ` (${groupBooks.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2 py-2.5">
                <BarChart3 className="hidden h-4 w-4 sm:inline" aria-hidden />
                Statistiques
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="mt-0 focus-visible:outline-none">
              <NewResource
                groups={groups}
                defaultGroupId={groupId}
                onCreated={() => setTab("list")}
              />
            </TabsContent>

            <TabsContent value="list" className="mt-0 space-y-4 focus-visible:outline-none">
              <h2 className="text-lg font-semibold text-foreground">
                {activeGroupName ? `Ressources — ${activeGroupName}` : "Ressources"}
              </h2>
              <LibraryResourcesList
                books={groupBooks}
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
              {activeGroupName ? (
                <p className="text-sm text-muted-foreground">
                  Indicateurs pour le groupe <span className="font-medium text-foreground">{activeGroupName}</span>.
                </p>
              ) : null}
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
                Les ressources publiées apparaissent sur la page d’accueil (aperçu des ressources) et sur la page
                Bibliothèque publique (<span className="font-mono text-xs">/bibliotheque</span>). Les clics et
                téléchargements sont comptés sur le site public (ressources publiées uniquement).
              </p>
              <LibraryStatisticsTab books={groupBooks} />
            </TabsContent>
          </Tabs>
        ) : null}
      </div>

      <EditResourceDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditBook(null);
        }}
        book={editBook}
        groups={groups}
      />

      <CreateGroupDialog
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        onCreated={(id) => {
          setGroupId(id);
          setTab("list");
        }}
      />
    </div>
  );
}
