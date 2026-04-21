/**
 * Extrait latitude / longitude des liens Google Maps courants (partage, place, coordonnées dans l’URL).
 * Les liens courts (goo.gl / maps.app.goo.gl) ne sont pas résolus ici.
 */
export function parseLatLngFromGoogleMapsUrl(input: string): { lat: number; lng: number } | null {
  const raw = input.trim();
  if (!raw) return null;
  let href = raw;
  if (!/^https?:\/\//i.test(href)) {
    href = `https://${href.replace(/^\/+/, "")}`;
  }

  const atMatch = href.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = Number(atMatch[1]);
    const lng = Number(atMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  const d3d4 = href.match(/3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/i);
  if (d3d4) {
    const lat = Number(d3d4[1]);
    const lng = Number(d3d4[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  try {
    const u = new URL(href);
    const q = u.searchParams.get("q");
    if (q) {
      const coordLike = /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/.test(q.trim());
      if (coordLike) {
        const [a, b] = q.split(",").map((s) => Number(s.trim()));
        if (Number.isFinite(a) && Number.isFinite(b)) return { lat: a, lng: b };
      }
    }
    const ll = u.searchParams.get("ll");
    if (ll) {
      const parts = ll.split(",").map((s) => Number(s.trim()));
      if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
        return { lat: parts[0]!, lng: parts[1]! };
      }
    }
    const center = u.searchParams.get("center");
    if (center) {
      const parts = center.split(",").map((s) => Number(s.trim()));
      if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
        return { lat: parts[0]!, lng: parts[1]! };
      }
    }
  } catch {
    return null;
  }

  return null;
}

function isTrustedGoogleMapsHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "www.google.com" ||
    h === "google.com" ||
    h === "maps.google.com" ||
    h === "maps.googleapis.com" ||
    h.endsWith(".google.com") ||
    h.endsWith(".google.fr") ||
    h.endsWith(".google.co.ma")
  );
}

/**
 * URL sûre pour iframe : soit lien embed Google, soit carte centrée sur lat/lng.
 */
export function buildGoogleMapsEmbedSrc(
  googleMapsUrl: string,
  latitude: number | null,
  longitude: number | null,
): string | null {
  const trimmed = googleMapsUrl.trim();
  const lower = trimmed.toLowerCase();

  if (trimmed && (lower.includes("/maps/embed") || lower.includes("output=embed"))) {
    try {
      const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      if (u.protocol !== "https:" || !isTrustedGoogleMapsHost(u.hostname)) return null;
      return u.toString();
    } catch {
      return null;
    }
  }

  if (
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    return `https://www.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}&z=16&output=embed`;
  }

  return null;
}
