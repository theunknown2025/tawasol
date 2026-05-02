import { useCallback, useEffect, useMemo, useState } from "react";

export type AdminLevel = "regions" | "provinces" | "communes";

type Geometry = {
  type: string;
  coordinates: unknown;
};

export type BoundaryFeatureProperties = {
  id: string;
  name: string;
  parentId?: string;
  [key: string]: unknown;
};

export type BoundaryFeature = {
  type: "Feature";
  properties: BoundaryFeatureProperties;
  geometry: Geometry;
};

type BoundaryCollection = {
  type: "FeatureCollection";
  features: BoundaryFeature[];
};

type BoundariesByLevel = Record<AdminLevel, BoundaryCollection | null>;
type SelectedByLevel = Record<AdminLevel, string | null>;

const BOUNDARY_FILE_PATHS: Record<AdminLevel, string[]> = {
  regions: ["/data/barometre/morocco-regions.geojson"],
  provinces: ["/data/barometre/morocco-provinces.geojson", "/data/morocco-provinces.geojson"],
  communes: [
    "/data/barometre/Commune_Maroc.geojson",
    "/data/barometre/morocco-communes.geojson",
    "/data/morocco-communes.geojson",
  ],
};

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  if (typeof value === "number") return String(value);
  return null;
}

function normalizeFeatureProperties(
  properties: Record<string, unknown> | null | undefined,
  index: number,
): BoundaryFeatureProperties {
  const safe = properties ?? {};
  const id =
    asString(safe.id) ??
    asString(safe.code) ??
    asString(safe.shapeID) ??
    asString(safe.shapeId) ??
    `feature-${index}`;
  const name =
    asString(safe.name) ??
    asString(safe.nom) ??
    asString(safe.LIBELLE) ??
    asString(safe.libelle) ??
    asString(safe.shapeName) ??
    `Feature ${index + 1}`;
  const parentId =
    asString(safe.parentId) ??
    asString(safe.parent_id) ??
    asString(safe.region_id) ??
    asString(safe.province_id);

  return { ...safe, id, name, parentId };
}

function normalizeCollection(raw: unknown): BoundaryCollection {
  if (!raw || typeof raw !== "object") {
    return { type: "FeatureCollection", features: [] };
  }

  const maybeCollection = raw as { type?: unknown; features?: unknown };
  const rawFeatures = Array.isArray(maybeCollection.features) ? maybeCollection.features : [];
  const features: BoundaryFeature[] = rawFeatures
    .filter((feature) => !!feature && typeof feature === "object")
    .map((feature, index) => {
      const casted = feature as {
        type?: unknown;
        properties?: Record<string, unknown>;
        geometry?: Geometry;
      };
      return {
        type: "Feature",
        properties: normalizeFeatureProperties(casted.properties, index),
        geometry: casted.geometry ?? { type: "GeometryCollection", coordinates: [] },
      };
    });

  return {
    type: "FeatureCollection",
    features,
  };
}

async function fetchFirstAvailable(paths: string[]): Promise<BoundaryCollection | null> {
  for (const path of paths) {
    try {
      const response = await fetch(path);
      if (!response.ok) continue;
      const data = await response.json();
      return normalizeCollection(data);
    } catch {
      // continue with fallback files
    }
  }
  return null;
}

export function useAdminBoundaries() {
  const [boundaries, setBoundaries] = useState<BoundariesByLevel>({
    regions: null,
    provinces: null,
    communes: null,
  });
  const [selectedIds, setSelectedIds] = useState<SelectedByLevel>({
    regions: null,
    provinces: null,
    communes: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadBoundaries() {
      setIsLoading(true);
      setError(null);

      const [regions, provinces, communes] = await Promise.all([
        fetchFirstAvailable(BOUNDARY_FILE_PATHS.regions),
        fetchFirstAvailable(BOUNDARY_FILE_PATHS.provinces),
        fetchFirstAvailable(BOUNDARY_FILE_PATHS.communes),
      ]);

      if (!isMounted) return;

      setBoundaries({ regions, provinces, communes });
      if (!provinces || !communes) {
        setError(
          "Les fichiers provinces/communes sont requis. Vérifiez /public/data/barometre/README.md.",
        );
      }
      setIsLoading(false);
    }

    void loadBoundaries();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectRegion = useCallback((id: string | null) => {
    setSelectedIds((prev) => ({
      ...prev,
      regions: id,
      provinces: null,
      communes: null,
    }));
  }, []);

  const selectProvince = useCallback((id: string | null) => {
    setSelectedIds((prev) => ({
      ...prev,
      provinces: id,
      communes: null,
    }));
  }, []);

  const selectCommune = useCallback((id: string | null) => {
    setSelectedIds((prev) => ({
      ...prev,
      communes: id,
    }));
  }, []);

  const filteredProvinces = useMemo(() => {
    const provinces = boundaries.provinces?.features ?? [];
    if (!selectedIds.regions) return provinces;
    const withParentIds = provinces.filter((feature) => !!feature.properties.parentId);
    if (withParentIds.length === 0) return provinces;
    return withParentIds.filter((feature) => feature.properties.parentId === selectedIds.regions);
  }, [boundaries.provinces, selectedIds.regions]);

  const filteredCommunes = useMemo(() => {
    const communes = boundaries.communes?.features ?? [];
    if (!selectedIds.provinces) return communes;
    const withParentIds = communes.filter((feature) => !!feature.properties.parentId);
    if (withParentIds.length === 0) return communes;
    return withParentIds.filter((feature) => feature.properties.parentId === selectedIds.provinces);
  }, [boundaries.communes, selectedIds.provinces]);

  return {
    boundaries,
    filteredProvinces,
    filteredCommunes,
    selectedIds,
    isLoading,
    error,
    selectRegion,
    selectProvince,
    selectCommune,
  };
}
