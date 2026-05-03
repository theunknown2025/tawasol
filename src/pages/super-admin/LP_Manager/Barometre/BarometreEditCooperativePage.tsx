import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BarometreAddCooperativePanel from "./BarometreAddCooperativePanel";
import { fetchBarometreCooperativeById } from "./barometreCooperativesApi";
import { useAdminBoundaries } from "./useAdminBoundaries";
import { buildCommuneToProvinceMap } from "./barometreSpatial";

const CARTOGRAPHIE_BASE = "/admin/remess-landing/cartographie";

export default function BarometreEditCooperativePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const coopId = id ?? "";

  const { boundaries, filteredProvinces, filteredCommunes, isLoading: boundariesLoading } = useAdminBoundaries();
  const provinces = boundaries.provinces?.features ?? filteredProvinces;
  const communes = boundaries.communes?.features ?? filteredCommunes;

  const communeToProvinceMap = useMemo(
    () => buildCommuneToProvinceMap(provinces, communes),
    [provinces, communes],
  );

  const provincesSorted = useMemo(
    () =>
      [...provinces].sort((a, b) =>
        a.properties.name.localeCompare(b.properties.name, "fr", { sensitivity: "base" }),
      ),
    [provinces],
  );

  const [coopFormProvinceId, setCoopFormProvinceId] = useState<string | null>(null);
  const [coopFormCommuneId, setCoopFormCommuneId] = useState<string | null>(null);

  const { data: cooperative, isLoading: coopLoading, error: coopError } = useQuery({
    queryKey: ["barometre-cooperative", coopId],
    queryFn: () => fetchBarometreCooperativeById(coopId),
    enabled: Boolean(coopId),
  });

  useEffect(() => {
    if (!cooperative) return;
    setCoopFormProvinceId(cooperative.provinceId);
    setCoopFormCommuneId(cooperative.communeId);
  }, [cooperative]);

  const communesInCoopProvince = useMemo(() => {
    if (!coopFormProvinceId) return [];
    return communes
      .filter((c) => communeToProvinceMap.get(c.properties.id) === coopFormProvinceId)
      .sort((a, b) =>
        a.properties.name.localeCompare(b.properties.name, "fr", { sensitivity: "base" }),
      );
  }, [communes, communeToProvinceMap, coopFormProvinceId]);

  const coopProvinceLabel =
    provincesSorted.find((p) => p.properties.id === coopFormProvinceId)?.properties.name ?? null;
  const coopCommuneLabel =
    communesInCoopProvince.find((c) => c.properties.id === coopFormCommuneId)?.properties.name ?? null;

  const goBack = useCallback(() => {
    navigate(CARTOGRAPHIE_BASE);
  }, [navigate]);

  const onSaved = useCallback(() => {
    navigate(CARTOGRAPHIE_BASE);
  }, [navigate]);

  if (!coopId) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Identifiant manquant.</p>
        <Button type="button" variant="outline" className="mt-4" onClick={goBack}>
          Retour
        </Button>
      </div>
    );
  }

  if (boundariesLoading || coopLoading) {
    return (
      <div className="flex items-center gap-2 p-8 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement…
      </div>
    );
  }

  if (coopError || !cooperative) {
    return (
      <div className="p-6 max-w-lg">
        <p className="text-sm text-destructive">
          {coopError instanceof Error ? coopError.message : "Coopérative introuvable."}
        </p>
        <Button type="button" variant="outline" className="mt-4 gap-2" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
          Retour à la cartographie
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="ghost" size="sm" className="gap-2 -ml-2" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Modifier une coopérative</h1>
          <p className="mt-1 text-sm text-muted-foreground">{cooperative.nom}</p>
        </div>

        <BarometreAddCooperativePanel
          mode="edit"
          editId={coopId}
          editCooperative={cooperative}
          onSaved={onSaved}
          onCancelEdit={goBack}
          provincesSorted={provincesSorted}
          communesInCoopProvince={communesInCoopProvince}
          coopProvinceId={coopFormProvinceId}
          coopCommuneId={coopFormCommuneId}
          onCoopProvinceChange={setCoopFormProvinceId}
          onCoopCommuneChange={setCoopFormCommuneId}
          coopProvinceLabel={coopProvinceLabel}
          coopCommuneLabel={coopCommuneLabel}
        />
      </div>
    </div>
  );
}
