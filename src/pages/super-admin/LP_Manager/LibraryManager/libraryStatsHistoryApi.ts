import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subYears,
} from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/lib/supabase";

export type LibraryStatsGranularity = "daily" | "weekly" | "monthly";

export type LibraryStatsRangePreset = "month" | "6months" | "year" | "custom";

export type LibraryStatsHistoryPoint = {
  key: string;
  label: string;
  clicks: number;
  downloads: number;
  /** Nombre d’avis sur le créneau */
  evaluationsCount: number;
  /** Note moyenne (1–5) sur le créneau, null si aucun avis */
  evaluationAvg: number | null;
};

export type LibraryStatsHistoryRange = {
  from: Date;
  to: Date;
};

export function resolveLibraryStatsRange(
  preset: LibraryStatsRangePreset,
  customFrom: Date | undefined,
  customTo: Date | undefined,
  now = new Date(),
): LibraryStatsHistoryRange | null {
  const to = endOfDay(now);
  if (preset === "month") {
    return { from: startOfDay(subMonths(now, 1)), to };
  }
  if (preset === "6months") {
    return { from: startOfDay(subMonths(now, 6)), to };
  }
  if (preset === "year") {
    return { from: startOfDay(subYears(now, 1)), to };
  }
  if (!customFrom || !customTo) return null;
  const a = startOfDay(customFrom);
  const b = endOfDay(customTo);
  return a.getTime() <= b.getTime()
    ? { from: a, to: b }
    : { from: startOfDay(customTo), to: endOfDay(customFrom) };
}

function bucketStart(date: Date, granularity: LibraryStatsGranularity): Date {
  if (granularity === "daily") return startOfDay(date);
  if (granularity === "weekly") return startOfWeek(date, { weekStartsOn: 1 });
  return startOfMonth(date);
}

function bucketKey(date: Date, granularity: LibraryStatsGranularity): string {
  const start = bucketStart(date, granularity);
  if (granularity === "daily") return format(start, "yyyy-MM-dd");
  if (granularity === "weekly") return format(start, "RRRR-'W'II");
  return format(start, "yyyy-MM");
}

function bucketLabel(date: Date, granularity: LibraryStatsGranularity): string {
  const start = bucketStart(date, granularity);
  if (granularity === "daily") return format(start, "d MMM", { locale: fr });
  if (granularity === "weekly") {
    const end = endOfWeek(start, { weekStartsOn: 1 });
    return `${format(start, "d MMM", { locale: fr })} – ${format(end, "d MMM", { locale: fr })}`;
  }
  return format(start, "MMM yyyy", { locale: fr });
}

function emptyBuckets(
  range: LibraryStatsHistoryRange,
  granularity: LibraryStatsGranularity,
): Map<string, LibraryStatsHistoryPoint & { _ratingSum: number }> {
  const map = new Map<string, LibraryStatsHistoryPoint & { _ratingSum: number }>();
  let starts: Date[] = [];
  if (granularity === "daily") {
    starts = eachDayOfInterval({ start: range.from, end: range.to });
  } else if (granularity === "weekly") {
    starts = eachWeekOfInterval({ start: range.from, end: range.to }, { weekStartsOn: 1 });
  } else {
    starts = eachMonthOfInterval({
      start: startOfMonth(range.from),
      end: endOfMonth(range.to),
    });
  }
  for (const d of starts) {
    const key = bucketKey(d, granularity);
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: bucketLabel(d, granularity),
        clicks: 0,
        downloads: 0,
        evaluationsCount: 0,
        evaluationAvg: null,
        _ratingSum: 0,
      });
    }
  }
  return map;
}

function asCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function fetchLibraryStatsHistory(params: {
  bookIds: string[];
  range: LibraryStatsHistoryRange;
  granularity: LibraryStatsGranularity;
}): Promise<LibraryStatsHistoryPoint[]> {
  const { bookIds, range, granularity } = params;
  if (bookIds.length === 0) return [];

  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  const [eventsRes, reviewsRes, booksRes, allEventsRes] = await Promise.all([
    supabase
      .from("lp_library_book_events")
      .select("event_type, created_at")
      .in("book_id", bookIds)
      .gte("created_at", fromIso)
      .lte("created_at", toIso),
    supabase
      .from("lp_library_book_reviews")
      .select("created_at, rating")
      .in("book_id", bookIds)
      .gte("created_at", fromIso)
      .lte("created_at", toIso),
    supabase
      .from("lp_library_books")
      .select("id, click_count, download_count")
      .in("id", bookIds),
    supabase.from("lp_library_book_events").select("event_type").in("book_id", bookIds),
  ]);

  if (eventsRes.error) throw eventsRes.error;
  if (reviewsRes.error) throw reviewsRes.error;
  if (booksRes.error) throw booksRes.error;
  if (allEventsRes.error) throw allEventsRes.error;

  const buckets = emptyBuckets(range, granularity);

  for (const row of eventsRes.data ?? []) {
    const created = new Date(row.created_at as string);
    if (Number.isNaN(created.getTime())) continue;
    const key = bucketKey(created, granularity);
    const point = buckets.get(key);
    if (!point) continue;
    if (row.event_type === "click") point.clicks += 1;
    else if (row.event_type === "download") point.downloads += 1;
  }

  for (const row of reviewsRes.data ?? []) {
    const created = new Date(row.created_at as string);
    if (Number.isNaN(created.getTime())) continue;
    const key = bucketKey(created, granularity);
    const point = buckets.get(key);
    if (!point) continue;
    const rating = asCount(row.rating);
    if (rating < 1) continue;
    point.evaluationsCount += 1;
    point._ratingSum += rating;
  }

  const result: LibraryStatsHistoryPoint[] = [];
  for (const point of buckets.values()) {
    const { _ratingSum, ...rest } = point;
    result.push({
      ...rest,
      evaluationAvg:
        rest.evaluationsCount > 0 ? Math.round((_ratingSum / rest.evaluationsCount) * 100) / 100 : null,
    });
  }

  // Legacy counters without timed events: attribute the gap to today when in range.
  const now = new Date();
  if (now.getTime() >= range.from.getTime() && now.getTime() <= range.to.getTime()) {
    const todayKey = bucketKey(now, granularity);
    const todayPoint = result.find((p) => p.key === todayKey);
    if (todayPoint) {
      const counterClicks = (booksRes.data ?? []).reduce((s, b) => s + asCount(b.click_count), 0);
      const counterDownloads = (booksRes.data ?? []).reduce(
        (s, b) => s + asCount(b.download_count),
        0,
      );
      const loggedClicks = (allEventsRes.data ?? []).filter((e) => e.event_type === "click").length;
      const loggedDownloads = (allEventsRes.data ?? []).filter(
        (e) => e.event_type === "download",
      ).length;
      todayPoint.clicks += Math.max(0, counterClicks - loggedClicks);
      todayPoint.downloads += Math.max(0, counterDownloads - loggedDownloads);
    }
  }

  return result;
}
