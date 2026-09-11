/**
 * Import an external image (incl. public Google Drive share links) into
 * the `landing_page` storage bucket. Super-admin JWT required.
 *
 * Body: { url: string, segment?: string }
 * Returns: { url: string }
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "landing_page";
const MAX_BYTES = 5 * 1024 * 1024;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractGoogleDriveFileId(raw: string): string | null {
  const url = raw.trim();
  const lower = url.toLowerCase();
  const looksLikeDrive =
    lower.includes("drive.google.com") ||
    lower.includes("docs.google.com") ||
    lower.includes("googleusercontent.com");
  if (!looksLikeDrive) return null;

  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?[^#]*[?&]id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?[^#]*[?&]id=([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/(?:uc|file)\/d\/([a-zA-Z0-9_-]+)/,
    /googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]{20,})/,
  ];

  for (const re of patterns) {
    const m = url.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

function candidateFetchUrls(sourceUrl: string): string[] {
  const id = extractGoogleDriveFileId(sourceUrl);
  if (!id) return [sourceUrl.trim()];
  return [
    `https://lh3.googleusercontent.com/d/${id}`,
    `https://drive.google.com/uc?export=download&id=${id}`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w2000`,
    sourceUrl.trim(),
  ];
}

function extFromContentType(ct: string | null): string {
  const t = (ct ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (t === "image/png") return "png";
  if (t === "image/webp") return "webp";
  if (t === "image/gif") return "gif";
  if (t === "image/jpeg" || t === "image/jpg") return "jpg";
  return "jpg";
}

function isImageContentType(ct: string | null): boolean {
  return (ct ?? "").toLowerCase().startsWith("image/");
}

async function fetchImageBytes(sourceUrl: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  let lastError = "Téléchargement impossible.";

  for (const url of candidateFetchUrls(sourceUrl)) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: {
          // Some Drive CDN paths behave better with a browser-like Accept.
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
      });
      if (!res.ok) {
        lastError = `HTTP ${res.status} pour ${url}`;
        continue;
      }
      const contentType = res.headers.get("content-type");
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength === 0) {
        lastError = "Fichier vide.";
        continue;
      }
      if (buf.byteLength > MAX_BYTES) {
        throw new Error("L’image ne doit pas dépasser 5 Mo.");
      }
      // Drive sometimes returns HTML confirm pages — reject those.
      if (!isImageContentType(contentType)) {
        const head = new TextDecoder().decode(buf.slice(0, 64)).toLowerCase();
        if (head.includes("<!doctype") || head.includes("<html")) {
          lastError =
            "Google Drive a renvoyé une page HTML (fichier non public ou trop volumineux).";
          continue;
        }
        // Allow if magic bytes look like an image.
        const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
        const isPng = buf[0] === 0x89 && buf[1] === 0x50;
        const isGif = buf[0] === 0x47 && buf[1] === 0x49;
        const isWebp =
          buf[0] === 0x52 && buf[1] === 0x49 && buf[8] === 0x57 && buf[9] === 0x45;
        if (!isJpeg && !isPng && !isGif && !isWebp) {
          lastError = `Type non image (${contentType ?? "inconnu"}).`;
          continue;
        }
      }
      return {
        bytes: buf,
        contentType: isImageContentType(contentType)
          ? (contentType!.split(";")[0] ?? "image/jpeg")
          : "image/jpeg",
      };
    } catch (e) {
      if (e instanceof Error && e.message.includes("5 Mo")) throw e;
      lastError = e instanceof Error ? e.message : String(e);
    }
  }

  throw new Error(lastError);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(401, { error: "Unauthorized" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();
  if (userErr || !user) {
    return json(401, { error: "Invalid token" });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") {
    return json(403, { error: "Forbidden: Super Admin only" });
  }

  let body: { url?: string; segment?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const sourceUrl = typeof body.url === "string" ? body.url.trim() : "";
  if (!sourceUrl) {
    return json(400, { error: "Missing required field: url" });
  }

  const segmentRaw = typeof body.segment === "string" ? body.segment.trim() : "imports";
  const segment = segmentRaw.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "imports";

  try {
    const { bytes, contentType } = await fetchImageBytes(sourceUrl);
    const ext = extFromContentType(contentType);
    const path = `${segment}/${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    });
    if (upErr) {
      return json(400, { error: upErr.message || "Upload failed" });
    }

    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
    return json(200, { url: data.publicUrl });
  } catch (e) {
    return json(400, {
      error: e instanceof Error ? e.message : "Import failed",
    });
  }
});
