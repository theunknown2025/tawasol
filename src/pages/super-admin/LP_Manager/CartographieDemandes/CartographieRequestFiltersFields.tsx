import { useMemo } from "react";
import { useBarometreActivities } from "@/pages/super-admin/LP_Manager/Barometre/useBarometreActivities";
import { buildCommuneToProvinceMap } from "@/pages/super-admin/LP_Manager/Barometre/barometreSpatial";
import { useAdminBoundaries } from "@/pages/super-admin/LP_Manager/Barometre/useAdminBoundaries";
import { CartographieMultiSelect } from "./CartographieMultiSelect";
import type { CartographieInfoRequestFilters } from "./cartographieInfoRequestTypes";

type Props = {
  value: CartographieInfoRequestFilters;
  onChange: (next: CartographieInfoRequestFilters) => void;
  idPrefix?: string;
  disabled?: boolean;
};

export function CartographieRequestFiltersFields({
  value,
  onChange,
  idPrefix = "carto-filter",
  disabled = false,
}: Props) {
  const { activities, isLoading: activitiesLoading } = useBarometreActivities();
  const { boundaries, filteredProvinces, filteredCommunes, isLoading: boundariesLoading } =
    useAdminBoundaries();

  const provinces = boundaries.provinces?.features ?? filteredProvinces;
  const communes = boundaries.communes?.features ?? filteredCommunes;

  const communeToProvinceMap = useMemo(
    () => buildCommuneToProvinceMap(provinces, communes),
    [provinces, communes],
  );

  const provinceNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of provinces) map.set(f.properties.id, f.properties.name);
    return map;
  }, [provinces]);

  const provinceIdByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of provinces) map.set(f.properties.name, f.properties.id);
    return map;
  }, [provinces]);

  const activityOptions = useMemo(
    () =>
      [...activities]
        .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }))
        .map((a) => ({ value: a, label: a })),
    [activities],
  );

  const provinceOptions = useMemo(
    () =>
      [...provinces]
        .sort((a, b) =>
          a.properties.name.localeCompare(b.properties.name, "fr", { sensitivity: "base" }),
        )
        .map((f) => ({ value: f.properties.name, label: f.properties.name })),
    [provinces],
  );

  const selectedProvinceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const name of value.provinces) {
      const id = provinceIdByName.get(name);
      if (id) ids.add(id);
    }
    return ids;
  }, [value.provinces, provinceIdByName]);

  const communeOptions = useMemo(() => {
    if (selectedProvinceIds.size === 0) return [];
    return [...communes]
      .filter((f) => {
        const parent =
          f.properties.parentId ?? communeToProvinceMap.get(f.properties.id) ?? null;
        return parent != null && selectedProvinceIds.has(parent);
      })
      .sort((a, b) =>
        a.properties.name.localeCompare(b.properties.name, "fr", { sensitivity: "base" }),
      )
      .map((f) => ({ value: f.properties.name, label: f.properties.name }));
  }, [communes, selectedProvinceIds, communeToProvinceMap]);

  const setActivities = (activitiesNext: string[]) => {
    onChange({ ...value, activities: activitiesNext });
  };

  const setProvinces = (provincesNext: string[]) => {
    const nextIds = new Set<string>();
    for (const name of provincesNext) {
      const id = provinceIdByName.get(name);
      if (id) nextIds.add(id);
    }
    const allowedCommunes = new Set(
      communes
        .filter((f) => {
          const parent =
            f.properties.parentId ?? communeToProvinceMap.get(f.properties.id) ?? null;
          return parent != null && nextIds.has(parent);
        })
        .map((f) => f.properties.name),
    );
    onChange({
      ...value,
      provinces: provincesNext,
      communes: value.communes.filter((c) => allowedCommunes.has(c)),
    });
  };

  const setCommunes = (communesNext: string[]) => {
    onChange({ ...value, communes: communesNext });
  };

  const loading = activitiesLoading || boundariesLoading;

  return (
    <div className="space-y-4">
      <CartographieMultiSelect
        id={`${idPrefix}-activites`}
        label="Activité"
        placeholder={loading ? "Chargement…" : "Sélectionner une ou plusieurs activités"}
        searchPlaceholder="Rechercher une activité…"
        options={activityOptions}
        selected={value.activities}
        onChange={setActivities}
        disabled={disabled || loading}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <CartographieMultiSelect
          id={`${idPrefix}-provinces`}
          label="Province"
          placeholder={loading ? "Chargement…" : "Sélectionner une ou plusieurs provinces"}
          searchPlaceholder="Rechercher une province…"
          options={provinceOptions}
          selected={value.provinces}
          onChange={setProvinces}
          disabled={disabled || loading}
        />
        <CartographieMultiSelect
          id={`${idPrefix}-communes`}
          label="Commune"
          placeholder="Sélectionner une ou plusieurs communes"
          searchPlaceholder="Rechercher une commune…"
          options={communeOptions}
          selected={value.communes}
          onChange={setCommunes}
          disabled={disabled || loading || value.provinces.length === 0}
          disabledHint={
            value.provinces.length === 0
              ? "Sélectionnez d'abord une ou plusieurs provinces"
              : undefined
          }
        />
      </div>
      {value.provinces.length > 0 && communeOptions.length === 0 && !loading ? (
        <p className="text-xs text-muted-foreground">
          Aucune commune trouvée pour{" "}
          {value.provinces
            .map((n) => provinceNameById.get(provinceIdByName.get(n) ?? "") ?? n)
            .join(", ")}
          .
        </p>
      ) : null}
    </div>
  );
}
