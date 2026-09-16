import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, LandPlot, Map, MapPinned } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { GeoJSON as GeoJSONTypes } from "geojson";
import L from "leaflet";
import { GeoJSON, MapContainer, useMap } from "react-leaflet";
import { OpenFreeMapLayer } from "@/components/public/OpenFreeMapLayer";
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
import { CartographieMapBrand } from "@/components/public/logoscarto/CartographieMapBrand";
import { LatestCooperativesSection } from "@/components/public/LatestCooperativesSection";
import CartographieInfoRequestForm from "@/components/public/cartographie/CartographieInfoRequestForm";
import CooperativeCard from "@/pages/super-admin/LP_Manager/Barometre/CooperativeCard";
import CooperativeMapMarkers from "@/pages/super-admin/LP_Manager/Barometre/CooperativeMapMarkers";
import { placeCooperativesOnMap } from "@/pages/super-admin/LP_Manager/Barometre/barometreCoopPlacements";
import {
  fetchBarometreCooperatives,
  type BarometreCooperative,
} from "@/pages/super-admin/LP_Manager/Barometre/barometreCooperativesApi";
import { buildCommuneToProvinceMap } from "@/pages/super-admin/LP_Manager/Barometre/barometreSpatial";
import { useAdminBoundaries } from "@/pages/super-admin/LP_Manager/Barometre/useAdminBoundaries";

function MapCameraController({
  selectionBounds,
  layerBounds,
  moroccoMaxBounds,
}: {
  selectionBounds: L.LatLngBounds | null;
  layerBounds: L.LatLngBounds | null;
  moroccoMaxBounds: L.LatLngBounds | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!moroccoMaxBounds?.isValid()) return;
    map.setMaxBounds(moroccoMaxBounds);
    map.options.maxBoundsViscosity = 1;
    const minZ = map.getBoundsZoom(moroccoMaxBounds, false);
    if (Number.isFinite(minZ)) map.setMinZoom(Math.max(1, Math.floor(minZ)));
  }, [map, moroccoMaxBounds]);

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
  } = useQuery({
    queryKey: ["barometre-cooperatives", "public-map"],
    queryFn: fetchBarometreCooperatives,
    staleTime: 60_000,
  });

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
  const [previewCoop, setPreviewCoop] = useState<BarometreCooperative | null>(null);

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

  /** Full Morocco extent (provinces) — used to lock panning/zoom outside the country. */
  const moroccoMaxBounds = useMemo(() => {
    if (provinces.length === 0) return null;
    const bounds = L.geoJSON({
      type: "FeatureCollection" as const,
      features: provinces,
    } as never).getBounds();
    if (!bounds.isValid()) return null;
    return bounds.pad(0.04);
  }, [provinces]);

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
          fillOpacity: 0.35,
        };
      }
      return {
        fillColor: "#CBD5E1",
        color: "#475569",
        weight: 1,
        fillOpacity: 0.18,
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
        contentMaxWidthClassName="max-w-7xl"
        trailing={<CartographieMapBrand />}
      />
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 md:py-10">
        <PublicBreadcrumbs items={[{ label: "Accueil", to: "/" }, { label: "Cartographie" }]} />

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="relative z-30 flex flex-col gap-3 border-b border-border bg-muted/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Filtres</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Nom, secteur, province et commune — les repères suivent le calque actif.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPinned className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>
                    Calque:{" "}
                    <strong className="text-foreground">
                      {displayMode === "communes" ? "Communes" : "Provinces"}
                    </strong>{" "}
                    ({activeCount})
                    {cooperativePlacements.length > 0 ? (
                      <span className="ml-1 text-muted-foreground">
                        {" "}
                        · {cooperativePlacements.length} coop. (regroupement par distance)
                      </span>
                    ) : null}
                  </span>
                </div>
                <div
                  className="inline-flex shrink-0 items-center rounded-lg border border-border bg-background p-0.5"
                  role="group"
                  aria-label="Calque cartographique"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 shrink-0",
                      displayMode === "provinces" && "bg-muted text-foreground shadow-sm",
                    )}
                    title="Calque provinces"
                    aria-label="Provinces"
                    aria-pressed={displayMode === "provinces"}
                    onClick={() => setDisplayMode("provinces")}
                  >
                    <Map size={16} aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 shrink-0",
                      displayMode === "communes" && "bg-muted text-foreground shadow-sm",
                    )}
                    title="Calque communes"
                    aria-label="Communes"
                    aria-pressed={displayMode === "communes"}
                    onClick={() => setDisplayMode("communes")}
                  >
                    <LandPlot size={16} aria-hidden />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                      className="w-full justify-between bg-background font-normal"
                    >
                      <span className="truncate text-left">{secteurLabel}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="z-[1100] w-[min(100vw-2rem,380px)] p-0" align="start">
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

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Province</p>
                <Popover open={provinceOpen} onOpenChange={setProvinceOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={provinceOpen}
                      className="w-full justify-between bg-background font-normal"
                    >
                      <span className="truncate text-left">
                        {selectedProvinceLabel ?? "Toutes les provinces"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="z-[1100] w-[min(100vw-2rem,380px)] p-0" align="start">
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
                      className="w-full justify-between bg-background font-normal"
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
                  <PopoverContent className="z-[1100] w-[min(100vw-2rem,380px)] p-0" align="start">
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
          </div>

          <div className="relative z-0 flex min-h-[min(75vh,720px)] min-w-0 flex-col gap-3 p-3 sm:p-4 lg:min-h-[720px] lg:flex-row lg:items-stretch">
            <div className="relative z-0 flex min-h-[min(55vh,520px)] min-w-0 flex-1 overflow-hidden rounded-lg border border-border lg:min-h-[720px]">
              {isLoading ? (
                <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
                  Chargement des limites administratives…
                </div>
              ) : activeFeatures.length === 0 ? (
                <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
                  Aucune zone disponible pour ce niveau. Vérifiez les fichiers GeoJSON.
                </div>
              ) : (
                <>
                  <MapContainer
                    center={[31.7, -6]}
                    zoom={5}
                    scrollWheelZoom
                    maxBounds={moroccoMaxBounds ?? undefined}
                    maxBoundsViscosity={1}
                    className="h-full min-h-[min(55vh,520px)] w-full bg-slate-50 lg:min-h-[720px]"
                  >
                    <MapCameraController
                      selectionBounds={selectionBounds}
                      layerBounds={mapBounds}
                      moroccoMaxBounds={moroccoMaxBounds}
                    />
                    <OpenFreeMapLayer />
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
                                fillOpacity: 0.28,
                              });
                            } else {
                              layer.setStyle({
                                fillColor: "#0284C7",
                                weight: 2,
                                color: "#0369A1",
                                fillOpacity: 0.42,
                              });
                            }
                          },
                          mouseout: () => {
                            layer.setStyle(styleForBoundaryFeature(f));
                          },
                        });
                      }}
                    />
                    <CooperativeMapMarkers
                      placements={cooperativePlacements}
                      communeToProvinceMap={communeToProvinceMap}
                      onHover={setPreviewCoop}
                      onSelect={setPreviewCoop}
                    />
                  </MapContainer>
                </>
              )}
            </div>

            <aside
              className="flex min-h-[280px] w-full shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card lg:min-h-[720px] lg:w-[320px]"
              aria-label="Informations de la coopérative"
            >
              {previewCoop ? (
                <CooperativeCard
                  key={previewCoop.id}
                  coop={previewCoop}
                  onClose={() => setPreviewCoop(null)}
                  className="h-full max-w-none rounded-none border-0 shadow-none"
                />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <MapPinned className="h-6 w-6 text-muted-foreground" aria-hidden />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Informations de la coopérative
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Survolez ou cliquez un repère sur la carte pour afficher les détails ici.
                    </p>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <LatestCooperativesSection cooperatives={cooperatives} />
          <CartographieInfoRequestForm />
          <CartographieLogos />
        </div>
      </main>
    </PublicShell>
  );
}
