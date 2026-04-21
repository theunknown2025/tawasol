import { supabase } from "./supabase";

const BUCKET = "landing_page";
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Lecture du fichier impossible"));
    r.readAsDataURL(file);
  });
}

/**
 * Téléverse une image pour la landing (dossier logique `segment`, ex. mot-du-president).
 * Si le bucket n’est pas disponible, retourne une data URL pour l’aperçu local.
 */
export async function uploadLandingPageImage(
  file: File,
  segment: string,
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
  const path = `${segment}/${user.id}/${crypto.randomUUID()}.${ext}`;

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

/**
 * Téléverse un PDF (charte, plaquette) pour la landing — bucket `landing_page`
 * (types MIME étendus côté Supabase, voir migrations).
 */
export async function uploadLandingPagePdf(
  file: File,
  segment: string,
): Promise<{ url: string }> {
  if (file.type !== "application/pdf") {
    throw new Error("Veuillez choisir un fichier PDF.");
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error("Le PDF ne doit pas dépasser 10 Mo.");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Connexion requise pour téléverser un document.");
  }

  const path = `${segment}/${user.id}/${crypto.randomUUID()}.pdf`;

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: "application/pdf",
  });

  if (upErr) {
    throw new Error(upErr.message || "Échec du téléversement du PDF.");
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
