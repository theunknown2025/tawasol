import { ChevronsUpDown, MapPinned } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { GeoJSON as GeoJSONTypes } from "geojson";
import L from "leaflet";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BarometreAddCooperativePanel from "./BarometreAddCooperativePanel";
import BarometreDatabaseAccordion from "./BarometreDatabaseAccordion";
import CooperativePlaceMarker from "./CooperativePlaceMarker";
import { spreadOffsetsAroundCenter } from "./barometreCoopPlacements";
import {
  fetchBarometreCooperatives,
  type BarometreCooperative,
} from "./barometreCooperativesApi";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAdminBoundaries } from "./useAdminBoundaries";
import { buildCommuneToProvinceMap } from "./barometreSpatial";

function MapCameraController({
  hasManualPoint,
  manualLat,
  manualLng,
  selectionBounds,
  layerBounds,
}: {
  hasManualPoint: boolean;
  manualLat: number;
  manualLng: number;
  selectionBounds: L.LatLngBounds | null;
  layerBounds: L.LatLngBounds | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (hasManualPoint) {
      map.setView([manualLat, manualLng], 8, { animate: true });
      return;
    }
    if (selectionBounds?.isValid()) {
      map.fitBounds(selectionBounds, { padding: [48, 48], maxZoom: 12, animate: true });
      return;
    }
    if (layerBounds?.isValid()) {
      map.fitBounds(layerBounds, { padding: [20, 20], animate: true });
    }
  }, [map, hasManualPoint, manualLat, manualLng, selectionBounds, layerBounds]);
  return null;
}

export default function MapPage() {
  const {
    boundaries,
    filteredProvinces,
    filteredCommunes,
    isLoading,
    error,
  } = useAdminBoundaries();

  const provinces = boundaries.provinces?.features ?? filteredProvinces;
  const communes = boundaries.communes?.features ?? filteredCommunes;

  const [cooperatives, setCooperatives] = useState<BarometreCooperative[]>([]);
  const [coopLoadError, setCoopLoadError] = useState<string | null>(null);
  const [coopLoading, setCoopLoading] = useState(true);

  const reloadCooperatives = useCallback(() => {
    setCoopLoading(true);
    fetchBarometreCooperatives()
      .then((rows) => {
        setCooperatives(rows);
        setCoopLoadError(null);
      })
      .catch((err: unknown) => {
        setCooperatives([]);
        setCoopLoadError(err instanceof Error ? err.message : "Chargement des coopératives impossible.");
      })
      .finally(() => setCoopLoading(false));
  }, []);

  useEffect(() => {
    reloadCooperatives();
  }, [reloadCooperatives]);

  const cooperativePlacements = useMemo(() => {
    const byCommune = new Map<string, BarometreCooperative[]>();
    for (const c of cooperatives) {
      if (!c.communeId) continue;
      const arr = byCommune.get(c.communeId) ?? [];
      arr.push(c);
      byCommune.set(c.communeId, arr);
    }
    for (const [, arr] of byCommune) {
      arr.sort((a, b) => a.id.localeCompare(b.id));
    }
    const out: { coop: BarometreCooperative; lat: number; lng: number }[] = [];
    for (const [communeId, coops] of byCommune) {
      const feature = communes.find((x) => x.properties.id === communeId);
      if (!feature) continue;
      const b = L.geoJSON(feature as never).getBounds();
      if (!b.isValid()) continue;
      const center = b.getCenter();
      const positions = spreadOffsetsAroundCenter(coops.length, center.lat, center.lng);
      coops.forEach((coop, i) => {
        out.push({ coop, lat: positions[i].lat, lng: positions[i].lng });
      });
    }
    return out;
  }, [cooperatives, communes]);

  const [displayMode, setDisplayMode] = useState<"provinces" | "communes">("provinces");
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

  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);
  const [selectedCommuneId, setSelectedCommuneId] = useState<string | null>(null);
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [communeOpen, setCommuneOpen] = useState(false);

  const [sidebarTab, setSidebarTab] = useState<"naviguer" | "ajouter">("naviguer");
  const [coopFormProvinceId, setCoopFormProvinceId] = useState<string | null>(null);
  const [coopFormCommuneId, setCoopFormCommuneId] = useState<string | null>(null);

  const communesInSelectedProvince = useMemo(() => {
    if (!selectedProvinceId) return [];
    return communes
      .filter((c) => communeToProvinceMap.get(c.properties.id) === selectedProvinceId)
      .sort((a, b) =>
        a.properties.name.localeCompare(b.properties.name, "fr", { sensitivity: "base" }),
      );
  }, [communes, communeToProvinceMap, selectedProvinceId]);

  const communesInCoopProvince = useMemo(() => {
    if (!coopFormProvinceId) return [];
    return communes
      .filter((c) => communeToProvinceMap.get(c.properties.id) === coopFormProvinceId)
      .sort((a, b) =>
        a.properties.name.localeCompare(b.properties.name, "fr", { sensitivity: "base" }),
      );
  }, [communes, communeToProvinceMap, coopFormProvinceId]);

  const selectedProvinceLabel =
    provincesSorted.find((p) => p.properties.id === selectedProvinceId)?.properties.name ?? null;
  const selectedCommuneLabel =
    communesInSelectedProvince.find((c) => c.properties.id === selectedCommuneId)?.properties.name ?? null;

  const cooperativesMatchingNavSearch = useMemo(() => {
    if (selectedCommuneId) {
      return cooperatives.filter((c) => c.communeId === selectedCommuneId);
    }
    if (selectedProvinceId) {
      return cooperatives.filter((c) => {
        if (c.provinceId === selectedProvinceId) return true;
        if (c.communeId && communeToProvinceMap.get(c.communeId) === selectedProvinceId) return true;
        return false;
      });
    }
    return cooperatives;
  }, [cooperatives, selectedCommuneId, selectedProvinceId, communeToProvinceMap]);

  const tableFilterHint = useMemo(() => {
    if (selectedCommuneId && selectedCommuneLabel) {
      const prov = selectedProvinceLabel ? ` · ${selectedProvinceLabel}` : "";
      return `Recherche : commune « ${selectedCommuneLabel} »${prov}`;
    }
    if (selectedProvinceId && selectedProvinceLabel) {
      return `Recherche : province « ${selectedProvinceLabel} »`;
    }
    return null;
  }, [
    selectedCommuneId,
    selectedCommuneLabel,
    selectedProvinceId,
    selectedProvinceLabel,
  ]);

  const tableFilterKey = `${selectedProvinceId ?? ""}|${selectedCommuneId ?? ""}`;

  const coopProvinceLabel =
    provincesSorted.find((p) => p.properties.id === coopFormProvinceId)?.properties.name ?? null;
  const coopCommuneLabel =
    communesInCoopProvince.find((c) => c.properties.id === coopFormCommuneId)?.properties.name ?? null;

  const naviguerSelectionBounds = useMemo(() => {
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

  const coopSelectionBounds = useMemo(() => {
    if (coopFormCommuneId) {
      const f = communes.find((c) => c.properties.id === coopFormCommuneId);
      if (f) {
        const b = L.geoJSON(f as never).getBounds();
        if (b.isValid()) return b;
      }
    }
    if (coopFormProvinceId) {
      const f = provinces.find((p) => p.properties.id === coopFormProvinceId);
      if (f) {
        const b = L.geoJSON(f as never).getBounds();
        if (b.isValid()) return b;
      }
    }
    return null;
  }, [coopFormCommuneId, coopFormProvinceId, communes, provinces]);

  const effectiveSelectionBounds =
    sidebarTab === "ajouter" ? coopSelectionBounds : naviguerSelectionBounds;

  useEffect(() => {
    if (sidebarTab !== "ajouter") return;
    if (coopFormCommuneId) setDisplayMode("communes");
    else if (coopFormProvinceId) setDisplayMode("provinces");
  }, [sidebarTab, coopFormCommuneId, coopFormProvinceId]);

  useEffect(() => {
    if (sidebarTab !== "naviguer") return;
    if (selectedCommuneId) setDisplayMode("communes");
    else if (selectedProvinceId) setDisplayMode("provinces");
  }, [sidebarTab, selectedCommuneId, selectedProvinceId]);

  const isFeatureSelectedOnMap = (feature: GeoJSONTypes.Feature) => {
    const id = (feature.properties as { id?: string } | null | undefined)?.id;
    if (!id) return false;
    if (displayMode === "communes") {
      if (sidebarTab === "ajouter") return coopFormCommuneId === id;
      return selectedCommuneId === id;
    }
    if (sidebarTab === "ajouter") {
      return coopFormProvinceId === id && !coopFormCommuneId;
    }
    return selectedProvinceId === id && !selectedCommuneId;
  };

  const styleForBoundaryFeature = (feature: GeoJSONTypes.Feature) => {
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
  };

  const activeCount = activeFeatures.length;
  const [xInput, setXInput] = useState("");
  const [yInput, setYInput] = useState("");

  const parsedLongitude = Number.parseFloat(xInput);
  const parsedLatitude = Number.parseFloat(yInput);
  const hasValidPoint =
    Number.isFinite(parsedLongitude) &&
    Number.isFinite(parsedLatitude) &&
    parsedLongitude >= -180 &&
    parsedLongitude <= 180 &&
    parsedLatitude >= -90 &&
    parsedLatitude <= 90;

  const positionIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<div style="font-size:20px; line-height:20px; transform: translate(-4px, -10px);">📍</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 20],
      }),
    [],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-6 p-4 lg:flex-row lg:items-stretch lg:gap-0 lg:p-0">
          <aside className="flex w-full shrink-0 flex-col gap-4 lg:max-h-[min(100vh-6rem,900px)] lg:max-w-[380px] lg:overflow-y-auto lg:border-r lg:border-border lg:bg-muted/30 lg:p-5 xl:max-w-[400px]">
            {coopLoadError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {coopLoadError}
              </p>
            )}
            <Tabs
              value={sidebarTab}
              onValueChange={(v) => setSidebarTab(v as "naviguer" | "ajouter")}
              className="flex w-full flex-col gap-0"
            >
              <TabsList className="grid h-10 w-full grid-cols-2">
                <TabsTrigger value="naviguer">Naviguer</TabsTrigger>
                <TabsTrigger value="ajouter">Ajouter</TabsTrigger>
              </TabsList>

              <TabsContent value="naviguer" className="mt-4 flex flex-col gap-4 focus-visible:ring-0">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Recherche</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Province, commune et coordonnées. La carte est à droite sur grand écran.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPinned className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  Calque:{" "}
                  <strong className="text-foreground">
                    {displayMode === "communes" ? "Communes" : "Provinces"}
                  </strong>{" "}
                  ({activeCount})
                  {displayMode === "communes" && cooperativePlacements.length > 0 ? (
                    <span className="ml-1 text-muted-foreground"> · repères coop.</span>
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
                    {selectedProvinceLabel ?? "Rechercher une province..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(100vw-2rem,380px)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Rechercher une province..." />
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
                        Effacer la sélection
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
                      ? "Sélectionnez d&apos;abord une province"
                      : (selectedCommuneLabel ?? "Rechercher une commune...")}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(100vw-2rem,380px)] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Rechercher une commune..."
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
                        Effacer la commune
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

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Position (X / Y)</p>
              <div className="grid gap-2">
                <Input
                  value={xInput}
                  onChange={(event) => setXInput(event.target.value)}
                  placeholder="X (longitude) ex: -8.03"
                  inputMode="decimal"
                />
                <Input
                  value={yInput}
                  onChange={(event) => setYInput(event.target.value)}
                  placeholder="Y (latitude) ex: 31.51"
                  inputMode="decimal"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {hasValidPoint
                  ? "Position valide: le repère est affiché sur la carte."
                  : "Saisissez X/Y valides pour afficher le repère."}
              </p>
            </div>

            {error && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {error}
              </p>
            )}
              </TabsContent>

              <TabsContent value="ajouter" className="mt-4 focus-visible:ring-0">
                <BarometreAddCooperativePanel
                  onSaved={reloadCooperatives}
                  provincesSorted={provincesSorted}
                  communesInCoopProvince={communesInCoopProvince}
                  coopProvinceId={coopFormProvinceId}
                  coopCommuneId={coopFormCommuneId}
                  onCoopProvinceChange={setCoopFormProvinceId}
                  onCoopCommuneChange={setCoopFormCommuneId}
                  coopProvinceLabel={coopProvinceLabel}
                  coopCommuneLabel={coopCommuneLabel}
                />
              </TabsContent>
            </Tabs>
          </aside>

          <div className="flex min-h-[min(70vh,620px)] min-w-0 flex-1 flex-col lg:min-h-[620px] lg:p-4">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Chargement des limites administratives...
          </div>
        ) : activeFeatures.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Aucune zone disponible pour ce niveau. Vérifiez les fichiers de données GeoJSON.
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
            <MapContainer center={[31.7, -6]} zoom={5} scrollWheelZoom className="h-full min-h-[min(70vh,620px)] w-full lg:min-h-[620px]">
              <MapCameraController
                hasManualPoint={hasValidPoint}
                manualLat={parsedLatitude}
                manualLng={parsedLongitude}
                selectionBounds={effectiveSelectionBounds}
                layerBounds={mapBounds}
              />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {hasValidPoint && (
                <Marker position={[parsedLatitude, parsedLongitude]} icon={positionIcon}>
                  <Popup>
                    X: {parsedLongitude.toFixed(6)}
                    <br />
                    Y: {parsedLatitude.toFixed(6)}
                  </Popup>
                </Marker>
              )}
              <GeoJSON
                key={`${displayMode}-${activeCount}-${sidebarTab}-${coopFormCommuneId ?? ""}-${coopFormProvinceId ?? ""}-${selectedCommuneId ?? ""}-${selectedProvinceId ?? ""}`}
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
              {displayMode === "communes" &&
                cooperativePlacements.map(({ coop, lat, lng }) => (
                  <CooperativePlaceMarker key={coop.id} coop={coop} latitude={lat} longitude={lng} />
                ))}
            </MapContainer>
          </div>
        )}
          </div>
        </div>
      </div>

      <BarometreDatabaseAccordion
        cooperatives={cooperativesMatchingNavSearch}
        isLoading={coopLoading}
        error={coopLoadError}
        onRefresh={reloadCooperatives}
        filterHint={tableFilterHint}
        filterKey={tableFilterKey}
      />
    </div>
  );
}
