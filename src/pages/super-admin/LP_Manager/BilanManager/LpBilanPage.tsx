import { useCallback, useMemo, useState } from "react";
import { BarChart3, ClipboardList, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BilanDocumentsList } from "./BilanDocumentsList";
import { BilanStatisticsTab } from "./BilanStatisticsTab";
import { EditBilanDialog } from "./EditBilanDialog";
import { fetchBilanDocuments } from "./fetchBilanDocuments";
import { NewBilanDocument } from "./NewBilanDocument";
import type { BilanDocument } from "./types";

const DOCS_QUERY_KEY = ["lp-bilan-documents"] as const;

export default function LpBilanPage() {
  const [tab, setTab] = useState("list");
  const [search, setSearch] = useState("");
  const [editDoc, setEditDoc] = useState<BilanDocument | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: [...DOCS_QUERY_KEY],
    queryFn: fetchBilanDocuments,
  });

  const stats = useMemo(() => {
    const published = documents.filter((d) => d.is_published).length;
    const withPdf = documents.filter((d) => (d.pdf_url ?? "").trim().length > 0).length;
    return { total: documents.length, published, withPdf };
  }, [documents]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const openEdit = (doc: BilanDocument) => {
    setEditDoc(doc);
    setEditOpen(true);
  };

  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2">
          <ClipboardList className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bilan REMESS</h1>
          <p className="text-sm text-muted-foreground">
            Publiez les bilans annuels (année, titre, description, document) et suivez les
            statistiques.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-2 p-2 sm:grid-cols-3 sm:gap-1">
            <TabsTrigger value="new" className="py-2.5">
              Nouveau bilan
            </TabsTrigger>
            <TabsTrigger value="list" className="py-2.5">
              Liste ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2 py-2.5">
              <BarChart3 className="hidden h-4 w-4 sm:inline" aria-hidden />
              Statistiques
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-0 focus-visible:outline-none">
            <NewBilanDocument onCreated={() => setTab("list")} />
          </TabsContent>

          <TabsContent value="list" className="mt-0 space-y-4 focus-visible:outline-none">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Chargement…
              </div>
            ) : null}
            <BilanDocumentsList
              documents={documents}
              isLoading={isLoading}
              search={search}
              onSearchChange={handleSearchChange}
              onEdit={openEdit}
            />
          </TabsContent>

          <TabsContent value="stats" className="mt-0 space-y-6 focus-visible:outline-none">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-muted-foreground">
                    Total bilans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tabular-nums text-foreground">{stats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-muted-foreground">
                    Publiés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tabular-nums text-primary">{stats.published}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-muted-foreground">
                    Avec PDF
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tabular-nums text-foreground">{stats.withPdf}</p>
                </CardContent>
              </Card>
            </div>
            <p className="text-sm text-muted-foreground">
              Les bilans publiés apparaissent sur la page d’accueil et sur{" "}
              <span className="font-mono text-xs">/bilan-remess</span>. Les clics et téléchargements
              sont comptés sur le site public.
            </p>
            <BilanStatisticsTab documents={documents} />
          </TabsContent>
        </Tabs>
      </div>

      <EditBilanDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditDoc(null);
        }}
        document={editDoc}
      />
    </div>
  );
}
