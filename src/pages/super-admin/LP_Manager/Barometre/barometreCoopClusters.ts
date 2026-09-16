import L from "leaflet";
import type { CooperativePlacement } from "./barometreCoopPlacements";

/** Screen radius (px) — markers closer than this merge into one bubble. */
export const CLUSTER_RADIUS_PX = 70;
/** At this zoom and above, always show individual pins. */
export const CLUSTER_DISABLE_AT_ZOOM = 14;

export type CooperativeMapItem =
  | {
      type: "individual";
      key: string;
      placement: CooperativePlacement;
    }
  | {
      type: "cluster";
      key: string;
      count: number;
      lat: number;
      lng: number;
      members: CooperativePlacement[];
    };

function averageLatLng(members: CooperativePlacement[]): { lat: number; lng: number } {
  const n = members.length;
  let lat = 0;
  let lng = 0;
  for (const m of members) {
    lat += m.lat;
    lng += m.lng;
  }
  return { lat: lat / n, lng: lng / n };
}

/**
 * Distance-based clustering from X/Y (lat/lng).
 * Uses Leaflet Web Mercator projection so groups tighten as you zoom in.
 */
export function buildDistanceClusterItems(
  placements: CooperativePlacement[],
  map: L.Map,
  zoom: number,
  radiusPx: number = CLUSTER_RADIUS_PX,
  disableAtZoom: number = CLUSTER_DISABLE_AT_ZOOM,
): CooperativeMapItem[] {
  if (placements.length === 0) return [];

  if (zoom >= disableAtZoom) {
    return placements.map((placement) => ({
      type: "individual" as const,
      key: placement.coop.id,
      placement,
    }));
  }

  const projected = placements.map((placement) => {
    const point = map.project(L.latLng(placement.lat, placement.lng), zoom);
    return { placement, x: point.x, y: point.y };
  });

  const used = new Array(projected.length).fill(false);
  const items: CooperativeMapItem[] = [];
  const radiusSq = radiusPx * radiusPx;

  for (let i = 0; i < projected.length; i++) {
    if (used[i]) continue;

    // Flood-fill: merge every pin within radius of any member (distance chain).
    const memberIndexes: number[] = [];
    const queue = [i];
    used[i] = true;

    while (queue.length > 0) {
      const k = queue.pop()!;
      memberIndexes.push(k);
      for (let j = 0; j < projected.length; j++) {
        if (used[j]) continue;
        const dx = projected[k].x - projected[j].x;
        const dy = projected[k].y - projected[j].y;
        if (dx * dx + dy * dy <= radiusSq) {
          used[j] = true;
          queue.push(j);
        }
      }
    }

    const members = memberIndexes.map((idx) => projected[idx].placement);

    if (members.length === 1) {
      items.push({
        type: "individual",
        key: members[0].coop.id,
        placement: members[0],
      });
      continue;
    }

    const { lat, lng } = averageLatLng(members);
    const ids = members
      .map((m) => m.coop.id)
      .sort()
      .join(",");
    items.push({
      type: "cluster",
      key: `d:${ids}`,
      count: members.length,
      lat,
      lng,
      members,
    });
  }

  return items;
}

/** Bounds covering all members of a cluster (for click-to-zoom). */
export function clusterMembersBounds(members: CooperativePlacement[]): L.LatLngBounds | null {
  if (members.length === 0) return null;
  const bounds = L.latLngBounds(members.map((m) => [m.lat, m.lng] as [number, number]));
  return bounds.isValid() ? bounds : null;
}
