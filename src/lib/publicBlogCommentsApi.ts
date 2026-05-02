import { supabase } from "./supabase";

export type BlogComment = {
  id: string;
  blog_id: string;
  author_name: string;
  author_email: string;
  rating: number;
  comment: string;
  created_at: string;
};

export type InsertBlogCommentInput = {
  blog_id: string;
  author_name: string;
  author_email: string;
  rating: number;
  comment: string;
};

export async function fetchBlogComments(blogId: string): Promise<BlogComment[]> {
  const { data, error } = await supabase
    .from("blog_comments")
    .select("id, blog_id, author_name, author_email, rating, comment, created_at")
    .eq("blog_id", blogId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as BlogComment[];
}

export async function insertBlogComment(input: InsertBlogCommentInput): Promise<void> {
  const authorName = input.author_name.trim();
  const authorEmail = input.author_email.trim().toLowerCase();
  const comment = input.comment.trim();

  if (authorName.length < 2) {
    throw new Error("Le nom doit contenir au moins 2 caractères.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
    throw new Error("Veuillez renseigner une adresse email valide.");
  }
  if (input.rating < 1 || input.rating > 5) {
    throw new Error("La note doit être entre 1 et 5 étoiles.");
  }
  if (comment.length < 2) {
    throw new Error("Le commentaire est obligatoire.");
  }

  const { error } = await supabase.from("blog_comments").insert({
    blog_id: input.blog_id,
    author_name: authorName,
    author_email: authorEmail,
    rating: input.rating,
    comment,
  });

  if (error) throw error;
}
