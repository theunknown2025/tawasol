import { supabase } from "./supabase";
import { makeBlogSlugCandidate, slugifyTitle } from "./blogSlug";

export interface Blog {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  content: string;
  banner: string | null;
  slug: string;
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
  slug: string;
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
    slug:
      db.slug && String(db.slug).trim().length > 0
        ? String(db.slug).trim()
        : `${slugifyTitle(db.title)}-${String(db.id).replace(/-/g, "").slice(0, 8)}`,
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
      profiles!blogs_author_id_profiles_fkey(full_name)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    const { data: data2, error: err2 } = await supabase
      .from("blogs")
      .select(
        `
        *,
        profiles!blogs_author_profile_fkey(full_name)
      `,
      )
      .order("created_at", { ascending: false });
    if (err2) throw error;
    const rows2 = (data2 ?? []) as unknown as DbBlog[];
    return rows2.map((row) => mapDbToBlog(row));
  }

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
      profiles!blogs_author_id_profiles_fkey(full_name)
    `,
    )
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    const { data: data2, error: err2 } = await supabase
      .from("blogs")
      .select(
        `
        *,
        profiles!blogs_author_profile_fkey(full_name)
      `,
      )
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });
    if (err2) throw error;
    const rows2 = (data2 ?? []) as unknown as DbBlog[];
    return rows2.map((row) => mapDbToBlog(row));
  }

  const rows = (data ?? []) as unknown as DbBlog[];
  return rows.map((row) => mapDbToBlog(row));
}

export interface CreateBlogInput {
  title: string;
  description: string;
  content: string;
  banner?: string | null;
  slug?: string | null;
  status: "draft" | "published";
}

type PgErr = { code?: string; message?: string };

async function insertBlogRow(input: CreateBlogInput, slug: string): Promise<{ blog: Blog } | { err: PgErr }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { err: { message: "Non authentifié" } };
  }

  const row = {
    author_id: user.id,
    title: input.title,
    description: input.description,
    content: input.content,
    banner: input.banner ?? null,
    slug,
    status: input.status,
    published_at: input.status === "published" ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from("blogs")
    .insert(row)
    .select(
      `
      *,
      profiles!blogs_author_id_profiles_fkey(full_name)
    `,
    )
    .single();

  if (!error && data) {
    return { blog: mapDbToBlog(data as unknown as DbBlog) };
  }

  const firstErr = error as PgErr | null;
  if (firstErr?.code === "23505") {
    return { err: firstErr };
  }

  const { data: data2, error: err2 } = await supabase
    .from("blogs")
    .insert(row)
    .select(
      `
      *,
      profiles!blogs_author_profile_fkey(full_name)
    `,
    )
    .single();

  if (!err2 && data2) {
    return { blog: mapDbToBlog(data2 as unknown as DbBlog) };
  }
  const secondErr = (err2 ?? error) as PgErr | null;
  return { err: secondErr ?? { message: "Erreur lors de la création du blog" } };
}

export async function createBlog(input: CreateBlogInput): Promise<Blog> {
  let slug =
    typeof input.slug === "string" && input.slug.trim().length > 0
      ? input.slug.trim().toLowerCase()
      : makeBlogSlugCandidate(input.title);

  for (let attempt = 0; attempt < 8; attempt++) {
    const result = await insertBlogRow(input, slug);
    if ("blog" in result) {
      return result.blog;
    }
    if (result.err.code === "23505") {
      slug = makeBlogSlugCandidate(input.title);
      continue;
    }
    const msg = result.err.message ?? "Erreur lors de la création du blog";
    throw new Error(msg);
  }

  throw new Error("Impossible d’attribuer un identifiant d’URL unique au blog.");
}

export async function updateBlog(
  id: string,
  data: {
    title?: string;
    description?: string;
    content?: string;
    banner?: string | null;
    slug?: string;
    status?: "draft" | "published";
  },
): Promise<void> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.content !== undefined) updates.content = data.content;
  if (data.banner !== undefined) updates.banner = data.banner;
  if (data.slug !== undefined) updates.slug = data.slug.trim().toLowerCase();
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
