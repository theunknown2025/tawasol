import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Database, Eye, Pencil, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  deleteBarometreCooperative,
  publishBarometreCooperative,
  type BarometreCooperative,
} from "./barometreCooperativesApi";

function presidentGenreLabel(g: BarometreCooperative["presidentGenre"]): string {
  if (g === "male") return "Homme";
  if (g === "female") return "Femme";
  return "—";
}

type ListTab = "published" | "drafts";

type Props = {
  cooperatives: BarometreCooperative[];
  isLoading?: boolean;
  error?: string | null;
  onRefresh: () => void;
  /** Résumé du filtre aligné sur la recherche (province / commune) */
  filterHint?: string | null;
  /** Change quand le filtre change : remet la pagination à la page 1 */
  filterKey?: string;
  /** Masque la colonne Actions (édition / suppression) — ex. page publique. */
  readOnly?: boolean;
};

function CoopTable({
  cooperatives,
  isLoading,
  readOnly,
  showPublish,
  pageSize,
  pageIndex,
  setPageIndex,
  expandedId,
  toggleRow,
  onDeleteClick,
  onPublishClick,
  publishPendingId,
}: {
  cooperatives: BarometreCooperative[];
  isLoading?: boolean;
  readOnly: boolean;
  showPublish: boolean;
  pageSize: number;
  pageIndex: number;
  setPageIndex: (updater: (p: number) => number) => void;
  expandedId: string | null;
  toggleRow: (id: string) => void;
  onDeleteClick: (coop: BarometreCooperative) => void;
  onPublishClick: (coop: BarometreCooperative) => void;
  publishPendingId: string | null;
}) {
  const colCount = readOnly ? 3 : 4;
  const totalPages = Math.max(1, Math.ceil(cooperatives.length / pageSize));
  const start = pageIndex * pageSize;
  const pageRows = cooperatives.slice(start, start + pageSize);

  const addressSummary = (c: BarometreCooperative) => {
    const parts = [c.communeName, c.provinceName].filter(Boolean);
    return parts.length > 0 ? parts.join(" / ") : "—";
  };

  const phonesOf = (c: BarometreCooperative) =>
    c.phones.length > 0 ? c.phones : c.tel ? [c.tel] : [];

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead className="hidden sm:table-cell">Secteur</TableHead>
              <TableHead className="hidden md:table-cell">Adresse (commune / province)</TableHead>
              {readOnly ? null : (
                <TableHead className="w-[160px] text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-muted-foreground">
                  {showPublish ? "Aucun brouillon." : "Aucune coopérative enregistrée."}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((coop) => {
                const open = expandedId === coop.id;
                const phones = phonesOf(coop);
                return (
                  <Fragment key={coop.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => toggleRow(coop.id)}
                    >
                      <TableCell className="font-medium align-top">
                        <div className="flex flex-col gap-1">
                          <span>{coop.nom}</span>
                          <span className="text-xs text-muted-foreground sm:hidden">{coop.activite || "—"}</span>
                          <span className="text-xs text-muted-foreground md:hidden">{addressSummary(coop)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell align-top text-muted-foreground text-sm">
                        {coop.activite || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell align-top text-sm">
                        {addressSummary(coop)}
                      </TableCell>
                      {readOnly ? null : (
                        <TableCell className="text-right align-top" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            {showPublish ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Publier"
                                title="Publier"
                                disabled={publishPendingId === coop.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onPublishClick(coop);
                                }}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            ) : null}
                            <Button variant="ghost" size="icon" asChild aria-label="Modifier">
                              <Link to={`/admin/remess-landing/cartographie/edit/${coop.id}`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              aria-label="Supprimer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDeleteClick(coop);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                    {open ? (
                      <TableRow className="bg-muted/20 hover:bg-muted/25 border-t border-border">
                        <TableCell colSpan={colCount} className="p-4">
                          <div className="grid gap-6 lg:grid-cols-[minmax(0,200px)_1fr_minmax(0,240px)]">
                            <div className="flex flex-col gap-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Image
                              </p>
                              {coop.imageUrl ? (
                                <img
                                  src={coop.imageUrl}
                                  alt=""
                                  className="max-h-48 w-full rounded-lg border border-border object-contain bg-background"
                                />
                              ) : (
                                <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                                  Aucune image
                                </div>
                              )}
                            </div>

                            <div className="space-y-3 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-lg font-semibold text-foreground">{coop.nom}</p>
                                {coop.isPublished ? (
                                  <Badge variant="secondary">Publiée</Badge>
                                ) : (
                                  <Badge variant="outline">Brouillon</Badge>
                                )}
                              </div>
                              <Button variant="outline" size="sm" className="w-fit" asChild>
                                <Link
                                  to={`/cartographie/cooperative/${coop.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Eye className="mr-2 h-4 w-4" aria-hidden />
                                  Voir Détails
                                </Link>
                              </Button>
                              {coop.activite ? (
                                <p className="text-sm text-muted-foreground">{coop.activite}</p>
                              ) : null}
                              {coop.description ? (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">Description</p>
                                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{coop.description}</p>
                                </div>
                              ) : null}
                              <div className="grid gap-2 text-sm sm:grid-cols-2">
                                {phones.map((phone, i) => (
                                  <p key={`${phone}-${i}`}>
                                    <span className="text-muted-foreground">
                                      {phones.length > 1 ? `Tél. ${i + 1} ` : "Tél. "}
                                    </span>
                                    {phone}
                                  </p>
                                ))}
                                {coop.email ? (
                                  <p className="break-all">
                                    <span className="text-muted-foreground">Email </span>
                                    <a href={`mailto:${coop.email}`} className="text-primary underline">
                                      {coop.email}
                                    </a>
                                  </p>
                                ) : null}
                              </div>
                              {coop.latitude != null && coop.longitude != null ? (
                                <p className="text-sm">
                                  <span className="text-muted-foreground">Position </span>
                                  X {coop.longitude}, Y {coop.latitude}
                                </p>
                              ) : null}
                              {coop.adresse ? (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">Adresse complète</p>
                                  <p className="mt-1 whitespace-pre-wrap text-sm">{coop.adresse}</p>
                                </div>
                              ) : null}
                              {coop.links.length > 0 ? (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">Liens</p>
                                  <ul className="mt-1 list-inside list-disc text-sm">
                                    {coop.links.map((l, i) => (
                                      <li key={i}>
                                        <a
                                          href={l.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-primary underline break-all"
                                        >
                                          {l.label || l.url}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                              {!readOnly && showPublish ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  className="w-fit"
                                  disabled={publishPendingId === coop.id}
                                  onClick={() => onPublishClick(coop)}
                                >
                                  <Send className="mr-2 h-4 w-4" />
                                  Publier sur la carte
                                </Button>
                              ) : null}
                            </div>

                            <div className="space-y-3 rounded-lg border border-border bg-background p-4 min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Président(e)
                              </p>
                              {coop.presidentNomComplet ||
                              coop.presidentGenre ||
                              coop.presidentEmail ||
                              coop.presidentTel ? (
                                <div className="space-y-2 text-sm">
                                  <p>
                                    <span className="text-muted-foreground">Genre </span>
                                    <span className="font-medium">{presidentGenreLabel(coop.presidentGenre)}</span>
                                  </p>
                                  {coop.presidentNomComplet ? (
                                    <p>
                                      <span className="text-muted-foreground">Nom </span>
                                      {coop.presidentNomComplet}
                                    </p>
                                  ) : null}
                                  {coop.presidentEmail ? (
                                    <p className="break-all">
                                      <span className="text-muted-foreground">Email </span>
                                      <a href={`mailto:${coop.presidentEmail}`} className="text-primary underline">
                                        {coop.presidentEmail}
                                      </a>
                                    </p>
                                  ) : null}
                                  {coop.presidentTel ? (
                                    <p>
                                      <span className="text-muted-foreground">Tél. </span>
                                      {coop.presidentTel}
                                    </p>
                                  ) : null}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">Non renseigné</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {cooperatives.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Affichage {start + 1}–{Math.min(start + pageSize, cooperatives.length)} sur {cooperatives.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={pageIndex <= 0}
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs tabular-nums text-muted-foreground min-w-[100px] text-center">
              Page {pageIndex + 1} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={pageIndex >= totalPages - 1}
              onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              aria-label="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function BarometreDatabaseAccordion({
  cooperatives,
  isLoading,
  error,
  onRefresh,
  filterHint,
  filterKey = "",
  readOnly = false,
}: Props) {
  const [listTab, setListTab] = useState<ListTab>("published");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<5 | 15 | 50>(15);
  const [pageIndex, setPageIndex] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<BarometreCooperative | null>(null);

  const published = useMemo(() => cooperatives.filter((c) => c.isPublished), [cooperatives]);
  const drafts = useMemo(() => cooperatives.filter((c) => !c.isPublished), [cooperatives]);
  const activeList = readOnly ? cooperatives : listTab === "published" ? published : drafts;

  useEffect(() => {
    setPageIndex(0);
  }, [pageSize, listTab]);

  useEffect(() => {
    setPageIndex(0);
  }, [filterKey]);

  useEffect(() => {
    const maxIdx = Math.max(0, Math.ceil(activeList.length / pageSize) - 1);
    setPageIndex((p) => Math.min(p, maxIdx));
  }, [activeList.length, pageSize]);

  useEffect(() => {
    setExpandedId((prev) => {
      if (!prev) return null;
      return activeList.some((c) => c.id === prev) ? prev : null;
    });
  }, [activeList]);

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteBarometreCooperative(id),
    onSuccess: () => {
      toast.success("Coopérative supprimée.");
      setDeleteTarget(null);
      setExpandedId(null);
      onRefresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishMut = useMutation({
    mutationFn: (id: string) => publishBarometreCooperative(id),
    onSuccess: () => {
      toast.success("Coopérative publiée sur la carte.");
      setExpandedId(null);
      setListTab("published");
      onRefresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleRow = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const tableProps = {
    cooperatives: activeList,
    isLoading,
    readOnly,
    showPublish: !readOnly && listTab === "drafts",
    pageSize,
    pageIndex,
    setPageIndex,
    expandedId,
    toggleRow,
    onDeleteClick: (coop: BarometreCooperative) => setDeleteTarget(coop),
    onPublishClick: (coop: BarometreCooperative) => publishMut.mutate(coop.id),
    publishPendingId: publishMut.isPending ? (publishMut.variables ?? null) : null,
  };

  return (
    <>
      <Accordion type="single" collapsible className="rounded-xl border border-border bg-card shadow-sm">
        <AccordionItem value="database" className="border-b-0 px-1">
          <AccordionTrigger className="px-4 py-4 text-left hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-border">
            <span className="flex items-center gap-2 text-base font-semibold">
              <Database className="h-5 w-5 text-primary shrink-0" />
              Base de données
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-6 pt-0">
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}

            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {isLoading
                    ? "Chargement…"
                    : readOnly
                      ? `${cooperatives.length} coopérative${cooperatives.length !== 1 ? "s" : ""}${
                          filterHint ? " (résultats filtrés)" : ""
                        }`
                      : `${published.length} publiée${published.length !== 1 ? "s" : ""} · ${drafts.length} brouillon${
                          drafts.length !== 1 ? "s" : ""
                        }${filterHint ? " (filtrés)" : ""}`}
                </p>
                {filterHint ? (
                  <p className="text-xs text-foreground/80 rounded-md border border-border bg-muted/40 px-2 py-1.5">
                    {filterHint}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Lignes par page</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => setPageSize(Number(v) as 5 | 15 | 50)}
                >
                  <SelectTrigger className="w-[88px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {readOnly ? (
              <CoopTable {...tableProps} showPublish={false} />
            ) : (
              <Tabs
                value={listTab}
                onValueChange={(v) => setListTab(v as ListTab)}
                className="w-full"
              >
                <TabsList className="mb-4 grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="published">
                    Publiées ({published.length})
                  </TabsTrigger>
                  <TabsTrigger value="drafts">
                    Brouillons ({drafts.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="published" className="mt-0">
                  <CoopTable {...tableProps} cooperatives={published} showPublish={false} />
                </TabsContent>
                <TabsContent value="drafts" className="mt-0">
                  <CoopTable {...tableProps} cooperatives={drafts} showPublish />
                </TabsContent>
              </Tabs>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {readOnly ? null : (
        <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette coopérative ?</AlertDialogTitle>
              <AlertDialogDescription>
                « {deleteTarget?.nom} » sera définitivement retirée de la base. Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground"
                onClick={(e) => {
                  const delId = deleteTarget?.id;
                  if (!delId) return;
                  e.preventDefault();
                  deleteMut.mutate(delId);
                }}
                disabled={deleteMut.isPending}
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
