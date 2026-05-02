import { supabase } from "./supabase";

const BUCKET = "blog_banners";
const MAX_BYTES = 5 * 1024 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Lecture du fichier impossible"));
    r.readAsDataURL(file);
  });
}

/**
 * Téléverse une bannière de blog (bucket `blog_banners`, réservé admin / super admin côté RLS).
 */
export async function uploadBlogBannerImage(
  file: File,
): Promise<{ url: string; usedFallback: boolean }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Veuillez choisir un fichier image (JPEG, PNG, WebP ou GIF).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("L’image ne doit pas dépasser 5 Mo.");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    const url = await fileToDataUrl(file);
    return { url, usedFallback: true };
  }

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `banners/${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (upErr) {
    const url = await fileToDataUrl(file);
    return { url, usedFallback: true };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, usedFallback: false };
}
