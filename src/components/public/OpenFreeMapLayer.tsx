import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { setWorkerUrl } from "maplibre-gl";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";

/** OpenFreeMap style URLs — free OSM vector tiles, no API key. */
export const OPENFREEMAP_STYLES = {
  liberty: "https://tiles.openfreemap.org/styles/liberty",
  bright: "https://tiles.openfreemap.org/styles/bright",
  positron: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
  fiord: "https://tiles.openfreemap.org/styles/fiord",
} as const;

// MapLibre v6 needs an explicit Vite worker URL or tiles/labels never load.
setWorkerUrl(maplibreWorkerUrl);

type OpenFreeMapLayerProps = {
  /** MapLibre style URL. Defaults to Liberty. */
  styleUrl?: string;
};

/** Vector basemap via OpenFreeMap + MapLibre GL Leaflet. */
export function OpenFreeMapLayer({
  styleUrl = OPENFREEMAP_STYLES.liberty,
}: OpenFreeMapLayerProps) {
  const map = useMap();

  useEffect(() => {
    const layer = maplibreGL({ style: styleUrl });
    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, styleUrl]);

  return null;
}
