import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type WahaGroupFromServer = {
  id: string;
  name?: string;
  subject?: string;
};

export type WahaTestResult = {
  ok?: boolean;
  error?: string;
  mode?: string;
  sent?: number;
  results?: { chatId: string; ok: boolean; detail?: string }[];
};

export type WahaListGroupsResult = {
  ok?: boolean;
  error?: string;
  mode?: string;
  groups?: WahaGroupFromServer[];
};

async function parseFunctionsError(error: FunctionsHttpError): Promise<string> {
  let detail = error.message ?? "Erreur Edge Function";
  try {
    const ctx = await error.context.json();
    detail = typeof ctx === "object" ? JSON.stringify(ctx) : String(ctx);
  } catch {
    /* ignore */
  }
  return detail;
}

export async function invokeNotifyEdge<T>(body: Record<string, unknown>): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke("notify-brevo-published", { body });
  if (error) {
    const detail =
      error instanceof FunctionsHttpError ? await parseFunctionsError(error) : (error.message ?? "Erreur Edge Function");
    return { data: null, error: detail };
  }
  return { data: (data ?? null) as T, error: null };
}

export async function testWahaConnection(): Promise<{ data: WahaTestResult | null; error: string | null }> {
  return invokeNotifyEdge<WahaTestResult>({ test_waha: true });
}

export async function listWahaGroupsFromServer(): Promise<{ data: WahaListGroupsResult | null; error: string | null }> {
  return invokeNotifyEdge<WahaListGroupsResult>({ list_waha_groups: true });
}
