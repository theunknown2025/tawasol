import { useCallback, useEffect, useMemo, useState } from "react";
import { FolderKanban } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchAllLpProjets } from "@/lib/lpProjetsApi";
import type { LpProjet } from "@/types/lpProjet";
import { EditProjetDialog, NewProjetPanel } from "./NewProjetPanel";
import { ProjetsList, type ProjetsListViewMode, type ProjetsPageSize } from "./ProjetsList";

const QUERY_KEY = ["lp-projets"] as const;

export default function LpProjetsPage() {
  const [tab, setTab] = useState("new");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ProjetsListViewMode>("cards");
  const [pageSize, setPageSize] = useState<ProjetsPageSize>(15);
  const [page, setPage] = useState(0);
  const [editProjet, setEditProjet] = useState<LpProjet | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const { data: projets = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEY],
    queryFn: fetchAllLpProjets,
  });

  const filteredCount = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projets.length;
    return projets.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.zones.some((z) => z.toLowerCase().includes(q)) ||
        p.partners.some((partner) => partner.name.toLowerCase().includes(q)),
    ).length;
  }, [projets, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(Math.max(0, p), totalPages - 1));
  }, [totalPages, filteredCount, pageSize]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const handlePageSizeChange = useCallback((size: ProjetsPageSize) => {
    setPageSize(size);
    setPage(0);
  }, []);

  const stats = useMemo(() => {
    const published = projets.filter((p) => p.status === "published").length;
    const results = projets.reduce((sum, p) => sum + p.results.length, 0);
    return { total: projets.length, published, results };
  }, [projets]);

  const openEdit = (projet: LpProjet) => {
    setEditProjet(projet);
    setEditOpen(true);
  };

  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2">
          <FolderKanban className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projets</h1>
          <p className="text-sm text-muted-foreground">
            Présentez vos projets sur la landing : bannière, dates, résultats, zones et partenaires.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Publiés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{stats.published}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Réalisations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{stats.results}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-2 p-2 sm:grid-cols-2 sm:gap-1">
            <TabsTrigger value="new">Nouveau projet</TabsTrigger>
            <TabsTrigger value="list">Liste ({projets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            <NewProjetPanel onCreated={() => setTab("list")} />
          </TabsContent>

          <TabsContent value="list">
            <ProjetsList
              projets={projets}
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
        </Tabs>
      </div>

      <EditProjetDialog open={editOpen} onOpenChange={setEditOpen} projet={editProjet} />
    </div>
  );
}
