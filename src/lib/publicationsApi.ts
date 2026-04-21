import { supabase } from "./supabase";

const BUCKET_IMAGES = "publication-images";
const BUCKET_FILES = "publication-files";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "")
  .toString()
  .trim()
  .replace(/\/$/, "");

export interface PublicationFile {
  name: string;
  type: string;
  url: string;
}

export interface PublicationComment {
  id: string;
  author: string;
  text: string;
  createdAt: Date;
}

export interface Publication {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  tags: string[];
  files: PublicationFile[];
  status: "draft" | "published";
  createdAt: Date;
  publishedAt?: Date;
  likes: number;
  clicks: number;
  comments: PublicationComment[];
}

interface DbPublication {
  id: string;
  author_id: string;
  profiles?: { full_name: string | null } | null;
  text: string;
  tags: string[] | null;
  status: "draft" | "published";
  likes: number;
  clicks: number;
  created_at: string;
  published_at: string | null;
  publication_files?: { name: string; mime_type: string; storage_path: string; bucket: string }[];
  publication_comments?: {
    id: string;
    text: string;
    created_at: string;
    profiles: { full_name: string | null } | null;
  }[];
}

function getPublicFileUrl(bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

async function getSignedFileUrl(bucket: string, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) return "";
  return data.signedUrl;
}

function mapDbToPublication(db: DbPublication, fileUrls?: Map<string, string>): Publication {
  const files: PublicationFile[] = (db.publication_files ?? []).map((f) => {
    const key = `${f.bucket}/${f.storage_path}`;
    const url =
      f.bucket === BUCKET_IMAGES
        ? getPublicFileUrl(f.bucket, f.storage_path)
        : fileUrls?.get(key) ?? "";
    return { name: f.name, type: f.mime_type, url };
  });

  const comments: PublicationComment[] = (db.publication_comments ?? []).map((c) => ({
    id: c.id,
    author:
      (c.profiles && typeof c.profiles === "object" && "full_name" in c.profiles
        ? c.profiles.full_name
        : null) ?? "Anonyme",
    text: c.text,
    createdAt: new Date(c.created_at),
  }));

  return {
    id: db.id,
    authorId: db.author_id,
    authorName:
      (db.profiles && typeof db.profiles === "object" && "full_name" in db.profiles
        ? db.profiles.full_name
        : null) ?? "Anonyme",
    text: db.text,
    tags: db.tags ?? [],
    files,
    status: db.status,
    createdAt: new Date(db.created_at),
    publishedAt: db.published_at ? new Date(db.published_at) : undefined,
    likes: db.likes,
    clicks: db.clicks,
    comments,
  };
}

/** Load signed URLs for private (PDF) files */
async function loadSignedUrls(
  files: { bucket: string; storage_path: string }[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  await Promise.all(
    files.map(async (f) => {
      if (f.bucket === BUCKET_FILES) {
        const url = await getSignedFileUrl(f.bucket, f.storage_path);
        map.set(`${f.bucket}/${f.storage_path}`, url);
      }
    })
  );
  return map;
}

export async function fetchPublications(): Promise<Publication[]> {
  const { data, error } = await supabase
    .from("publications")
    .select(
      `
      *,
      profiles!publications_author_profile_fkey(full_name),
      publication_files(name, mime_type, storage_path, bucket),
      publication_comments(
        id,
        text,
        created_at,
        profiles!publication_comments_author_profile_fkey(full_name)
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  const privateFiles = rows.flatMap((d) =>
    (d.publication_files ?? [])
      .filter((f: { bucket: string }) => f.bucket === BUCKET_FILES)
      .map((f: { bucket: string; storage_path: string }) => ({ bucket: f.bucket, storage_path: f.storage_path }))
  );
  const signedUrls = await loadSignedUrls(privateFiles);

  return rows.map((d) => mapDbToPublication(d as unknown as DbPublication, signedUrls));
}

/** Fetch only publications by the current authenticated user (for Liste Publication) */
export async function fetchMyPublications(): Promise<Publication[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return [];

  const { data, error } = await supabase
    .from("publications")
    .select(
      `
      *,
      profiles!publications_author_profile_fkey(full_name),
      publication_files(name, mime_type, storage_path, bucket),
      publication_comments(
        id,
        text,
        created_at,
        profiles!publication_comments_author_profile_fkey(full_name)
      )
    `
    )
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  const privateFiles = rows.flatMap((d) =>
    (d.publication_files ?? [])
      .filter((f: { bucket: string }) => f.bucket === BUCKET_FILES)
      .map((f: { bucket: string; storage_path: string }) => ({ bucket: f.bucket, storage_path: f.storage_path }))
  );
  const signedUrls = await loadSignedUrls(privateFiles);

  return rows.map((d) => mapDbToPublication(d as unknown as DbPublication, signedUrls));
}

export interface CreatePublicationInput {
  text: string;
  tags: string[];
  status: "draft" | "published";
  files: { file: File; name: string; type: string }[];
}

export async function createPublication(
  input: CreatePublicationInput
): Promise<Publication> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Non authentifié");

  const { data: pub, error } = await supabase
    .from("publications")
    .insert({
      author_id: user.id,
      text: input.text,
      tags: input.tags,
      status: input.status,
      published_at: input.status === "published" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) throw error;

  const pubId = (pub as { id: string }).id;

  for (const { file, name, type } of input.files) {
    const isImage = type.startsWith("image/");
    const bucket = isImage ? BUCKET_IMAGES : BUCKET_FILES;
    const ext = name.split(".").pop() ?? "bin";
    const path = `${pubId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: false,
    });

    if (!uploadError) {
      await supabase.from("publication_files").insert({
        publication_id: pubId,
        name,
        mime_type: type,
        storage_path: path,
        bucket,
      });
    }
  }

  const created = await fetchPublications();
  const found = created.find((p) => p.id === pubId);
  if (!found) throw new Error("Publication créée mais introuvable");
  return found;
}

export async function updatePublication(
  id: string,
  data: { text?: string; tags?: string[]; status?: "draft" | "published" }
): Promise<void> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.text !== undefined) updates.text = data.text;
  if (data.tags !== undefined) updates.tags = data.tags;
  if (data.status !== undefined) {
    updates.status = data.status;
    updates.published_at = data.status === "published" ? new Date().toISOString() : null;
  }

  const { error } = await supabase.from("publications").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deletePublication(id: string): Promise<void> {
  const { data: files } = await supabase
    .from("publication_files")
    .select("bucket, storage_path")
    .eq("publication_id", id);

  if (files) {
    for (const f of files) {
      await supabase.storage.from(f.bucket).remove([f.storage_path]);
    }
  }

  await supabase.from("publication_files").delete().eq("publication_id", id);
  await supabase.from("publication_comments").delete().eq("publication_id", id);
  const { error } = await supabase.from("publications").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleLike(id: string): Promise<void> {
  const { data, error } = await supabase
    .from("publications")
    .select("likes")
    .eq("id", id)
    .single();

  if (error) throw error;
  const current = (data as { likes: number }).likes;

  const { error: updateError } = await supabase
    .from("publications")
    .update({ likes: current + 1, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) throw updateError;
}

export async function incrementClicks(id: string): Promise<void> {
  const { data, error } = await supabase
    .from("publications")
    .select("clicks")
    .eq("id", id)
    .single();

  if (error) throw error;
  const current = (data as { clicks: number }).clicks;

  const { error: updateError } = await supabase
    .from("publications")
    .update({ clicks: current + 1, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) throw updateError;
}

export async function addComment(publicationId: string, text: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase.from("publication_comments").insert({
    publication_id: publicationId,
    author_id: user.id,
    text,
  });

  if (error) throw error;
}
