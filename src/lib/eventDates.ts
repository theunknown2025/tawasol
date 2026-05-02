/** ISO date YYYY-MM-DD in local calendar for display. */
export function formatFrDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return iso;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR");
}

export function isoDateFromLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseIsoDateLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Libellé court pour la plage d’événement. */
export function formatEventDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start && !end) return "—";
  if (start && end && start === end) return formatFrDate(start);
  if (start && end) return `${formatFrDate(start)} → ${formatFrDate(end)}`;
  if (start) return `À partir du ${formatFrDate(start)}`;
  return `Jusqu’au ${formatFrDate(end!)}`;
}
