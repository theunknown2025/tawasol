/** Coordonnées WGS84 pour la cartographie (Maroc). */

export function parseCoordValue(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const t = String(raw).trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function isValidWgs84(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/** Emprise approximative du Maroc (WGS84). */
function inMorocco(lat: number, lng: number): boolean {
  return lat >= 20.5 && lat <= 36.5 && lng >= -17.5 && lng <= -0.5;
}

/**
 * Normalise lat/lng. Corrige l’inversion fréquente (latitude collée dans X / longitude).
 * Retourne null si hors WGS84 (Leaflet ne peut pas afficher le marqueur).
 */
export function normalizeCooperativeLatLng(
  latitude: number,
  longitude: number,
): { latitude: number; longitude: number; swapped: boolean } | null {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (!isValidWgs84(latitude, longitude)) {
    // Souvent X=lat et Y=lng : lat hors [-90,90] mais l’autre couple est valide
    if (isValidWgs84(longitude, latitude)) {
      return { latitude: longitude, longitude: latitude, swapped: true };
    }
    return null;
  }

  if (inMorocco(latitude, longitude)) {
    return { latitude, longitude, swapped: false };
  }
  if (inMorocco(longitude, latitude)) {
    return { latitude: longitude, longitude: latitude, swapped: true };
  }

  return { latitude, longitude, swapped: false };
}

export function hasUsableMapCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): boolean {
  if (latitude == null || longitude == null) return false;
  return normalizeCooperativeLatLng(latitude, longitude) != null;
}
