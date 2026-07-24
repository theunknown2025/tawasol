import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, MapPinned } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { GeoJSON as GeoJSONTypes } from "geojson";
import L from "leaflet";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import { CartographieLogos } from "@/components/public/logoscarto/CartographieLogos";
import BarometreDatabaseAccordion from "@/pages/super-admin/LP_Manager/Barometre/BarometreDatabaseAccordion";
import CooperativePlaceMarker from "@/pages/super-admin/LP_Manager/Barometre/CooperativePlaceMarker";
import { placeCooperativesOnMap } from "@/pages/super-admin/LP_Manager/Barometre/barometreCoopPlacements";
import {
  fetchBarometreCooperatives,
} from "@/pages/super-admin/LP_Manager/Barometre/barometreCooperativesApi";
import { buildCommuneToProvinceMap } from "@/pages/super-admin/LP_Manager/Barometre/barometreSpatial";
import { useAdminBoundaries } from "@/pages/super-admin/LP_Manager/Barometre/useAdminBoundaries";

function MapCameraController({
  selectionBounds,
  layerBounds,
}: {
  selectionBounds: L.LatLngBounds | null;
  layerBounds: L.LatLngBounds | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (selectionBounds?.isValid()) {
      map.fitBounds(selectionBounds, { padding: [48, 48], maxZoom: 12, animate: true });
      return;
    }
    if (layerBounds?.isValid()) {
      map.fitBounds(layerBounds, { padding: [20, 20], animate: true });
    }
  }, [map, selectionBounds, layerBounds]);
  return null;
}

export default function PublicBarometrePage() {
  const {
    boundaries,
    filteredProvinces,
    filteredCommunes,
    isLoading,
    error,
  } = useAdminBoundaries();

  const provinces = boundaries.provinces?.features ?? filteredProvinces;
  const communes = boundaries.communes?.features ?? filteredCommunes;

  const {
    data: cooperatives = [],
    isLoading: coopsLoading,
    isError: coopsQueryError,
    error: coopsQueryErrorRaw,
    refetch: refetchCooperatives,
  } = useQuery({
    queryKey: ["barometre-cooperatives", "public-map"],
    queryFn: fetchBarometreCooperatives,
    staleTime: 60_000,
  });

  const coopLoadError =
    coopsQueryError && coopsQueryErrorRaw instanceof Error
      ? coopsQueryErrorRaw.message
      : coopsQueryError
        ? "Impossible de charger les coopératives."
        : null;

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

  const [nomFilter, setNomFilter] = useState("");
  const [secteurFilter, setSecteurFilter] = useState("");
  const [secteurOpen, setSecteurOpen] = useState(false);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);
  const [selectedCommuneId, setSelectedCommuneId] = useState<string | null>(null);
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [communeOpen, setCommuneOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<"provinces" | "communes">("provinces");

  const secteursOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of cooperatives) {
      const a = c.activite.trim();
      if (a) set.add(a);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  }, [cooperatives]);

  const filteredCooperatives = useMemo(() => {
    const q = nomFilter.trim().toLowerCase();
    return cooperatives.filter((c) => {
      if (q && !c.nom.toLowerCase().includes(q)) return false;
      if (secteurFilter && c.activite !== secteurFilter) return false;
      const coopProvince =
        c.provinceId ?? (c.communeId ? communeToProvinceMap.get(c.communeId) ?? null : null);
      if (selectedProvinceId && coopProvince !== selectedProvinceId) return false;
      if (selectedCommuneId && c.communeId !== selectedCommuneId) return false;
      return true;
    });
  }, [
    cooperatives,
    nomFilter,
    secteurFilter,
    selectedProvinceId,
    selectedCommuneId,
    communeToProvinceMap,
  ]);

  const cooperativePlacements = useMemo(
    () =>
      placeCooperativesOnMap(filteredCooperatives, {
        displayMode,
        communes,
        provinces,
        communeToProvinceMap,
      }),
    [displayMode, filteredCooperatives, communes, provinces, communeToProvinceMap],
  );

  const activeFeatures = displayMode === "communes" ? communes : provinces;
  const activeGeoJson = useMemo(
    () => ({ type: "FeatureCollection" as const, features: activeFeatures }),
    [activeFeatures],
  );
  const mapBounds = useMemo(() => {
    if (activeFeatures.length === 0) return null;
    const bounds = L.geoJSON(activeGeoJson as never).getBounds();
    if (!bounds.isValid()) return null;
    return bounds;
  }, [activeFeatures, activeGeoJson]);

  const communesInSelectedProvince = useMemo(() => {
    if (!selectedProvinceId) return [];
    return communes
      .filter((c) => communeToProvinceMap.get(c.properties.id) === selectedProvinceId)
      .sort((a, b) =>
        a.properties.name.localeCompare(b.properties.name, "fr", { sensitivity: "base" }),
      );
  }, [communes, communeToProvinceMap, selectedProvinceId]);

  const selectedProvinceLabel =
    provincesSorted.find((p) => p.properties.id === selectedProvinceId)?.properties.name ?? null;
  const selectedCommuneLabel =
    communesInSelectedProvince.find((c) => c.properties.id === selectedCommuneId)?.properties.name ??
    null;

  const tableFilterHint = useMemo(() => {
    const parts: string[] = [];
    const n = nomFilter.trim();
    if (n) parts.push(`nom contenant « ${n} »`);
    if (secteurFilter) parts.push(`secteur « ${secteurFilter} »`);
    if (selectedCommuneId && selectedCommuneLabel) {
      const prov = selectedProvinceLabel ? ` · ${selectedProvinceLabel}` : "";
      parts.push(`commune « ${selectedCommuneLabel} »${prov}`);
    } else if (selectedProvinceId && selectedProvinceLabel) {
      parts.push(`province « ${selectedProvinceLabel} »`);
    }
    if (parts.length === 0) return null;
    return `Filtres : ${parts.join(" · ")}`;
  }, [
    nomFilter,
    secteurFilter,
    selectedCommuneId,
    selectedCommuneLabel,
    selectedProvinceId,
    selectedProvinceLabel,
  ]);

  const tableFilterKey = `${nomFilter.trim()}|${secteurFilter}|${selectedProvinceId ?? ""}|${selectedCommuneId ?? ""}`;

  const selectionBounds = useMemo(() => {
    if (selectedCommuneId) {
      const f = communes.find((c) => c.properties.id === selectedCommuneId);
      if (f) {
        const b = L.geoJSON(f as never).getBounds();
        if (b.isValid()) return b;
      }
    }
    if (selectedProvinceId) {
      const f = provinces.find((p) => p.properties.id === selectedProvinceId);
      if (f) {
        const b = L.geoJSON(f as never).getBounds();
        if (b.isValid()) return b;
      }
    }
    return null;
  }, [selectedCommuneId, selectedProvinceId, communes, provinces]);

  useEffect(() => {
    if (selectedCommuneId) setDisplayMode("communes");
    else if (selectedProvinceId) setDisplayMode("provinces");
  }, [selectedCommuneId, selectedProvinceId]);

  const isFeatureSelectedOnMap = useCallback(
    (feature: GeoJSONTypes.Feature) => {
      const id = (feature.properties as { id?: string } | null | undefined)?.id;
      if (!id) return false;
      if (displayMode === "communes") return selectedCommuneId === id;
      return selectedProvinceId === id && !selectedCommuneId;
    },
    [displayMode, selectedCommuneId, selectedProvinceId],
  );

  const styleForBoundaryFeature = useCallback(
    (feature: GeoJSONTypes.Feature) => {
      if (isFeatureSelectedOnMap(feature)) {
        return {
          fillColor: "#0EA5E9",
          color: "#0369A1",
          weight: 2,
          fillOpacity: 0.88,
        };
      }
      return {
        fillColor: "#CBD5E1",
        color: "#475569",
        weight: 1,
        fillOpacity: 0.75,
      };
    },
    [isFeatureSelectedOnMap],
  );

  const resetFilters = () => {
    setNomFilter("");
    setSecteurFilter("");
    setSelectedProvinceId(null);
    setSelectedCommuneId(null);
    setDisplayMode("provinces");
  };

  const activeCount = activeFeatures.length;
  const secteurLabel =
    secteurFilter.length > 0
      ? secteurFilter
      : "Tous les secteurs";

  return (
    <PublicShell>
      <PublicPageHero
        title="Cartographie des coopératives"
        description="Explorez la carte des coopératives publiées et affinez la liste par nom, secteur, province ou commune."
      />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <PublicBreadcrumbs items={[{ label: "Accueil", to: "/" }, { label: "Cartographie" }]} />

        <div className="mt-6 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-6 p-4 lg:flex-row lg:items-stretch lg:gap-0 lg:p-0">
            <aside className="flex w-full shrink-0 flex-col gap-4 lg:max-h-[min(100vh-6rem,900px)] lg:max-w-[380px] lg:overflow-y-auto lg:border-r lg:border-border lg:bg-muted/30 lg:p-5 xl:max-w-[400px]">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Filtres</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Nom, secteur d’activité, province et commune. Les repères coopératifs suivent le calque
                  (provinces ou communes).
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPinned className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>
                    Calque:{" "}
                    <strong className="text-foreground">
                      {displayMode === "communes" ? "Communes" : "Provinces"}
                    </strong>{" "}
                    ({activeCount})
                    {cooperativePlacements.length > 0 ? (
                      <span className="ml-1 text-muted-foreground"> · repères visibles</span>
                    ) : null}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant={displayMode === "provinces" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDisplayMode("provinces")}
                  >
                    Provinces
                  </Button>
                  <Button
                    type="button"
                    variant={displayMode === "communes" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDisplayMode("communes")}
                  >
                    Communes
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cartographie-nom">Nom de la coopérative</Label>
                <Input
                  id="cartographie-nom"
                  value={nomFilter}
                  onChange={(e) => setNomFilter(e.target.value)}
                  placeholder="Rechercher par nom…"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Secteur d’activité</p>
                <Popover open={secteurOpen} onOpenChange={setSecteurOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={secteurOpen}
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate text-left">{secteurLabel}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[min(100vw-2rem,380px)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Rechercher un secteur…" />
                      <CommandList>
                        <CommandEmpty>Aucun secteur.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="__all_sectors__"
                            onSelect={() => {
                              setSecteurFilter("");
                              setSecteurOpen(false);
                            }}
                          >
                            Tous les secteurs
                          </CommandItem>
                          {secteursOptions.map((s) => (
                            <CommandItem
                              key={s}
                              value={s}
                              onSelect={() => {
                                setSecteurFilter(s);
                                setSecteurOpen(false);
                              }}
                            >
                              {s}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Province</p>
                  <Popover open={provinceOpen} onOpenChange={setProvinceOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={provinceOpen}
                        className="w-full justify-between font-normal"
                      >
                        <span className="truncate text-left">
                          {selectedProvinceLabel ?? "Toutes les provinces"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[min(100vw-2rem,380px)] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Rechercher une province…" />
                        <CommandList>
                          <CommandEmpty>Aucune province.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="__clear_province__"
                              onSelect={() => {
                                setSelectedProvinceId(null);
                                setSelectedCommuneId(null);
                                setDisplayMode("provinces");
                                setProvinceOpen(false);
                              }}
                            >
                              Toutes les provinces
                            </CommandItem>
                            {provincesSorted.map((p) => (
                              <CommandItem
                                key={p.properties.id}
                                value={`${p.properties.name} ${p.properties.id}`}
                                onSelect={() => {
                                  setSelectedProvinceId(p.properties.id);
                                  setSelectedCommuneId(null);
                                  setDisplayMode("provinces");
                                  setProvinceOpen(false);
                                }}
                              >
                                {p.properties.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Commune</p>
                  <Popover open={communeOpen} onOpenChange={setCommuneOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={communeOpen}
                        className="w-full justify-between font-normal"
                        disabled={!selectedProvinceId}
                      >
                        <span className="truncate text-left">
                          {!selectedProvinceId
                            ? "Choisissez d’abord une province"
                            : (selectedCommuneLabel ?? "Toutes les communes")}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[min(100vw-2rem,380px)] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Rechercher une commune…"
                          disabled={!selectedProvinceId}
                        />
                        <CommandList>
                          <CommandEmpty>Aucune commune dans cette province.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="__clear_commune__"
                              disabled={!selectedProvinceId}
                              onSelect={() => {
                                setSelectedCommuneId(null);
                                setDisplayMode("provinces");
                                setCommuneOpen(false);
                              }}
                            >
                              Toutes les communes
                            </CommandItem>
                            {communesInSelectedProvince.map((c) => (
                              <CommandItem
                                key={c.properties.id}
                                value={`${c.properties.name} ${c.properties.id}`}
                                onSelect={() => {
                                  setSelectedCommuneId(c.properties.id);
                                  setDisplayMode("communes");
                                  setCommuneOpen(false);
                                }}
                              >
                                {c.properties.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={resetFilters}>
                  Réinitialiser les filtres
                </Button>
                {coopsLoading ? (
                  <span className="text-xs text-muted-foreground">Chargement des coopératives…</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {filteredCooperatives.length} coopérative
                    {filteredCooperatives.length === 1 ? "" : "s"} (carte)
                  </span>
                )}
              </div>

              {error ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {error}
                </p>
              ) : null}
            </aside>

            <div className="flex min-h-[min(70vh,620px)] min-w-0 flex-1 flex-col lg:min-h-[620px] lg:p-4">
              {isLoading ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Chargement des limites administratives…
                </div>
              ) : activeFeatures.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Aucune zone disponible pour ce niveau. Vérifiez les fichiers GeoJSON.
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
                  <MapContainer
                    center={[31.7, -6]}
                    zoom={5}
                    scrollWheelZoom
                    className="h-full min-h-[min(70vh,620px)] w-full lg:min-h-[620px]"
                  >
                    <MapCameraController selectionBounds={selectionBounds} layerBounds={mapBounds} />
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <GeoJSON
                      key={`${displayMode}-${activeCount}-${selectedCommuneId ?? ""}-${selectedProvinceId ?? ""}`}
                      data={activeGeoJson as never}
                      style={(feature) => styleForBoundaryFeature(feature as GeoJSONTypes.Feature)}
                      onEachFeature={(feature, layer) => {
                        const f = feature as GeoJSONTypes.Feature;
                        const props = feature.properties as Record<string, unknown> | undefined;
                        const geoName = String(
                          props?.name ??
                            props?.nom ??
                            props?.LIBELLE ??
                            props?.shapeName ??
                            "Zone",
                        );
                        layer.bindTooltip(geoName, {
                          sticky: true,
                          direction: "auto",
                          opacity: 0.95,
                        });
                        layer.on({
                          mouseover: () => {
                            if (!isFeatureSelectedOnMap(f)) {
                              layer.setStyle({
                                fillColor: "#38BDF8",
                                weight: 1.2,
                                color: "#334155",
                                fillOpacity: 0.75,
                              });
                            } else {
                              layer.setStyle({
                                fillColor: "#0284C7",
                                weight: 2,
                                color: "#0369A1",
                                fillOpacity: 0.92,
                              });
                            }
                          },
                          mouseout: () => {
                            layer.setStyle(styleForBoundaryFeature(f));
                          },
                        });
                      }}
                    />
                    {cooperativePlacements.map(({ coop, lat, lng }) => (
                      <CooperativePlaceMarker key={coop.id} coop={coop} latitude={lat} longitude={lng} />
                    ))}
                  </MapContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <BarometreDatabaseAccordion
            cooperatives={filteredCooperatives}
            isLoading={coopsLoading}
            error={coopLoadError}
            onRefresh={() => void refetchCooperatives()}
            filterHint={tableFilterHint}
            filterKey={tableFilterKey}
            readOnly
          />
          <CartographieLogos />
        </div>
      </main>
    </PublicShell>
  );
}
