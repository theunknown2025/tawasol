import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

async function invokeOpenwa<T extends Record<string, unknown>>(
  body: Record<string, unknown>,
): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke("openwa-messaging", { body });
  if (error) {
    let detail = error.message ?? "Erreur lors de l’appel OpenWA.";
    if (error instanceof FunctionsHttpError) {
      try {
        const ctx = await error.context.json();
        if (typeof ctx === "object" && ctx !== null) {
          const err = (ctx as { error?: string }).error;
          detail = err ?? JSON.stringify(ctx);
        } else {
          detail = String(ctx);
        }
      } catch {
        /* ignore */
      }
    }
    return { data: null, error: detail };
  }
  return { data: (data ?? null) as T | null, error: null };
}

export async function testOpenwaConnection() {
  return invokeOpenwa<{
    ok?: boolean;
    message?: string;
    error?: string;
    group?: { group_jid?: string | null };
  }>({ action: "test" });
}

export async function sendOpenwaText(text: string) {
  return invokeOpenwa<{
    ok?: boolean;
    error?: string;
    chatId?: string;
  }>({ action: "send", text });
}
