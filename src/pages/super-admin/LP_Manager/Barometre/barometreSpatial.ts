import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { centroid } from "@turf/centroid";
import type { BoundaryFeature } from "./useAdminBoundaries";

/**
 * Assigns each commune to the first province polygon that contains its centroid.
 * Commune GeoJSON often has no province code; this enables province → commune filtering in the UI.
 */
export function buildCommuneToProvinceMap(
  provinces: BoundaryFeature[],
  communes: BoundaryFeature[],
): Map<string, string> {
  const result = new Map<string, string>();
  for (const commune of communes) {
    let lonLat: [number, number] | null = null;
    try {
      const c = centroid(commune as never);
      const coords = c.geometry.coordinates;
      if (Array.isArray(coords) && coords.length >= 2 && typeof coords[0] === "number") {
        lonLat = [coords[0], coords[1]];
      }
    } catch {
      continue;
    }
    if (!lonLat) continue;
    for (const prov of provinces) {
      try {
        if (booleanPointInPolygon(lonLat, prov.geometry as never)) {
          result.set(commune.properties.id, prov.properties.id);
          break;
        }
      } catch {
        /* invalid geometry */
      }
    }
  }
  return result;
}
