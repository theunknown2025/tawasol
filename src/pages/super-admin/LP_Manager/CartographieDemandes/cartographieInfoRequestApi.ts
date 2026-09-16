import { FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  isCartographieInfoFieldKey,
  type CartographieInfoFieldKey,
  type CartographieInfoRequest,
  type CartographieInfoRequestStatus,
} from "./cartographieInfoRequestTypes";

type DbRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  fonction: string;
  etablissement: string;
  requested_fields: unknown;
  usage_description: string;
  status: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  email_sent_at: string | null;
  email_error: string | null;
  created_at: string;
  updated_at: string;
};

function parseRequestedFields(raw: unknown): CartographieInfoFieldKey[] {
  if (!Array.isArray(raw)) return [];
  const out: CartographieInfoFieldKey[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    if (!isCartographieInfoFieldKey(item)) continue;
    if (!out.includes(item)) out.push(item);
  }
  return out;
}

function parseStatus(raw: string): CartographieInfoRequestStatus {
  if (raw === "approved" || raw === "rejected" || raw === "pending") return raw;
  return "pending";
}

function mapRow(row: DbRow): CartographieInfoRequest {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    fonction: row.fonction ?? "",
    etablissement: row.etablissement ?? "",
    requestedFields: parseRequestedFields(row.requested_fields),
    usageDescription: row.usage_description ?? "",
    status: parseStatus(row.status),
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    emailSentAt: row.email_sent_at,
    emailError: row.email_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type SubmitCartographieInfoRequestInput = {
  fullName: string;
  phone: string;
  email: string;
  fonction: string;
  etablissement: string;
  requestedFields: CartographieInfoFieldKey[];
  usageDescription: string;
};

export async function submitCartographieInfoRequest(
  input: SubmitCartographieInfoRequestInput,
): Promise<void> {
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  const email = input.email.trim();
  const fonction = input.fonction.trim();
  const etablissement = input.etablissement.trim();
  const usageDescription = input.usageDescription.trim();
  const requestedFields = input.requestedFields.filter(isCartographieInfoFieldKey);

  if (!fullName || !phone || !email || !usageDescription || requestedFields.length === 0) {
    throw new Error("Veuillez remplir tous les champs obligatoires et sélectionner au moins un élément.");
  }

  const { error } = await supabase.from("cartographie_info_requests").insert({
    full_name: fullName,
    phone,
    email,
    fonction,
    etablissement,
    requested_fields: requestedFields,
    usage_description: usageDescription,
    status: "pending",
  });

  if (error) throw new Error(error.message);
}

export async function fetchCartographieInfoRequests(): Promise<CartographieInfoRequest[]> {
  const { data, error } = await supabase
    .from("cartographie_info_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as DbRow[]).map(mapRow);
}

export async function rejectCartographieInfoRequest(id: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("cartographie_info_requests")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id ?? null,
      email_error: null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

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

export type ApproveCartographieInfoRequestResult = {
  ok: boolean;
  message?: string;
  error?: string;
};

/** Approuve la demande et envoie l'e-mail Excel via Edge Function. */
export async function approveCartographieInfoRequest(
  id: string,
): Promise<ApproveCartographieInfoRequestResult> {
  try {
    const { data, error } = await supabase.functions.invoke("approve-cartographie-info-request", {
      body: { request_id: id },
      timeout: 60_000,
    });

    if (error) {
      const payload = await readErrorPayload(error);
      const detail =
        (typeof payload?.error === "string" && payload.error) ||
        (typeof payload?.message === "string" && payload.message) ||
        error.message ||
        "Erreur lors de l'approbation.";
      return { ok: false, error: detail, message: detail };
    }

    const result = (data ?? {}) as ApproveCartographieInfoRequestResult;
    if (result.ok === false) {
      return {
        ok: false,
        error: result.error ?? result.message ?? "Échec de l'approbation.",
        message: result.message ?? result.error,
      };
    }
    return { ok: true, message: result.message ?? "Demande approuvée et e-mail envoyé." };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg, message: msg };
  }
}
