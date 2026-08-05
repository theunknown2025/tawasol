import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FolderKanban,
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
import { deleteLpProjet } from "@/lib/lpProjetsApi";
import { formatLpProjetDates, type LpProjet } from "@/types/lpProjet";
import { slideBackgroundStyle } from "@/pages/super-admin/LP_Manager/types";

const QUERY_KEY = ["lp-projets"] as const;

export type ProjetsListViewMode = "cards" | "rows";
export type ProjetsPageSize = 5 | 15 | 50;

type ProjetsListProps = {
  projets: LpProjet[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onEdit: (projet: LpProjet) => void;
  viewMode: ProjetsListViewMode;
  onViewModeChange: (mode: ProjetsListViewMode) => void;
  pageSize: ProjetsPageSize;
  onPageSizeChange: (size: ProjetsPageSize) => void;
  page: number;
  onPageChange: (page: number) => void;
};

function filterProjets(projets: LpProjet[], search: string): LpProjet[] {
  const q = search.trim().toLowerCase();
  if (!q) return projets;
  return projets.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.zones.some((z) => z.toLowerCase().includes(q)) ||
      p.partners.some((partner) => partner.name.toLowerCase().includes(q)),
  );
}

export function ProjetsList({
  projets,
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
}: ProjetsListProps) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<LpProjet | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteLpProjet,
    onSuccess: () => {
      toast.success("Projet supprimé");
      void queryClient.invalidateQueries({ queryKey: [...QUERY_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["lp-projets-landing-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["lp-projets", "published"] });
      setDeleteTarget(null);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Suppression impossible");
    },
  });

  const filtered = filterProjets(projets, search);
  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const start = safePage * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Chargement des projets…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un projet…"
          />
        </div>
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(v) => {
            if (v === "cards" || v === "rows") onViewModeChange(v);
          }}
        >
          <ToggleGroupItem value="cards" aria-label="Cartes">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="rows" aria-label="Lignes">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v) as ProjetsPageSize)}
        >
          <SelectTrigger className="w-[5.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="15">15</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {totalFiltered === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Aucun projet trouvé.</p>
      ) : viewMode === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((projet) => (
            <div
              key={projet.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div
                className="relative aspect-[16/9] w-full"
                style={slideBackgroundStyle(projet.banner)}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                <h3 className="absolute bottom-3 left-3 right-3 text-lg font-bold text-white drop-shadow">
                  {projet.title}
                </h3>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={projet.status === "published" ? "default" : "secondary"}>
                    {projet.status === "published" ? "Publié" : "Brouillon"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatLpProjetDates(projet.dateDebut, projet.dateFin)}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {projet.description || "Pas de description"}
                </p>
                <div className="mt-auto flex gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => onEdit(projet)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Modifier
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-destructive"
                    onClick={() => setDeleteTarget(projet)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {pageItems.map((projet) => (
            <li
              key={projet.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <div
                className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg"
                style={slideBackgroundStyle(projet.banner)}
              >
                {!projet.banner || (projet.banner.type === "solid" && !projet.title) ? (
                  <FolderKanban className="h-5 w-5 text-white/80" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{projet.title}</h3>
                  <Badge variant={projet.status === "published" ? "default" : "secondary"}>
                    {projet.status === "published" ? "Publié" : "Brouillon"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatLpProjetDates(projet.dateDebut, projet.dateFin)} · {projet.results.length}{" "}
                  résultat{projet.results.length === 1 ? "" : "s"} · {projet.zones.length} zone
                  {projet.zones.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="sm" onClick={() => onEdit(projet)}>
                  Modifier
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setDeleteTarget(projet)}
                >
                  Supprimer
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalFiltered > 0 ? (
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground">
            {start + 1}–{Math.min(start + pageSize, totalFiltered)} sur {totalFiltered}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={safePage <= 0}
              onClick={() => onPageChange(safePage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm tabular-nums">
              {safePage + 1} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={safePage >= totalPages - 1}
              onClick={() => onPageChange(safePage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {deleteTarget?.title} » sera définitivement retiré. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
