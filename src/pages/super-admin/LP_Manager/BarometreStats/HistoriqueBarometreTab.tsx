import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  deleteBarometreDataset,
  fetchAllBarometreDatasets,
  setBarometreDatasetPublished,
} from "./barometreDatasetsApi";
import type { BarometreDataset } from "./barometreDatasetTypes";
import { BarometreFlexibleChart } from "./BarometreFlexibleChart";

type Props = {
  onEdit: (dataset: BarometreDataset) => void;
};

export function HistoriqueBarometreTab({ onEdit }: Props) {
  const queryClient = useQueryClient();

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["barometre-datasets"],
    queryFn: fetchAllBarometreDatasets,
  });

  const publishMut = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      setBarometreDatasetPublished(id, published),
    onSuccess: async (_, vars) => {
      toast.success(vars.published ? "Publié." : "Dépublie.");
      await queryClient.invalidateQueries({ queryKey: ["barometre-datasets"] });
      await queryClient.invalidateQueries({ queryKey: ["barometre-datasets-published"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteBarometreDataset,
    onSuccess: async () => {
      toast.success("Baromètre supprimé.");
      await queryClient.invalidateQueries({ queryKey: ["barometre-datasets"] });
      await queryClient.invalidateQueries({ queryKey: ["barometre-datasets-published"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Chargement…
      </div>
    );
  }

  if (isError) {
    return <p className="py-8 text-sm text-destructive">Impossible de charger les baromètres.</p>;
  }

  if (data.length === 0) {
    return (
      <p className="py-8 text-sm text-muted-foreground">
        Aucun baromètre pour le moment. Créez-en un dans l’onglet « Nouveau Baromètre ».
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {data.map((item) => (
        <li
          key={item.id}
          className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground">{item.name}</h3>
              {item.description ? (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
              ) : null}
            </div>
            <Badge variant={item.is_published ? "default" : "secondary"}>
              {item.is_published ? "Publié" : "Brouillon"}
            </Badge>
          </div>
          <BarometreFlexibleChart
            columns={item.columns}
            rows={item.rows}
            xColumnId={item.x_column_id}
            yColumnIds={item.y_column_ids}
            chartType={item.chart_type}
            chartStyle={item.chart_style}
            height={180}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => onEdit(item)}>
              <Pencil className="mr-1 h-3.5 w-3.5" />
              Modifier
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={publishMut.isPending}
              onClick={() =>
                publishMut.mutate({ id: item.id, published: !item.is_published })
              }
            >
              {item.is_published ? "Dépublier" : "Publier"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive"
              disabled={deleteMut.isPending}
              onClick={() => {
                if (window.confirm(`Supprimer « ${item.name} » ?`)) {
                  deleteMut.mutate(item.id);
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
