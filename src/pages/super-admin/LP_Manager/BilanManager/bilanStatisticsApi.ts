import { supabase } from "@/lib/supabase";

export type BilanReviewAggregates = {
  reviewCount: number;
  avgRating: number | null;
};

export async function fetchBilanReviewAggregates(documentIds: string[]): Promise<BilanReviewAggregates> {
  if (documentIds.length === 0) {
    return { reviewCount: 0, avgRating: null };
  }
  const { data, error } = await supabase
    .from("lp_bilan_document_reviews")
    .select("rating")
    .in("document_id", documentIds);
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) {
    return { reviewCount: 0, avgRating: null };
  }
  const sum = rows.reduce((s, r) => s + (typeof r.rating === "number" ? r.rating : 0), 0);
  return { reviewCount: rows.length, avgRating: sum / rows.length };
}
