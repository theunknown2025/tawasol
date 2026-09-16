/**
 * Green API WhatsApp messaging for super admin.
 * Actions (JSON body):
 *   { action: "test" }
 *   { action: "send", text: "..." }
 * Optional overrides on body: instance_id, api_token, api_url, group_chat_id, group_name
 *
 * Credentials + group target live in public.green_api_messaging_config.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GREEN_FETCH_TIMEOUT_MS = 15_000;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeApiUrl(raw: string): string {
  const t = raw.trim().replace(/\/$/, "");
  return t || "https://api.green-api.com";
}

/** Green API hosts are regional: instance 7107… → https://7107.api.green-api.com */
function deriveApiUrlFromInstanceId(instanceId: string): string | null {
  const id = instanceId.trim();
  const m = id.match(/^(\d{4})\d+$/);
  if (!m?.[1]) return null;
  return `https://${m[1]}.api.green-api.com`;
}

function apiUrlHost(apiUrl: string): string | null {
  try {
    return new URL(normalizeApiUrl(apiUrl)).host.toLowerCase();
  } catch {
    return null;
  }
}

/** Accepts pure chatId or dirty values like "My Group - 120363…@g.us". */
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

type GreenConfig = {
  instance_id: string;
  api_token: string;
  api_url: string;
  group_name: string;
  group_chat_id: string;
};

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

async function loadConfig(
  admin: ReturnType<typeof createClient>,
  overrides?: Partial<GreenConfig>,
): Promise<{ ok: true; config: GreenConfig } | { ok: false; error: string }> {
  const { data, error } = await admin
    .from("green_api_messaging_config")
    .select("instance_id, api_token, api_url, group_name, group_chat_id")
    .eq("id", "default")
    .maybeSingle();

  if (error) throw error;
  if (!data && !overrides?.instance_id?.trim()) {
    return { ok: false, error: "Configuration Green API introuvable." };
  }

  const pick = (override: string | undefined, fallback: unknown) => {
    const o = override?.trim();
    if (o) return o;
    return String(fallback ?? "").trim();
  };

  const instanceId = pick(overrides?.instance_id, data?.instance_id);
  const apiToken = pick(overrides?.api_token, data?.api_token);
  if (!instanceId || !apiToken) {
    return {
      ok: false,
      error: "Renseignez Instance ID et Token dans l’onglet Configuration.",
    };
  }

  return {
    ok: true,
    config: {
      instance_id: instanceId,
      api_token: apiToken,
      api_url: normalizeApiUrl(pick(overrides?.api_url, data?.api_url)),
      group_name: pick(overrides?.group_name, data?.group_name),
      group_chat_id: pick(overrides?.group_chat_id, data?.group_chat_id),
    },
  };
}

function buildGreenUrl(config: GreenConfig, methodPath: string): string {
  const path = methodPath.replace(/^\//, "");
  // Do not encode id/token — Green API paths expect raw values (encoding can 403 on some gateways).
  return `${config.api_url}/waInstance${config.instance_id}/${path}/${config.api_token}`;
}

async function greenFetch(
  config: GreenConfig,
  methodPath: string,
  init?: RequestInit,
): Promise<{ status: number; text: string; json: unknown; url: string }> {
  const url = buildGreenUrl(config, methodPath);
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GREEN_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
    });
    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }
    return { status: res.status, text, json: parsed, url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const aborted = e instanceof DOMException && e.name === "AbortError";
    throw new Error(
      aborted
        ? `Timeout Green API (${GREEN_FETCH_TIMEOUT_MS / 1000}s) — vérifiez l’API URL.`
        : `Appel Green API impossible: ${msg}`,
    );
  } finally {
    clearTimeout(timer);
  }
}

/** On nginx 403, retry once with host derived from instance id (common misconfig). */
async function greenFetchWithHostFallback(
  config: GreenConfig,
  methodPath: string,
  init?: RequestInit,
): Promise<{
  result: { status: number; text: string; json: unknown; url: string };
  configUsed: GreenConfig;
  retriedWithDerivedHost: boolean;
  suggested_api_url: string | null;
}> {
  const suggested = deriveApiUrlFromInstanceId(config.instance_id);
  const first = await greenFetch(config, methodPath, init);
  if (first.status !== 403 || !suggested) {
    return {
      result: first,
      configUsed: config,
      retriedWithDerivedHost: false,
      suggested_api_url: suggested,
    };
  }

  const currentHost = apiUrlHost(config.api_url);
  const suggestedHost = apiUrlHost(suggested);
  if (!suggestedHost || currentHost === suggestedHost) {
    return {
      result: first,
      configUsed: config,
      retriedWithDerivedHost: false,
      suggested_api_url: suggested,
    };
  }

  const retryConfig = { ...config, api_url: suggested };
  const second = await greenFetch(retryConfig, methodPath, init);
  return {
    result: second,
    configUsed: retryConfig,
    retriedWithDerivedHost: true,
    suggested_api_url: suggested,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405);
    }

    const gate = await requireSuperAdmin(req);
    if (!gate.ok) return gate.response;

    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      text?: string;
      instance_id?: string;
      api_token?: string;
      api_url?: string;
      group_name?: string;
      group_chat_id?: string;
    };
    const action = body.action ?? "test";

    const cfgGate = await loadConfig(gate.admin, {
      instance_id: body.instance_id,
      api_token: body.api_token,
      api_url: body.api_url,
      group_name: body.group_name,
      group_chat_id: body.group_chat_id,
    });
    // Always HTTP 200 for business outcomes so supabase.functions.invoke populates `data`.
    if (!cfgGate.ok) return json({ ok: false, error: cfgGate.error, message: cfgGate.error });
    const config = cfgGate.config;

    if (action === "test") {
      let fetchOutcome: Awaited<ReturnType<typeof greenFetchWithHostFallback>>;
      try {
        fetchOutcome = await greenFetchWithHostFallback(config, "getStateInstance", {
          method: "GET",
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const suggested = deriveApiUrlFromInstanceId(config.instance_id);
        return json({
          ok: false,
          mode: "test",
          error: msg,
          message: msg,
          green_api: {
            api_url: config.api_url,
            instance_id: config.instance_id,
            suggested_api_url: suggested,
          },
        });
      }

      const state = fetchOutcome.result;
      const effectiveConfig = fetchOutcome.configUsed;

      // Persist corrected host when fallback succeeds
      if (
        fetchOutcome.retriedWithDerivedHost &&
        state.status >= 200 &&
        state.status < 300 &&
        effectiveConfig.api_url !== config.api_url
      ) {
        await gate.admin
          .from("green_api_messaging_config")
          .update({ api_url: effectiveConfig.api_url, updated_by: gate.userId })
          .eq("id", "default");
      }

      const stateOk = state.status >= 200 && state.status < 300;
      const stateValue =
        state.json && typeof state.json === "object" && state.json !== null
          ? String((state.json as { stateInstance?: string }).stateInstance ?? "")
          : "";

      const authorized = stateValue.toLowerCase() === "authorized";
      const chatId = normalizeGroupChatId(effectiveConfig.group_chat_id);
      const suggested = fetchOutcome.suggested_api_url;

      let message: string;
      if (stateOk && authorized) {
        message = chatId
          ? fetchOutcome.retriedWithDerivedHost
            ? `Connexion Green API OK — API URL corrigée automatiquement en ${effectiveConfig.api_url}.`
            : "Connexion Green API OK — groupe prêt."
          : "Connexion Green API OK — renseignez l’ID du groupe (…@g.us) pour envoyer.";
      } else if (state.status === 403) {
        message = suggested
          ? `Green API 403 — l’API URL est incorrecte. Pour l’instance ${effectiveConfig.instance_id}, utilisez ${suggested} (copiez apiUrl depuis la console Green API).`
          : "Green API a refusé la requête (403). Vérifiez l’API URL exacte de la console, l’Instance ID et le Token.";
      } else if (stateOk && !authorized) {
        message = `Instance non autorisée (état: ${stateValue || "inconnu"}). Scannez le QR dans la console Green API.`;
      } else {
        message = `Échec Green API (HTTP ${state.status}). Vérifiez Instance ID, Token et API URL.`;
      }

      return json({
        ok: Boolean(stateOk && authorized),
        mode: "test",
        message,
        error: stateOk && authorized ? undefined : message,
        green_api: {
          api_url: effectiveConfig.api_url,
          api_url_requested: config.api_url,
          instance_id: effectiveConfig.instance_id,
          suggested_api_url: suggested,
          retried_with_derived_host: fetchOutcome.retriedWithDerivedHost,
          request_url_host: (() => {
            try {
              return new URL(state.url).host;
            } catch {
              return null;
            }
          })(),
          state: { status: state.status, body: state.json },
        },
        group: {
          group_name: effectiveConfig.group_name || null,
          group_chat_id: chatId,
          group_chat_id_raw: effectiveConfig.group_chat_id || null,
        },
      });
    }

    if (action === "send") {
      const text = String(body.text ?? "").trim();
      if (!text) {
        return json({ ok: false, error: "Le message texte est requis.", message: "Le message texte est requis." });
      }

      const chatId = normalizeGroupChatId(config.group_chat_id);
      if (!chatId) {
        const msg =
          "ID du groupe manquant ou invalide. Utilisez le chatId (ex. 120363…@g.us), pas seulement le nom.";
        return json({ ok: false, error: msg, message: msg });
      }

      let sendOutcome: Awaited<ReturnType<typeof greenFetchWithHostFallback>>;
      try {
        sendOutcome = await greenFetchWithHostFallback(config, "sendMessage", {
          method: "POST",
          body: JSON.stringify({ chatId, message: text }),
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await gate.admin.from("green_api_message_sends").insert({
          source: "manual",
          group_name: config.group_name,
          group_chat_id: chatId,
          message_text: text,
          status: "failed",
          error_message: msg,
          sent_by: gate.userId,
        });
        return json({ ok: false, error: msg, message: msg, chatId });
      }

      const send = sendOutcome.result;
      const effectiveConfig = sendOutcome.configUsed;

      if (
        sendOutcome.retriedWithDerivedHost &&
        send.status >= 200 &&
        send.status < 300 &&
        effectiveConfig.api_url !== config.api_url
      ) {
        await gate.admin
          .from("green_api_messaging_config")
          .update({ api_url: effectiveConfig.api_url, updated_by: gate.userId })
          .eq("id", "default");
      }

      const ok = send.status >= 200 && send.status < 300;
      const greenMessageId =
        send.json && typeof send.json === "object" && send.json !== null
          ? String((send.json as { idMessage?: string }).idMessage ?? "") || null
          : null;

      const suggested = sendOutcome.suggested_api_url;
      const errorMessage = ok
        ? null
        : send.status === 403
        ? suggested
          ? `Green API 403 — utilisez l’API URL ${suggested} (console Green API).`
          : "Green API 403 — vérifiez API URL, Instance ID et Token dans la console Green API."
        : `Green API ${send.status}: ${send.text.slice(0, 400)}`;

      await gate.admin.from("green_api_message_sends").insert({
        source: "manual",
        group_name: effectiveConfig.group_name,
        group_chat_id: chatId,
        message_text: text,
        status: ok ? "sent" : "failed",
        green_message_id: greenMessageId,
        error_message: errorMessage,
        sent_by: gate.userId,
      });

      return json({
        ok,
        mode: "send",
        chatId,
        idMessage: greenMessageId,
        status: send.status,
        body: send.json,
        message: ok ? "Message envoyé." : errorMessage ?? "Échec de l’envoi",
        error: errorMessage ?? undefined,
        green_api: {
          api_url: effectiveConfig.api_url,
          suggested_api_url: suggested,
          retried_with_derived_host: sendOutcome.retriedWithDerivedHost,
        },
      });
    }

    return json({ ok: false, error: `Action inconnue: ${action}`, message: `Action inconnue: ${action}` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ ok: false, error: msg, message: msg }, 200);
  }
});
