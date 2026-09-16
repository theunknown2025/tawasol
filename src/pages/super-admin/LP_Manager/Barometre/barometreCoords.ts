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

function pairFromMatch(
  a: number,
  b: number,
): { latitude: number; longitude: number } | null {
  const normalized = normalizeCooperativeLatLng(a, b);
  if (!normalized) return null;
  return { latitude: normalized.latitude, longitude: normalized.longitude };
}

/**
 * Extrait lat/lng depuis un lien Google Maps (ou « lat, lng » collé).
 * Les liens courts (maps.app.goo.gl) sans coordonnées dans l’URL ne peuvent pas
 * être résolus côté navigateur — coller l’URL complète après ouverture.
 */
export function parseGoogleMapsLatLng(
  input: string,
): { latitude: number; longitude: number } | null {
  const text = input.trim();
  if (!text) return null;

  // Pin du lieu : !3dLAT!4dLNG (souvent le plus fiable)
  const bangMatches = [...text.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g)];
  if (bangMatches.length > 0) {
    const last = bangMatches[bangMatches.length - 1];
    const pair = pairFromMatch(Number(last[1]), Number(last[2]));
    if (pair) return pair;
  }

  // Centre de carte : @lat,lng,zoom
  const at = text.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (at) {
    const pair = pairFromMatch(Number(at[1]), Number(at[2]));
    if (pair) return pair;
  }

  // Paramètres q / ll / center / destination
  const query = text.match(
    /[?&](?:q|query|ll|center|destination)=(-?\d+(?:\.\d+)?)\s*,\s*\+?(-?\d+(?:\.\d+)?)/i,
  );
  if (query) {
    const pair = pairFromMatch(Number(query[1]), Number(query[2]));
    if (pair) return pair;
  }

  // /search/lat,+lng
  const search = text.match(/\/search\/(-?\d+(?:\.\d+)?)\s*,\s*\+?(-?\d+(?:\.\d+)?)/);
  if (search) {
    const pair = pairFromMatch(Number(search[1]), Number(search[2]));
    if (pair) return pair;
  }

  // Texte simple « 31.51, -8.03 »
  const plain = text.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (plain) {
    return pairFromMatch(Number(plain[1]), Number(plain[2]));
  }

  return null;
}
