/**
 * Approve a cartographie info request and email an Excel of published cooperatives
 * (columns = requested fields).
 *
 * Secrets: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
 *   SMTP_FROM, SMTP_FROM_NAME (same as notify-smtp-published)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";
import * as XLSX from "npm:xlsx@0.18.5";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FIELD_LABELS: Record<string, string> = {
  nom: "Nom de la coopérative",
  description: "Description",
  secteur: "Secteur d'activité",
  sous_secteur: "Sous-secteur",
  province: "Province",
  commune: "Commune",
  adresse: "Adresse",
  coordonnees: "Coordonnées (longitude / latitude)",
  temps_de_travail: "Temps de travail",
  facebook: "Facebook",
  instagram: "Instagram",
  liens: "Liens",
  image_url: "Image (URL)",
};

const ALLOWED_FIELDS = new Set(Object.keys(FIELD_LABELS));

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function optionalEnv(name: string): string | undefined {
  const v = Deno.env.get(name);
  return v?.trim() || undefined;
}

function requireEnv(name: string): string {
  const v = optionalEnv(name);
  if (!v) throw new Error(`${name} manquant dans les secrets Edge Function`);
  return v;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseLinks(raw: unknown): string {
  if (!Array.isArray(raw)) return "";
  const parts: string[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const url = typeof rec.url === "string" ? rec.url.trim() : "";
    if (!url) continue;
    const label = typeof rec.label === "string" ? rec.label.trim() : "";
    parts.push(label ? `${label}: ${url}` : url);
  }
  return parts.join(" | ");
}

type CoopRow = {
  nom: string | null;
  description: string | null;
  secteur: string | null;
  activite: string | null;
  secteur_activite: string | null;
  sous_secteur: string | null;
  province_name: string | null;
  commune_name: string | null;
  adresse: string | null;
  longitude: number | null;
  latitude: number | null;
  temps_de_travail: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  links: unknown;
  liens: unknown;
  image_url: string | null;
};

function cellForField(coop: CoopRow, key: string): string {
  switch (key) {
    case "nom":
      return String(coop.nom ?? "").trim();
    case "description":
      return String(coop.description ?? "").trim();
    case "secteur":
      return String(coop.secteur ?? coop.activite ?? coop.secteur_activite ?? "").trim();
    case "sous_secteur":
      return String(coop.sous_secteur ?? "").trim();
    case "province":
      return String(coop.province_name ?? "").trim();
    case "commune":
      return String(coop.commune_name ?? "").trim();
    case "adresse":
      return String(coop.adresse ?? "").trim();
    case "coordonnees": {
      const lon = coop.longitude;
      const lat = coop.latitude;
      if (lon == null || lat == null) return "";
      return `${lon}, ${lat}`;
    }
    case "temps_de_travail":
      return String(coop.temps_de_travail ?? "").trim();
    case "facebook":
      return String(coop.facebook_url ?? "").trim();
    case "instagram":
      return String(coop.instagram_url ?? "").trim();
    case "liens":
      return parseLinks(coop.links ?? coop.liens);
    case "image_url":
      return String(coop.image_url ?? "").trim();
    default:
      return "";
  }
}

function buildWorkbook(coops: CoopRow[], fields: string[]): Uint8Array {
  const headers = fields.map((k) => FIELD_LABELS[k] ?? k);
  const rows = coops.map((c) => fields.map((k) => cellForField(c, k)));
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Cooperatives");
  const out = XLSX.write(book, { bookType: "xlsx", type: "array" }) as ArrayBuffer | Uint8Array;
  return out instanceof Uint8Array ? out : new Uint8Array(out);
}

async function requireSuperAdmin(req: Request): Promise<
  | { ok: false; response: Response }
  | { ok: true; admin: ReturnType<typeof createClient>; userId: string }
> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return { ok: false, response: json({ ok: false, error: "Authorization Bearer requis" }, 401) };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) {
    return { ok: false, response: json({ ok: false, error: "Session invalide ou expirée" }, 401) };
  }

  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (pErr) throw pErr;
  if (profile?.role !== "super_admin") {
    return { ok: false, response: json({ ok: false, error: "Réservé au super admin" }, 403) };
  }

  return { ok: true, admin, userId: userData.user.id };
}

async function sendExcelEmail(params: {
  to: string;
  fullName: string;
  fields: string[];
  xlsx: Uint8Array;
}): Promise<void> {
  const host = requireEnv("SMTP_HOST");
  const port = Number.parseInt(optionalEnv("SMTP_PORT") ?? "587", 10);
  const user = requireEnv("SMTP_USER");
  const pass = optionalEnv("SMTP_PASS") ?? optionalEnv("SMTP_PASSWORD");
  if (!pass) throw new Error("SMTP_PASS (ou SMTP_PASSWORD) manquant");
  const fromEmail = optionalEnv("SMTP_FROM") ?? "noreply@beta-remess.pro";
  const fromName = optionalEnv("SMTP_FROM_NAME") ?? "REMESS";

  const fieldList = params.fields.map((k) => FIELD_LABELS[k] ?? k).join(", ");
  const subject = "REMESS — Données cartographie des coopératives";
  const text =
    `Bonjour ${params.fullName},\n\n` +
    `Votre demande d'information cartographie a été approuvée.\n` +
    `Vous trouverez en pièce jointe un fichier Excel contenant les éléments demandés : ${fieldList}.\n\n` +
    `Cordialement,\nREMESS\n`;
  const html = `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;line-height:1.5;color:#222;max-width:640px;margin:0 auto;padding:24px">
  <h2 style="margin:0 0 16px;font-size:18px">Demande d'information approuvée</h2>
  <p style="margin:0 0 12px">Bonjour ${escapeHtml(params.fullName)},</p>
  <p style="margin:0 0 12px">Votre demande d'information cartographie a été approuvée.</p>
  <p style="margin:0 0 12px">Le fichier Excel joint contient les éléments demandés&nbsp;:</p>
  <p style="margin:0 0 16px;padding:12px 14px;background:#f6f6f6;border-radius:8px">${escapeHtml(fieldList)}</p>
  <p style="margin:0">Cordialement,<br/>REMESS</p>
</body>
</html>`;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    requireTLS: port === 587,
  });

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: params.to,
    subject,
    text,
    html,
    attachments: [
      {
        filename: "cooperatives-cartographie.xlsx",
        content: params.xlsx,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405);
    }

    const auth = await requireSuperAdmin(req);
    if (!auth.ok) return auth.response;

    const body = (await req.json().catch(() => null)) as { request_id?: string } | null;
    const requestId = String(body?.request_id ?? "").trim();
    if (!requestId) {
      return json({ ok: false, error: "request_id requis" }, 400);
    }

    const { data: request, error: rErr } = await auth.admin
      .from("cartographie_info_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();

    if (rErr) throw rErr;
    if (!request) {
      return json({ ok: false, error: "Demande introuvable" }, 404);
    }
    if (request.status === "rejected") {
      return json({ ok: false, error: "Cette demande a déjà été rejetée." }, 400);
    }

    const rawFields = Array.isArray(request.requested_fields) ? request.requested_fields : [];
    const fields = rawFields
      .filter((k): k is string => typeof k === "string" && ALLOWED_FIELDS.has(k));
    if (fields.length === 0) {
      return json({ ok: false, error: "Aucun élément d'information valide dans la demande." }, 400);
    }

    const { data: coops, error: cErr } = await auth.admin
      .from("barometre_cooperatives")
      .select(
        "nom, description, secteur, activite, secteur_activite, sous_secteur, province_name, commune_name, adresse, longitude, latitude, temps_de_travail, facebook_url, instagram_url, links, liens, image_url",
      )
      .eq("is_published", true)
      .order("nom", { ascending: true });

    if (cErr) throw cErr;

    const xlsx = buildWorkbook((coops ?? []) as CoopRow[], fields);

    try {
      await sendExcelEmail({
        to: String(request.email).trim(),
        fullName: String(request.full_name ?? "").trim() || "Madame, Monsieur",
        fields,
        xlsx,
      });
    } catch (mailErr) {
      const msg = mailErr instanceof Error ? mailErr.message : String(mailErr);
      await auth.admin
        .from("cartographie_info_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: auth.userId,
          email_error: msg,
        })
        .eq("id", requestId);
      return json({
        ok: false,
        error: `Demande marquée approuvée mais l'e-mail a échoué : ${msg}`,
      }, 200);
    }

    const { error: uErr } = await auth.admin
      .from("cartographie_info_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: auth.userId,
        email_sent_at: new Date().toISOString(),
        email_error: null,
      })
      .eq("id", requestId);

    if (uErr) throw uErr;

    return json({
      ok: true,
      message: `Demande approuvée. Excel envoyé à ${String(request.email).trim()}.`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ ok: false, error: msg }, 200);
  }
});
