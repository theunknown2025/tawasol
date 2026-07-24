import L from "leaflet";
import type { BarometreCooperative } from "./barometreCooperativesApi";
import { normalizeCooperativeLatLng } from "./barometreCoords";
import type { BoundaryFeature } from "./useAdminBoundaries";

/** Province affichable sur la carte : `province_id` en base ou province dérivée de la commune. */
export function resolveCooperativeProvinceId(
  coop: BarometreCooperative,
  communeToProvinceMap: Map<string, string>,
): string | null {
  if (coop.provinceId) return coop.provinceId;
  if (coop.communeId) return communeToProvinceMap.get(coop.communeId) ?? null;
  return null;
}

/**
 * Positions discrètes autour du centre d’une commune pour plusieurs repères (évite le chevauchement exact).
 */
export function spreadOffsetsAroundCenter(
  count: number,
  centerLat: number,
  centerLng: number,
): { lat: number; lng: number }[] {
  if (count <= 0) return [];
  if (count === 1) return [{ lat: centerLat, lng: centerLng }];
  const latRad = (centerLat * Math.PI) / 180;
  const cosLat = Math.max(Math.cos(latRad), 0.01);
  const radiusLat = 0.00042;
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    const latOff = radiusLat * Math.cos(angle);
    const lngOff = (radiusLat / cosLat) * Math.sin(angle);
    return { lat: centerLat + latOff, lng: centerLng + lngOff };
  });
}

export type CooperativePlacement = {
  coop: BarometreCooperative;
  lat: number;
  lng: number;
};

type PlaceOpts = {
  displayMode: "communes" | "provinces";
  communes: BoundaryFeature[];
  provinces: BoundaryFeature[];
  communeToProvinceMap: Map<string, string>;
};

/**
 * Place les coopératives : coordonnées X/Y sauvegardées en priorité (normalisées),
 * sinon centroïde commune/province (+ écartement).
 */
export function placeCooperativesOnMap(
  cooperatives: BarometreCooperative[],
  opts: PlaceOpts,
): CooperativePlacement[] {
  const out: CooperativePlacement[] = [];
  const withoutCoords: BarometreCooperative[] = [];

  for (const coop of cooperatives) {
    if (coop.latitude != null && coop.longitude != null) {
      const normalized = normalizeCooperativeLatLng(coop.latitude, coop.longitude);
      if (normalized) {
        out.push({ coop, lat: normalized.latitude, lng: normalized.longitude });
        continue;
      }
    }
    withoutCoords.push(coop);
  }

  if (opts.displayMode === "communes") {
    const byCommune = new Map<string, BarometreCooperative[]>();
    for (const c of withoutCoords) {
      if (!c.communeId) continue;
      const arr = byCommune.get(c.communeId) ?? [];
      arr.push(c);
      byCommune.set(c.communeId, arr);
    }
    for (const [, arr] of byCommune) {
      arr.sort((a, b) => a.id.localeCompare(b.id));
    }
    for (const [communeId, coops] of byCommune) {
      const feature = opts.communes.find((x) => x.properties.id === communeId);
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
  }

  const byProvince = new Map<string, BarometreCooperative[]>();
  for (const c of withoutCoords) {
    const pid = resolveCooperativeProvinceId(c, opts.communeToProvinceMap);
    if (!pid) continue;
    const arr = byProvince.get(pid) ?? [];
    arr.push(c);
    byProvince.set(pid, arr);
  }
  for (const [, arr] of byProvince) {
    arr.sort((a, b) => a.id.localeCompare(b.id));
  }
  for (const [provinceId, coops] of byProvince) {
    const feature = opts.provinces.find((x) => x.properties.id === provinceId);
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
}
