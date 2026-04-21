import { differenceInCalendarDays, startOfDay } from "date-fns";

export type PmoDeadlineTone = "none" | "green" | "amber" | "yellow" | "red";

/**
 * Uses `date_fin` as the step deadline (calendar day).
 * - Green: more than 3 calendar days before the deadline
 * - Amber: 1–3 calendar days before (approaching)
 * - Yellow: same calendar day as the deadline
 * - Red: after the deadline day
 */
export function getPmoDeadlineTone(dateFin: string | null | undefined, now = new Date()): PmoDeadlineTone {
  if (!dateFin?.trim()) return "none";
  const deadline = startOfDay(new Date(dateFin + (dateFin.length <= 10 ? "T12:00:00" : "")));
  if (Number.isNaN(deadline.getTime())) return "none";
  const today = startOfDay(now);
  const daysUntil = differenceInCalendarDays(deadline, today);
  if (daysUntil < 0) return "red";
  if (daysUntil === 0) return "yellow";
  if (daysUntil > 3) return "green";
  return "amber";
}

export const PMO_TONE_LABELS: Record<Exclude<PmoDeadlineTone, "none">, string> = {
  green: "À l'avance (> 3 j.)",
  amber: "Sous 3 jours",
  yellow: "Jour J (échéance)",
  red: "En retard",
};

export function pmoToneClasses(tone: PmoDeadlineTone): string {
  switch (tone) {
    case "green":
      return "border-l-emerald-500 bg-emerald-500/5";
    case "amber":
      return "border-l-amber-500 bg-amber-500/5";
    case "yellow":
      return "border-l-yellow-400 bg-yellow-400/10";
    case "red":
      return "border-l-red-500 bg-red-500/5";
    default:
      return "border-l-muted-foreground/40 bg-muted/30";
  }
}
