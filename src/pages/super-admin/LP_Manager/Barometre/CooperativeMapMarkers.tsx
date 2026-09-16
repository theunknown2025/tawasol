import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { Marker, useMap } from "react-leaflet";
import type { BarometreCooperative } from "./barometreCooperativesApi";
import type { CooperativePlacement } from "./barometreCoopPlacements";
import {
  buildDistanceClusterItems,
  clusterMembersBounds,
  CLUSTER_DISABLE_AT_ZOOM,
} from "./barometreCoopClusters";
import CooperativePlaceMarker from "./CooperativePlaceMarker";

function useMapZoomAndMove(): number {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());

  useEffect(() => {
    const sync = () => setZoom(map.getZoom());
    sync();
    map.on("zoomend", sync);
    map.on("zoom", sync);
    return () => {
      map.off("zoomend", sync);
      map.off("zoom", sync);
    };
  }, [map]);

  return zoom;
}

function clusterIconSize(count: number): number {
  if (count >= 50) return 52;
  if (count >= 20) return 46;
  if (count >= 10) return 40;
  return 34;
}

function createClusterDivIcon(count: number) {
  const size = clusterIconSize(count);
  return L.divIcon({
    className: "barometre-coop-cluster-icon",
    html: `<div class="barometre-coop-cluster" style="width:${size}px;height:${size}px;font-size:${size >= 46 ? 15 : 13}px" title="${count} coopératives"><span>${count}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

type ClusterMarkerProps = {
  clusterKey: string;
  count: number;
  lat: number;
  lng: number;
  members: CooperativePlacement[];
};

function CooperativeClusterMarker({
  clusterKey,
  count,
  lat,
  lng,
  members,
}: ClusterMarkerProps) {
  const map = useMap();
  const icon = useMemo(() => createClusterDivIcon(count), [count]);

  return (
    <Marker
      key={clusterKey}
      position={[lat, lng]}
      icon={icon}
      zIndexOffset={700}
      eventHandlers={{
        click: () => {
          const bounds = clusterMembersBounds(members);
          if (!bounds) return;
          map.fitBounds(bounds, {
            padding: [56, 56],
            maxZoom: CLUSTER_DISABLE_AT_ZOOM,
            animate: true,
          });
        },
      }}
    />
  );
}

type Props = {
  placements: CooperativePlacement[];
  /** @deprecated Unused — kept optional for call-site compatibility. */
  communeToProvinceMap?: Map<string, string>;
  onHover?: (coop: BarometreCooperative) => void;
  onSelect?: (coop: BarometreCooperative) => void;
};

/**
 * Distance clustering from cooperative X/Y: nearby pins merge; zoom in to split.
 */
export default function CooperativeMapMarkers({
  placements,
  onHover,
  onSelect,
}: Props) {
  const map = useMap();
  const zoom = useMapZoomAndMove();
  const items = useMemo(
    () => buildDistanceClusterItems(placements, map, zoom),
    [placements, map, zoom],
  );

  return (
    <>
      {items.map((item) => {
        if (item.type === "cluster") {
          return (
            <CooperativeClusterMarker
              key={item.key}
              clusterKey={item.key}
              count={item.count}
              lat={item.lat}
              lng={item.lng}
              members={item.members}
            />
          );
        }
        const { coop, lat, lng } = item.placement;
        return (
          <CooperativePlaceMarker
            key={item.key}
            coop={coop}
            latitude={lat}
            longitude={lng}
            onHover={onHover}
            onSelect={onSelect}
          />
        );
      })}
    </>
  );
}
