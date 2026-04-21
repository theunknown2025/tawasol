import { supabase } from "@/lib/supabase";

export type ReviewAggregates = {
  reviewCount: number;
  /** Moyenne des notes (1–5), null si aucun avis */
  avgRating: number | null;
};

export async function fetchReviewAggregatesForBookIds(bookIds: string[]): Promise<ReviewAggregates> {
  if (bookIds.length === 0) {
    return { reviewCount: 0, avgRating: null };
  }
  const { data, error } = await supabase
    .from("lp_library_book_reviews")
    .select("rating")
    .in("book_id", bookIds);
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) {
    return { reviewCount: 0, avgRating: null };
  }
  const sum = rows.reduce((s, r) => s + (typeof r.rating === "number" ? r.rating : 0), 0);
  return { reviewCount: rows.length, avgRating: sum / rows.length };
}
