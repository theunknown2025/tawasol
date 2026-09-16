/**
 * WhatsApp notifications via Green API when content is published.
 * Tables: publications, evenements, blogs, lp_opportunities
 *
 * Secrets: PUBLIC_SITE_URL (optional), WEBHOOK_SECRET (optional)
 * Credentials: public.green_api_messaging_config
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

const GREEN_FETCH_TIMEOUT_MS = 15_000;

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
};

type ContentType = "publication" | "event" | "opportunity" | "blog";

type BuiltWa = {
  contentType: ContentType;
  contentId: string | null;
  contentTitle: string;
  message: string;
};

type GreenConfig = {
  instance_id: string;
  api_token: string;
  api_url: string;
  group_name: string;
  group_chat_id: string;
};

function optionalEnv(name: string): string | undefined {
  const v = Deno.env.get(name);
  return v?.trim() || undefined;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function siteBase(): string {
  return (optionalEnv("PUBLIC_SITE_URL") ?? "").replace(/\/$/, "") || "https://beta-remess.pro";
}

function shouldNotifyPublish(payload: WebhookPayload): boolean {
  const r = payload.record;
  if (!r || r.status !== "published") return false;
  if (payload.type === "INSERT") return true;
  const old = payload.old_record;
  if (!old) return true;
  return old.status !== "published";
}

function normalizeApiUrl(raw: string): string {
  const t = raw.trim().replace(/\/$/, "");
  return t || "https://api.green-api.com";
}

function deriveApiUrlFromInstanceId(instanceId: string): string | null {
  const m = instanceId.trim().match(/^(\d{4})\d+$/);
  if (!m?.[1]) return null;
  return `https://${m[1]}.api.green-api.com`;
}

function normalizeGroupChatId(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const embedded = t.match(/(\d{8,}@g\.us)\b/i);
  if (embedded?.[1]) return embedded[1];
  if (t.endsWith("@g.us")) return t;
  const digits = t.replace(/\D/g, "");
  if (digits.length >= 10) return `${digits}@g.us`;
  return null;
}

function buildWhatsAppMessage(table: string, record: Record<string, unknown>): BuiltWa | null {
  const base = siteBase();
  const id = String(record.id ?? "").trim() || null;

  if (table === "publications") {
    const content = String(record.text ?? "").trim() || "(sans contenu)";
    const title = truncate(content, 100);
    const link = `${base}/member/mur`;
    return {
      contentType: "publication",
      contentId: id,
      contentTitle: title,
      message: `📢 Nouvelle publication\n${title}\n${link}`,
    };
  }

  if (table === "evenements") {
    const title = String(record.titre ?? "Événement").trim();
    const slug = String(record.public_slug ?? "").trim();
    const link = slug ? `${base}/event/${slug}` : `${base}/events`;
    return {
      contentType: "event",
      contentId: id,
      contentTitle: title,
      message: `📅 Nouvel événement\n${truncate(title, 120)}\n${link}`,
    };
  }

  if (table === "blogs") {
    const title = String(record.title ?? "Article").trim();
    const slug = String(record.slug ?? "").trim();
    const link = slug ? `${base}/blog/${slug}` : `${base}/blogs`;
    return {
      contentType: "blog",
      contentId: id,
      contentTitle: title,
      message: `📝 Nouvel article\n${truncate(title, 120)}\n${link}`,
    };
  }

  if (table === "lp_opportunities") {
    const title = String(record.title ?? "Opportunité").trim();
    const slug = String(record.public_slug ?? "").trim();
    const link = slug ? `${base}/opportunite/${slug}` : `${base}/opportunites`;
    return {
      contentType: "opportunity",
      contentId: id,
      contentTitle: title,
      message: `💼 Nouvelle opportunité\n${truncate(title, 120)}\n${link}`,
    };
  }

  return null;
}

async function loadGreenConfig(admin: SupabaseClient): Promise<
  { ok: true; config: GreenConfig } | { ok: false; error: string }
> {
  const { data, error } = await admin
    .from("green_api_messaging_config")
    .select("instance_id, api_token, api_url, group_name, group_chat_id")
    .eq("id", "default")
    .maybeSingle();

  if (error) throw error;
  if (!data) return { ok: false, error: "Configuration Green API introuvable." };

  const instanceId = String(data.instance_id ?? "").trim();
  const apiToken = String(data.api_token ?? "").trim();
  if (!instanceId || !apiToken) {
    return { ok: false, error: "Green API non configuré (Instance ID / Token)." };
  }

  return {
    ok: true,
    config: {
      instance_id: instanceId,
      api_token: apiToken,
      api_url: normalizeApiUrl(String(data.api_url ?? "")),
      group_name: String(data.group_name ?? "").trim(),
      group_chat_id: String(data.group_chat_id ?? "").trim(),
    },
  };
}

async function greenSend(
  config: GreenConfig,
  chatId: string,
  message: string,
): Promise<{ ok: boolean; status: number; idMessage: string | null; error: string | null; apiUrlUsed: string }> {
  const suggested = deriveApiUrlFromInstanceId(config.instance_id);
  const urlsToTry = [config.api_url];
  if (suggested && suggested !== config.api_url) urlsToTry.push(suggested);

  let lastStatus = 0;
  let lastText = "";
  let lastApiUrl = config.api_url;

  for (const apiUrl of urlsToTry) {
    lastApiUrl = apiUrl;
    const url =
      `${apiUrl}/waInstance${config.instance_id}/sendMessage/${config.api_token}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GREEN_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message }),
        signal: controller.signal,
      });
      const text = await res.text();
      lastStatus = res.status;
      lastText = text;

      if (res.status >= 200 && res.status < 300) {
        let idMessage: string | null = null;
        try {
          const parsed = text ? JSON.parse(text) : null;
          if (parsed && typeof parsed === "object") {
            idMessage = String((parsed as { idMessage?: string }).idMessage ?? "") || null;
          }
        } catch {
          /* ignore */
        }
        return { ok: true, status: res.status, idMessage, error: null, apiUrlUsed: apiUrl };
      }

      // Retry next host only on 403
      if (res.status !== 403) break;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        ok: false,
        status: 0,
        idMessage: null,
        error: msg,
        apiUrlUsed: apiUrl,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    ok: false,
    status: lastStatus,
    idMessage: null,
    error: `Green API ${lastStatus}: ${lastText.slice(0, 300)}`,
    apiUrlUsed: lastApiUrl,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const rawBody: unknown = await req.json().catch(() => undefined);

    const webhookSecret = optionalEnv("WEBHOOK_SECRET");
    if (webhookSecret) {
      const h = req.headers.get("x-webhook-secret");
      if (h !== webhookSecret) {
        return json({ error: "Unauthorized" }, 401);
      }
    }

    const payload = rawBody as WebhookPayload;
    if (!payload || typeof payload !== "object") {
      return json({ error: "Invalid JSON body" }, 400);
    }

    if (payload.type === "DELETE" || !payload.record) {
      return json({ ok: true, skipped: "delete or empty record" });
    }

    const allowed = ["publications", "evenements", "blogs", "lp_opportunities"];
    if (!allowed.includes(payload.table)) {
      return json({ ok: true, skipped: "unsupported table" });
    }

    if (!shouldNotifyPublish(payload)) {
      return json({ ok: true, skipped: "not a publish transition" });
    }

    const built = buildWhatsAppMessage(payload.table, payload.record);
    if (!built) {
      return json({ ok: true, skipped: "unhandled content" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    if (!supabaseUrl || !serviceKey) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const cfg = await loadGreenConfig(supabase);
    if (!cfg.ok) {
      return json({ ok: true, skipped: true, reason: cfg.error });
    }

    const chatId = normalizeGroupChatId(cfg.config.group_chat_id);
    if (!chatId) {
      return json({
        ok: true,
        skipped: true,
        reason: "group_chat_id manquant dans la configuration Green API",
      });
    }

    const send = await greenSend(cfg.config, chatId, built.message);

    if (send.ok && send.apiUrlUsed !== cfg.config.api_url) {
      await supabase
        .from("green_api_messaging_config")
        .update({ api_url: send.apiUrlUsed })
        .eq("id", "default");
    }

    await supabase.from("green_api_message_sends").insert({
      source: "notification",
      content_type: built.contentType,
      content_id: built.contentId,
      content_title: built.contentTitle,
      group_name: cfg.config.group_name,
      group_chat_id: chatId,
      message_text: built.message,
      status: send.ok ? "sent" : "failed",
      green_message_id: send.idMessage,
      error_message: send.error,
    });

    return json({
      ok: send.ok,
      mode: "notification",
      content_type: built.contentType,
      content_id: built.contentId,
      chatId,
      idMessage: send.idMessage,
      error: send.error ?? undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("notify-green-api-published:", msg);
    return json({ ok: false, error: msg }, 500);
  }
});
