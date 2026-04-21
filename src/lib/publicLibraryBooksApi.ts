import { supabase } from "./supabase";

export type PublicLibraryBook = {
  id: string;
  cover_url: string;
  pdf_url: string;
  title: string;
  author: string;
  description: string;
  keywords: string;
  published_at: string | null;
  created_at: string;
  updated_at?: string;
};

export type LibraryBookReview = {
  id: string;
  book_id: string;
  user_id: string;
  comment: string;
  rating: number;
  created_at: string;
};

export async function fetchPublishedLibraryBooks(limit?: number): Promise<PublicLibraryBook[]> {
  let q = supabase
    .from("lp_library_books")
    .select("id, cover_url, pdf_url, title, author, description, keywords, published_at, created_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (typeof limit === "number" && limit > 0) {
    q = q.limit(limit);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PublicLibraryBook[];
}

/**
 * Bloc « Articles » sur la landing : mêmes lignes que la bibliothèque admin (`lp_library_books`),
 * triées par dernière modification. Le filtrage brouillon / publié est assuré par les politiques RLS :
 * visiteur anonyme → uniquement `is_published` ; super admin connecté → toutes les ressources sauvegardées.
 */
export async function fetchArticlesHighlightBooks(limit: number): Promise<PublicLibraryBook[]> {
  const { data, error } = await supabase
    .from("lp_library_books")
    .select(
      "id, cover_url, pdf_url, title, author, description, keywords, published_at, created_at, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as PublicLibraryBook[];
}

export async function fetchBookReviews(bookId: string): Promise<LibraryBookReview[]> {
  const { data, error } = await supabase
    .from("lp_library_book_reviews")
    .select("id, book_id, user_id, comment, rating, created_at")
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LibraryBookReview[];
}

export type InsertBookReviewInput = {
  book_id: string;
  comment: string;
  rating: number;
};

export async function insertBookReview(input: InsertBookReviewInput): Promise<void> {
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
  const { error } = await supabase.from("lp_library_book_reviews").insert({
    book_id: input.book_id,
    user_id: user.id,
    comment,
    rating: input.rating,
  });
  if (error) throw error;
}
