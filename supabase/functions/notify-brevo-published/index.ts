/**
 * Notifications publication → Email (Brevo) + WhatsApp (WAHA), même webhook DB.
 * Tests : { test_brevo: true } | { test_waha: true } | { list_waha_groups: true } — JWT super_admin.
 *
 * Secrets : BREVO_* , WAHA_BASE_URL, WAHA_SESSION, WAHA_API_KEY, PUBLIC_SITE_URL,
 *           WEBHOOK_SECRET | WHATSAPP_WEBHOOK_SECRET (optionnel)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const BREVO_API = "https://api.brevo.com/v3";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
};

function optionalEnv(name: string): string | undefined {
  const v = Deno.env.get(name);
  return v?.trim() || undefined;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plainTextToHtml(text: string): string {
  return `<p>${escapeHtml(text).replace(/\n/g, "<br/>")}</p>`;
}

function shouldNotifyPublish(payload: WebhookPayload): boolean {
  const r = payload.record;
  if (!r || r.status !== "published") return false;
  if (payload.type === "INSERT") return true;
  const old = payload.old_record;
  if (!old) return true;
  return old.status !== "published";
}

function normalizeGroupJid(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (t.endsWith("@g.us")) return t;
  const digits = t.replace(/\D/g, "");
  if (digits.length >= 10) return `${digits}@g.us`;
  return null;
}

async function sendWahaText(
  baseUrl: string,
  apiKey: string | undefined,
  session: string,
  chatId: string,
  text: string,
): Promise<{ ok: boolean; detail?: string }> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/sendText`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-Api-Key"] = apiKey;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ session, chatId, text }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, detail: `${res.status}: ${body.slice(0, 500)}` };
  }
  return { ok: true };
}

function isTestBrevo(raw: unknown): raw is { test_brevo: true } {
  return typeof raw === "object" && raw !== null && "test_brevo" in raw &&
    (raw as { test_brevo?: unknown }).test_brevo === true;
}

function isTestWaha(raw: unknown): raw is { test_waha: true } {
  return typeof raw === "object" && raw !== null && "test_waha" in raw &&
    (raw as { test_waha?: unknown }).test_waha === true;
}

function isListWahaGroups(raw: unknown): raw is { list_waha_groups: true } {
  return typeof raw === "object" && raw !== null && "list_waha_groups" in raw &&
    (raw as { list_waha_groups?: unknown }).list_waha_groups === true;
}

async function wahaFetch(
  baseUrl: string,
  apiKey: string | undefined,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init?.headers);
  if (apiKey) headers.set("X-Api-Key", apiKey);
  return await fetch(url, { ...init, headers });
}

async function requireSuperAdmin(req: Request): Promise<
  | { ok: false; response: Response }
  | { ok: true; admin: ReturnType<typeof createClient> }
> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ ok: false, error: "Authorization Bearer requis" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ ok: false, error: "Session invalide ou expirée" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (pErr) throw pErr;
  if (profile?.role !== "super_admin") {
    return {
      ok: false,
      response: new Response(JSON.stringify({ ok: false, error: "Réservé au super admin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  return { ok: true, admin };
}

async function brevoFetch(apiKey: string, path: string, init?: RequestInit): Promise<Response> {
  const url = path.startsWith("http") ? path : `${BREVO_API}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("api-key", apiKey);
  headers.set("accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return await fetch(url, { ...init, headers });
}

async function handleTestBrevo(req: Request): Promise<Response> {
  const gate = await requireSuperAdmin(req);
  if (!gate.ok) return gate.response;

  const apiKey = optionalEnv("BREVO_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "BREVO_API_KEY manquant dans les secrets Edge Function." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const res = await brevoFetch(apiKey, "/account", { method: "GET" });
  const bodyText = await res.text();
  if (!res.ok) {
    return new Response(
      JSON.stringify({ ok: false, mode: "test_brevo", brevo_status: res.status, brevo_body: bodyText.slice(0, 800) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let account: unknown;
  try {
    account = JSON.parse(bodyText);
  } catch {
    account = bodyText;
  }

  return new Response(
    JSON.stringify({
      ok: true,
      mode: "test_brevo",
      message: "Clé API Brevo acceptée (GET /account).",
      account_preview: typeof account === "object" && account !== null
        ? {
          email: (account as { email?: string }).email,
          companyName: (account as { companyName?: string }).companyName,
        }
        : undefined,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

async function handleListWahaGroups(req: Request): Promise<Response> {
  const gate = await requireSuperAdmin(req);
  if (!gate.ok) return gate.response;

  const wahaBase = optionalEnv("WAHA_BASE_URL");
  if (!wahaBase) {
    return new Response(
      JSON.stringify({ ok: false, error: "WAHA_BASE_URL manquant dans les secrets Edge Function." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const session = optionalEnv("WAHA_SESSION") ?? "default";
  const apiKey = optionalEnv("WAHA_API_KEY");

  let res = await wahaFetch(wahaBase, apiKey, `/api/${encodeURIComponent(session)}/groups`, {
    method: "GET",
  });
  if (!res.ok) {
    res = await wahaFetch(
      wahaBase,
      apiKey,
      `/api/groups?session=${encodeURIComponent(session)}`,
      { method: "GET" },
    );
  }
  const bodyText = await res.text();
  if (!res.ok) {
    return new Response(
      JSON.stringify({
        ok: false,
        mode: "list_waha_groups",
        error: `WAHA ${res.status}`,
        detail: bodyText.slice(0, 800),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    return new Response(
      JSON.stringify({ ok: false, mode: "list_waha_groups", error: "Réponse WAHA invalide (JSON)" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const rawList = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed !== null && Array.isArray((parsed as { groups?: unknown }).groups)
    ? (parsed as { groups: unknown[] }).groups
    : [];

  const groups = rawList
    .map((g) => {
      if (typeof g !== "object" || g === null) return null;
      const row = g as Record<string, unknown>;
      const id = String(row.id ?? row.jid ?? row.chatId ?? "").trim();
      if (!id) return null;
      const name = String(row.name ?? row.subject ?? row.title ?? "").trim() || undefined;
      return { id, name };
    })
    .filter((g): g is { id: string; name?: string } => g !== null);

  return new Response(
    JSON.stringify({ ok: true, mode: "list_waha_groups", groups }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

async function handleTestWaha(req: Request): Promise<Response> {
  const gate = await requireSuperAdmin(req);
  if (!gate.ok) return gate.response;

  const { admin } = gate;

  const wahaBase = optionalEnv("WAHA_BASE_URL");
  if (!wahaBase) {
    return new Response(
      JSON.stringify({ ok: false, error: "WAHA_BASE_URL manquant dans les secrets Edge Function." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const session = optionalEnv("WAHA_SESSION") ?? "default";
  const apiKey = optionalEnv("WAHA_API_KEY");

  const siteUrl = optionalEnv("PUBLIC_SITE_URL") ?? "";
  const base = siteUrl.replace(/\/$/, "") || "https://example.com";
  const message =
    `🧪 Test REMESS — WAHA / Supabase.\n\nSi vous voyez ce message, la liaison fonctionne.\n\n👉 ${base}`;

  const { data: groups, error: gErr } = await admin.from("whatsapp_groups").select("*").eq("is_active", true);
  if (gErr) throw gErr;

  const rows = (groups ?? []) as Record<string, unknown>[];
  const results: { chatId: string; ok: boolean; detail?: string }[] = [];

  for (const g of rows) {
    const jidRaw = String(g.wa_group_jid ?? "").trim();
    const chatId = normalizeGroupJid(jidRaw);
    if (!chatId) {
      results.push({ chatId: jidRaw || "(vide)", ok: false, detail: "wa_group_jid manquant ou invalide" });
      continue;
    }
    const r = await sendWahaText(wahaBase, apiKey, session, chatId, message);
    results.push({ chatId, ok: r.ok, detail: r.detail });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      mode: "test_waha",
      message_preview: message.slice(0, 120),
      sent: results.filter((x) => x.ok).length,
      results,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

async function createAndSendCampaign(
  apiKey: string,
  params: {
    name: string;
    subject: string;
    senderName: string;
    senderEmail: string;
    htmlContent: string;
    listIds: number[];
  },
): Promise<{ campaignId: number; sendNowStatus: number }> {
  const createRes = await brevoFetch(apiKey, "/emailCampaigns", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      subject: params.subject,
      sender: { name: params.senderName, email: params.senderEmail },
      type: "classic",
      htmlContent: params.htmlContent,
      recipients: { listIds: params.listIds },
    }),
  });

  const createText = await createRes.text();
  if (!createRes.ok) {
    throw new Error(`Brevo createEmailCampaign ${createRes.status}: ${createText.slice(0, 600)}`);
  }

  let created: { id?: number };
  try {
    created = JSON.parse(createText) as { id?: number };
  } catch {
    throw new Error(`Brevo createEmailCampaign réponse invalide: ${createText.slice(0, 200)}`);
  }

  const campaignId = created.id;
  if (campaignId == null) {
    throw new Error("Brevo createEmailCampaign: pas d'id campagne dans la réponse.");
  }

  const sendRes = await brevoFetch(apiKey, `/emailCampaigns/${campaignId}/sendNow`, {
    method: "POST",
    body: "{}",
  });

  return { campaignId, sendNowStatus: sendRes.status };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody: unknown = await req.json().catch(() => undefined);

    if (isTestBrevo(rawBody)) {
      return await handleTestBrevo(req);
    }
    if (isTestWaha(rawBody)) {
      return await handleTestWaha(req);
    }
    if (isListWahaGroups(rawBody)) {
      return await handleListWahaGroups(req);
    }

    const webhookSecret = optionalEnv("WEBHOOK_SECRET") ?? optionalEnv("WHATSAPP_WEBHOOK_SECRET");
    if (webhookSecret) {
      const h = req.headers.get("x-webhook-secret");
      if (h !== webhookSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payload = rawBody as WebhookPayload;

    if (!payload || typeof payload !== "object") {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.type === "DELETE" || !payload.record) {
      return new Response(JSON.stringify({ ok: true, skipped: "delete or empty record" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const table = payload.table;
    if (!["publications", "evenements", "blogs"].includes(table)) {
      return new Response(JSON.stringify({ ok: true, skipped: "unsupported table" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!shouldNotifyPublish(payload)) {
      return new Response(JSON.stringify({ ok: true, skipped: "not a publish transition" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const record = payload.record;
    let category: "publication" | "event" | "blog";
    if (table === "publications") category = "publication";
    else if (table === "evenements") category = "event";
    else category = "blog";

    const siteUrl = optionalEnv("PUBLIC_SITE_URL") ?? "";
    const base = siteUrl.replace(/\/$/, "") || "https://example.com";

    let message = "";
    let subject = "";
    if (category === "publication") {
      const excerpt = truncate(String(record.text ?? "").replace(/\s+/g, " ").trim(), 400);
      message = `Nouvelle publication sur le Mur\n\n${excerpt}\n\n${base}/member/mur`;
      subject = "Nouvelle publication sur le Mur";
    } else if (category === "event") {
      const titre = String(record.titre ?? "Événement");
      const slug = String(record.public_slug ?? "").trim();
      const path = slug ? `/event/${slug}` : "/events";
      message = `Nouvel événement : ${titre}\n\n${base}${path}`;
      subject = `Événement : ${truncate(titre, 80)}`;
    } else {
      const title = String(record.title ?? "Article");
      const slug = String(record.slug ?? "").trim();
      const path = slug ? `/blog/${slug}` : "/blogs";
      message = `Nouvel article : ${title}\n\n${base}${path}`;
      subject = `Article : ${truncate(title, 80)}`;
    }

    const htmlContent =
      `<html><body>${plainTextToHtml(message)}<p style="color:#666;font-size:12px">REMESS — notification automatique</p></body></html>`;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    if (!supabaseUrl || !serviceKey) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: groups, error: gErr } = await supabase.from("whatsapp_groups").select("*").eq("is_active", true);
    if (gErr) throw gErr;

    const rows = (groups ?? []) as Record<string, unknown>[];
    const filtered = rows.filter((g) => {
      if (category === "publication") return g.notify_publications !== false;
      if (category === "event") return g.notify_events !== false;
      return g.notify_blogs !== false;
    });

    const listIds = [
      ...new Set(
        filtered
          .map((g) => g.brevo_list_id)
          .filter((id): id is number => typeof id === "number" && Number.isInteger(id) && id > 0),
      ),
    ];

    let brevoResult: Record<string, unknown> = { skipped: true };
    if (listIds.length > 0) {
      const apiKey = optionalEnv("BREVO_API_KEY");
      const senderEmail = optionalEnv("BREVO_SENDER_EMAIL");
      const senderName = optionalEnv("BREVO_SENDER_NAME") ?? "REMESS";

      if (apiKey && senderEmail) {
        try {
          const campaignName = `REMESS-${category}-${String(record.id ?? "").slice(0, 8)}-${Date.now()}`;
          const { campaignId, sendNowStatus } = await createAndSendCampaign(apiKey, {
            name: campaignName,
            subject,
            senderName,
            senderEmail,
            htmlContent,
            listIds,
          });
          brevoResult = {
            ok: true,
            brevo_campaign_id: campaignId,
            brevo_send_now_http_status: sendNowStatus,
            list_ids: listIds,
          };
        } catch (e) {
          brevoResult = { ok: false, error: e instanceof Error ? e.message : String(e) };
        }
      } else {
        brevoResult = { skipped: true, reason: "BREVO_API_KEY ou BREVO_SENDER_EMAIL manquant" };
      }
    } else {
      brevoResult = { skipped: true, reason: "aucune brevo_list_id pour cette catégorie" };
    }

    const wahaBase = optionalEnv("WAHA_BASE_URL");
    const wahaSession = optionalEnv("WAHA_SESSION") ?? "default";
    const wahaApiKey = optionalEnv("WAHA_API_KEY");

    let wahaResult: Record<string, unknown> = { skipped: true };
    if (wahaBase) {
      const results: { chatId: string; ok: boolean; detail?: string }[] = [];
      for (const g of filtered) {
        const jidRaw = String(g.wa_group_jid ?? "").trim();
        const chatId = normalizeGroupJid(jidRaw);
        if (!chatId) {
          results.push({ chatId: jidRaw || "(vide)", ok: false, detail: "wa_group_jid invalide" });
          continue;
        }
        const r = await sendWahaText(wahaBase, wahaApiKey, wahaSession, chatId, message);
        results.push({ chatId, ok: r.ok, detail: r.detail });
      }
      wahaResult = {
        ok: true,
        sent: results.filter((x) => x.ok).length,
        results,
      };
    } else {
      wahaResult = { skipped: true, reason: "WAHA_BASE_URL manquant" };
    }

    return new Response(
      JSON.stringify({
        ok: true,
        category,
        brevo: brevoResult,
        waha: wahaResult,
        warn: webhookSecret ? undefined : "WEBHOOK_SECRET non défini — à configurer en production",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
