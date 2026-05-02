import { supabase } from "./supabase";

export type PublicBlogPost = {
  id: string;
  title: string;
  description: string;
  content: string;
  banner: string | null;
  slug: string;
  publishedAt: Date | null;
  createdAt: Date;
};

type DbPublicBlog = {
  id: string;
  title: string;
  description: string;
  content: string;
  banner: string | null;
  slug: string;
  published_at: string | null;
  created_at: string;
};

function mapRow(row: DbPublicBlog): PublicBlogPost {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    banner: row.banner,
    slug: row.slug,
    publishedAt: row.published_at ? new Date(row.published_at) : null,
    createdAt: new Date(row.created_at),
  };
}

export async function fetchPublishedBlogPosts(limit?: number): Promise<PublicBlogPost[]> {
  let q = supabase
    .from("blogs")
    .select("id, title, description, content, banner, slug, published_at, created_at")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (typeof limit === "number" && limit > 0) {
    q = q.limit(limit);
  }
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as DbPublicBlog[]).map(mapRow);
}

export async function fetchPublishedBlogBySlug(slug: string): Promise<PublicBlogPost | null> {
  const { data, error } = await supabase
    .from("blogs")
    .select("id, title, description, content, banner, slug, published_at, created_at")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapRow(data as DbPublicBlog);
}
