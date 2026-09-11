/**
 * OpenWA messaging for super admin.
 * Actions (JSON body):
 *   { action: "test" }
 *   { action: "send", text: "..." }
 *
 * Secrets: OPENWA_BASE_URL, OPENWA_API_KEY, OPENWA_SESSION_ID
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

function extractInviteCode(linkOrCode: string): string | null {
  const t = linkOrCode.trim();
  if (!t) return null;
  const m = t.match(/chat\.whatsapp\.com\/(?:invite\/)?([A-Za-z0-9_-]+)/i);
  if (m?.[1]) return m[1];
  if (/^[A-Za-z0-9_-]{8,}$/.test(t)) return t;
  return null;
}

function normalizeGroupJid(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (t.endsWith("@g.us")) return t;
  const digits = t.replace(/\D/g, "");
  if (digits.length >= 10) return `${digits}@g.us`;
  return null;
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

type OpenWaEnv = { baseUrl: string; apiKey: string; sessionId: string };

function readOpenWaEnv(): { ok: true; env: OpenWaEnv } | { ok: false; error: string } {
  const baseUrl = optionalEnv("OPENWA_BASE_URL");
  const apiKey = optionalEnv("OPENWA_API_KEY");
  const sessionId = optionalEnv("OPENWA_SESSION_ID");
  if (!baseUrl) return { ok: false, error: "OPENWA_BASE_URL manquant dans les secrets Edge Function." };
  if (!apiKey) return { ok: false, error: "OPENWA_API_KEY manquant dans les secrets Edge Function." };
  if (!sessionId) return { ok: false, error: "OPENWA_SESSION_ID manquant dans les secrets Edge Function." };
  return { ok: true, env: { baseUrl: baseUrl.replace(/\/$/, ""), apiKey, sessionId } };
}

async function openwaFetch(
  env: OpenWaEnv,
  path: string,
  init?: RequestInit,
): Promise<{ status: number; text: string; json: unknown }> {
  const url = `${env.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init?.headers);
  headers.set("X-API-Key", env.apiKey);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, text, json: parsed };
}

function pickGroupId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const row = payload as Record<string, unknown>;
  for (const key of ["id", "groupId", "gid", "chatId", "jid"]) {
    const v = row[key];
    if (typeof v === "string" && v.trim()) {
      return normalizeGroupJid(v) ?? v.trim();
    }
  }
  if (row.group && typeof row.group === "object") {
    return pickGroupId(row.group);
  }
  return null;
}

async function resolveGroupJid(
  env: OpenWaEnv,
  inviteLink: string,
  existingJid: string,
): Promise<{ jid: string | null; steps: Record<string, unknown> }> {
  const steps: Record<string, unknown> = {};
  const existing = normalizeGroupJid(existingJid);
  if (existing) {
    steps.existing_jid = existing;
    return { jid: existing, steps };
  }

  const inviteCode = extractInviteCode(inviteLink);
  steps.invite_code = inviteCode;

  if (!inviteCode) {
    return { jid: null, steps };
  }

  const joinInfo = await openwaFetch(
    env,
    `/api/sessions/${encodeURIComponent(env.sessionId)}/groups/join-info?inviteCode=${encodeURIComponent(inviteCode)}`,
    { method: "GET" },
  );
  steps.join_info = { status: joinInfo.status, body: joinInfo.json };
  const fromInfo = pickGroupId(joinInfo.json);
  if (fromInfo) return { jid: fromInfo, steps };

  const join = await openwaFetch(
    env,
    `/api/sessions/${encodeURIComponent(env.sessionId)}/groups/join`,
    {
      method: "POST",
      body: JSON.stringify({ inviteCode }),
    },
  );
  steps.join = { status: join.status, body: join.json };
  const fromJoin = pickGroupId(join.json);
  if (fromJoin) return { jid: fromJoin, steps };

  const list = await openwaFetch(
    env,
    `/api/sessions/${encodeURIComponent(env.sessionId)}/groups?limit=200&offset=0`,
    { method: "GET" },
  );
  steps.list_groups = { status: list.status };
  if (Array.isArray(list.json) && list.json.length === 1) {
    const only = pickGroupId(list.json[0]);
    if (only) return { jid: only, steps: { ...steps, list_picked: only } };
  }

  return { jid: null, steps };
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
    };
    const action = body.action ?? "test";

    const envGate = readOpenWaEnv();
    if (!envGate.ok) return json({ ok: false, error: envGate.error }, 500);
    const env = envGate.env;

    const { data: config, error: cfgErr } = await gate.admin
      .from("openwa_messaging_config")
      .select("*")
      .eq("id", "default")
      .maybeSingle();
    if (cfgErr) throw cfgErr;

    const inviteLink = String(config?.group_invite_link ?? "").trim();
    const storedJid = String(config?.group_jid ?? "").trim();

    if (action === "test") {
      const health = await openwaFetch(env, "/api/health", { method: "GET" });
      const session = await openwaFetch(
        env,
        `/api/sessions/${encodeURIComponent(env.sessionId)}`,
        { method: "GET" },
      );

      const resolved = await resolveGroupJid(env, inviteLink, storedJid);
      if (resolved.jid && resolved.jid !== storedJid) {
        await gate.admin
          .from("openwa_messaging_config")
          .update({ group_jid: resolved.jid, updated_by: gate.userId })
          .eq("id", "default");
      }

      const sessionOk = session.status >= 200 && session.status < 300;
      const healthOk = health.status >= 200 && health.status < 300;

      return json({
        ok: healthOk && sessionOk,
        mode: "test",
        openwa: {
          base_url: env.baseUrl,
          session_id: env.sessionId,
          health: { status: health.status, body: health.json },
          session: { status: session.status, body: session.json },
        },
        group: {
          invite_link: inviteLink || null,
          group_jid: resolved.jid,
          resolve_steps: resolved.steps,
        },
        message: healthOk && sessionOk
          ? resolved.jid
            ? "Connexion OpenWA OK — groupe résolu."
            : "Connexion OpenWA OK — renseignez le lien du groupe (ou le JID) pour envoyer."
          : "Échec de connexion OpenWA — vérifiez BASE_URL, API_KEY et SESSION_ID.",
      });
    }

    if (action === "send") {
      const text = String(body.text ?? "").trim();
      if (!text) {
        return json({ ok: false, error: "Le message texte est requis." }, 400);
      }

      const resolved = await resolveGroupJid(env, inviteLink, storedJid);
      if (!resolved.jid) {
        return json({
          ok: false,
          error:
            "Impossible de résoudre le JID du groupe. Enregistrez le lien d’invitation dans l’onglet Configuration, puis testez la connexion.",
          resolve_steps: resolved.steps,
        }, 400);
      }

      if (resolved.jid !== storedJid) {
        await gate.admin
          .from("openwa_messaging_config")
          .update({ group_jid: resolved.jid, updated_by: gate.userId })
          .eq("id", "default");
      }

      const send = await openwaFetch(
        env,
        `/api/sessions/${encodeURIComponent(env.sessionId)}/messages/send-text`,
        {
          method: "POST",
          body: JSON.stringify({ chatId: resolved.jid, text }),
        },
      );

      const ok = send.status >= 200 && send.status < 300;
      return json({
        ok,
        mode: "send",
        chatId: resolved.jid,
        status: send.status,
        body: send.json,
        error: ok ? undefined : `OpenWA ${send.status}: ${send.text.slice(0, 400)}`,
      }, ok ? 200 : 200);
    }

    return json({ ok: false, error: `Action inconnue: ${action}` }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ ok: false, error: msg }, 500);
  }
});
