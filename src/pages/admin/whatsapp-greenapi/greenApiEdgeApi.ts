import { FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type GreenApiInvokeResult<T extends Record<string, unknown>> = {
  data: T | null;
  error: string | null;
};

async function readErrorPayload(error: unknown): Promise<Record<string, unknown> | null> {
  const ctx =
    error instanceof FunctionsHttpError || error instanceof FunctionsRelayError
      ? error.context
      : null;
  if (!ctx || typeof ctx.json !== "function") return null;
  try {
    const parsed = await ctx.json();
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
  } catch {
    try {
      const text = await ctx.text();
      if (text) return { error: text, message: text };
    } catch {
      /* ignore */
    }
  }
  return null;
}

async function invokeGreenApi<T extends Record<string, unknown>>(
  body: Record<string, unknown>,
): Promise<GreenApiInvokeResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke("green-api-messaging", {
      body,
      timeout: 25_000,
    });

    if (error) {
      const payload = await readErrorPayload(error);
      const detail =
        (typeof payload?.error === "string" && payload.error) ||
        (typeof payload?.message === "string" && payload.message) ||
        error.message ||
        "Erreur lors de l’appel Green API.";

      return {
        data: (payload as T) ?? ({ ok: false, error: detail, message: detail } as unknown as T),
        error: detail,
      };
    }

    if (data == null) {
      return {
        data: { ok: false, error: "Réponse vide de l’Edge Function.", message: "Réponse vide de l’Edge Function." } as unknown as T,
        error: "Réponse vide de l’Edge Function.",
      };
    }

    return { data: data as T, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      data: { ok: false, error: msg, message: msg } as unknown as T,
      error: msg,
    };
  }
}

export type GreenApiTestPayload = {
  ok?: boolean;
  message?: string;
  error?: string;
  mode?: string;
  green_api?: Record<string, unknown>;
  group?: { group_chat_id?: string | null; group_name?: string | null };
};

export async function testGreenApiConnection(overrides?: {
  instance_id?: string;
  api_token?: string;
  api_url?: string;
  group_name?: string;
  group_chat_id?: string;
}) {
  return invokeGreenApi<GreenApiTestPayload>({ action: "test", ...overrides });
}

export async function sendGreenApiText(text: string) {
  return invokeGreenApi<{
    ok?: boolean;
    error?: string;
    message?: string;
    chatId?: string;
    idMessage?: string | null;
  }>({ action: "send", text });
}
