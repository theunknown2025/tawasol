import { supabase } from "./supabase";

export type PublicBilanDocument = {
  id: string;
  year: number;
  title: string;
  description: string;
  pdf_url: string;
  published_at: string | null;
  created_at: string;
  updated_at?: string;
};

export type BilanDocumentReview = {
  id: string;
  document_id: string;
  user_id: string;
  comment: string;
  rating: number;
  created_at: string;
};

export async function fetchPublishedBilanById(id: string): Promise<PublicBilanDocument | null> {
  const { data, error } = await supabase
    .from("lp_bilan_documents")
    .select("id, year, title, description, pdf_url, published_at, created_at")
    .eq("is_published", true)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as PublicBilanDocument | null;
}

export async function fetchPublishedBilanDocuments(limit?: number): Promise<PublicBilanDocument[]> {
  let q = supabase
    .from("lp_bilan_documents")
    .select("id, year, title, description, pdf_url, published_at, created_at, updated_at")
    .eq("is_published", true)
    .order("year", { ascending: false })
    .order("updated_at", { ascending: false });
  if (typeof limit === "number" && limit > 0) {
    q = q.limit(limit);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PublicBilanDocument[];
}

/** Aperçu landing : derniers bilans (RLS filtre les non publiés pour les anonymes). */
export async function fetchBilanHighlightDocuments(limit: number): Promise<PublicBilanDocument[]> {
  const { data, error } = await supabase
    .from("lp_bilan_documents")
    .select("id, year, title, description, pdf_url, published_at, created_at, updated_at")
    .order("year", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as PublicBilanDocument[];
}

export async function fetchSimilarPublishedBilans(
  excludeId: string,
  limit: number,
): Promise<PublicBilanDocument[]> {
  const { data, error } = await supabase
    .from("lp_bilan_documents")
    .select("id, year, title, description, pdf_url, published_at, created_at, updated_at")
    .eq("is_published", true)
    .neq("id", excludeId)
    .order("year", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as PublicBilanDocument[];
}

export async function fetchBilanReviews(documentId: string): Promise<BilanDocumentReview[]> {
  const { data, error } = await supabase
    .from("lp_bilan_document_reviews")
    .select("id, document_id, user_id, comment, rating, created_at")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BilanDocumentReview[];
}

export type InsertBilanReviewInput = {
  document_id: string;
  comment: string;
  rating: number;
};

export async function insertBilanReview(input: InsertBilanReviewInput): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Vous devez être connecté pour laisser un avis.");
  }
  const comment = input.comment.trim();
  if (!comment) {
    throw new Error("Le commentaire ne peut pas être vide.");
  }
  if (input.rating < 1 || input.rating > 5) {
    throw new Error("La note doit être entre 1 et 5.");
  }
  const { error } = await supabase.from("lp_bilan_document_reviews").insert({
    document_id: input.document_id,
    user_id: user.id,
    comment,
    rating: input.rating,
  });
  if (error) throw error;
}
