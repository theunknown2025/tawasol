import { supabase } from "./supabase";

export interface Blog {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  content: string;
  banner: string | null;
  status: "draft" | "published";
  createdAt: Date;
  publishedAt?: Date;
}

interface DbBlog {
  id: string;
  author_id: string;
  profiles?: { full_name: string | null } | null;
  title: string;
  description: string;
  content: string;
  banner: string | null;
  status: "draft" | "published";
  created_at: string;
  published_at: string | null;
}

function mapDbToBlog(db: DbBlog): Blog {
  return {
    id: db.id,
    authorId: db.author_id,
    authorName:
      (db.profiles && typeof db.profiles === "object" && "full_name" in db.profiles
        ? db.profiles.full_name
        : null) ?? "Anonyme",
    title: db.title,
    description: db.description,
    content: db.content,
    banner: db.banner,
    status: db.status,
    createdAt: new Date(db.created_at),
    publishedAt: db.published_at ? new Date(db.published_at) : undefined,
  };
}

export async function fetchBlogs(): Promise<Blog[]> {
  const { data, error } = await supabase
    .from("blogs")
    .select(
      `
      *,
      profiles!blogs_author_profile_fkey(full_name)
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as DbBlog[];
  return rows.map((row) => mapDbToBlog(row));
}

export async function fetchMyBlogs(): Promise<Blog[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return [];

  const { data, error } = await supabase
    .from("blogs")
    .select(
      `
      *,
      profiles!blogs_author_profile_fkey(full_name)
    `
    )
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as DbBlog[];
  return rows.map((row) => mapDbToBlog(row));
}

export interface CreateBlogInput {
  title: string;
  description: string;
  content: string;
  banner?: string | null;
  status: "draft" | "published";
}

export async function createBlog(input: CreateBlogInput): Promise<Blog> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Non authentifié");
  }

  const { data, error } = await supabase
    .from("blogs")
    .insert({
      author_id: user.id,
      title: input.title,
      description: input.description,
      content: input.content,
      banner: input.banner ?? null,
      status: input.status,
      published_at: input.status === "published" ? new Date().toISOString() : null,
    })
    .select(
      `
      *,
      profiles!blogs_author_profile_fkey(full_name)
    `
    )
    .single();

  if (error || !data) {
    throw error ?? new Error("Erreur lors de la création du blog");
  }

  return mapDbToBlog(data as unknown as DbBlog);
}

export async function updateBlog(
  id: string,
  data: {
    title?: string;
    description?: string;
    content?: string;
    banner?: string | null;
    status?: "draft" | "published";
  }
): Promise<void> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.content !== undefined) updates.content = data.content;
  if (data.banner !== undefined) updates.banner = data.banner;
  if (data.status !== undefined) {
    updates.status = data.status;
    updates.published_at = data.status === "published" ? new Date().toISOString() : null;
  }

  const { error } = await supabase.from("blogs").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteBlog(id: string): Promise<void> {
  const { error } = await supabase.from("blogs").delete().eq("id", id);
  if (error) throw error;
}

