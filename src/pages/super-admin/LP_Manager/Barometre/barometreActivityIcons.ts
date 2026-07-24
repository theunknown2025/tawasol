/** Couleurs + glyphes SVG par activité pour les marqueurs Leaflet. */

export type ActivityMarkerStyle = {
  pinFill: string;
  glyph: string;
  label: string;
};

const DEFAULT_STYLE: ActivityMarkerStyle = {
  pinFill: "#e11d48",
  label: "Autre",
  glyph:
    `<circle cx="14" cy="10" r="3.2" fill="#fff"/>`,
};

/** Glyphes centrés dans le pin (viewBox 28×36, tête ~ y=10). */
const ACTIVITY_STYLES: Record<string, ActivityMarkerStyle> = {
  "Agriculture et élevage": {
    pinFill: "#16a34a",
    label: "Agriculture et élevage",
    glyph:
      `<g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M14 14V6"/><path d="M14 8c-2.5 0-4 1.5-4 3.5S12 14 14 14"/><path d="M14 7c2 0 3.5 1.2 3.5 3S16 14 14 14"/>` +
      `</g>`,
  },
  Artisanat: {
    pinFill: "#b45309",
    label: "Artisanat",
    glyph:
      `<g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M10 6l8 8"/><path d="M16.5 7.5l1.5-1.5 2 2-1.5 1.5"/><path d="M9 15.5L7.5 17"/>` +
      `</g>`,
  },
  "Transformation agroalimentaire": {
    pinFill: "#c2410c",
    label: "Transformation agroalimentaire",
    glyph:
      `<g fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M9 14V9h10v5"/><path d="M8 14h12v2H8z"/><path d="M11 9V7h2v2M15 9V6h2v3"/>` +
      `</g>`,
  },
  "Commerce et distribution": {
    pinFill: "#2563eb",
    label: "Commerce et distribution",
    glyph:
      `<g fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M9 15V10l5-3 5 3v5"/><path d="M12 15v-3h4v3"/>` +
      `</g>`,
  },
  "Coopérative de services": {
    pinFill: "#7c3aed",
    label: "Coopérative de services",
    glyph:
      `<g fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">` +
      `<circle cx="11" cy="8" r="1.8"/><circle cx="17" cy="8" r="1.8"/>` +
      `<path d="M8.5 14c.8-1.5 2-2.2 3.5-2.2S14.7 12.5 15.5 14"/><path d="M14.5 14c.5-1 1.4-1.6 2.5-1.6 1.2 0 2.1.7 2.5 1.6"/>` +
      `</g>`,
  },
  "Tourisme et hébergement": {
    pinFill: "#0891b2",
    label: "Tourisme et hébergement",
    glyph:
      `<g fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M8 14v-2.5a2 2 0 012-2h8a2 2 0 012 2V14"/><path d="M8 14h12"/><path d="M10 9.5V8h2"/>` +
      `</g>`,
  },
  "Pêche et aquaculture": {
    pinFill: "#0284c7",
    label: "Pêche et aquaculture",
    glyph:
      `<g fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M8 10c2.5-3 6-3 9 0-3 3-6.5 3-9 0z"/><path d="M17 10l3-2v4l-3-2z"/><circle cx="12" cy="9.5" r="0.7" fill="#fff" stroke="none"/>` +
      `</g>`,
  },
  "Foresterie et environnement": {
    pinFill: "#15803d",
    label: "Foresterie et environnement",
    glyph:
      `<g fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M14 15v-3"/><path d="M14 12l-4-4h8l-4 4z"/><path d="M14 9l-3.2-3.2h6.4L14 9z"/>` +
      `</g>`,
  },
  "Énergies renouvelables": {
    pinFill: "#ca8a04",
    label: "Énergies renouvelables",
    glyph:
      `<g fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">` +
      `<circle cx="14" cy="10" r="2.2"/><path d="M14 5.5v1.2M14 13.3v1.2M9.5 10h1.2M17.3 10h1.2M10.7 6.7l.9.9M16.4 12.4l.9.9M10.7 13.3l.9-.9M16.4 7.6l.9-.9"/>` +
      `</g>`,
  },
  "Numérique et innovation": {
    pinFill: "#4f46e5",
    label: "Numérique et innovation",
    glyph:
      `<g fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">` +
      `<rect x="9" y="6.5" width="10" height="7" rx="1"/><path d="M12 15.5h4M14 13.5v2"/>` +
      `</g>`,
  },
};

export function getActivityMarkerStyle(activite: string): ActivityMarkerStyle {
  const key = activite.trim();
  return ACTIVITY_STYLES[key] ?? DEFAULT_STYLE;
}

const PIN_W = 28;
const PIN_H = 36;

/** HTML d’un DivIcon Leaflet : pin coloré + glyphe d’activité. */
export function buildActivityPinHtml(activite: string): string {
  const style = getActivityMarkerStyle(activite);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PIN_W}" height="${PIN_H}" viewBox="0 0 28 36" aria-hidden="true" style="display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">` +
    `<path fill="${style.pinFill}" stroke="#fff" stroke-width="1.2" d="M14 0C8.5 0 4 4.4 4 9.8c0 6.2 10 26.2 10 26.2S24 16 24 9.8C24 4.4 19.5 0 14 0z"/>` +
    style.glyph +
    `</svg>`
  );
}

export const ACTIVITY_PIN_SIZE = { width: PIN_W, height: PIN_H } as const;
