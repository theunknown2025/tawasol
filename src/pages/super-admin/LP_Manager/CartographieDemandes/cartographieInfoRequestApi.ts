import { FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  isCartographieInfoFieldKey,
  normalizeStringList,
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
  filter_activities: unknown;
  filter_provinces: unknown;
  filter_communes: unknown;
  usage_description: string;
  admin_comment: string | null;
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
    filterActivities: normalizeStringList(row.filter_activities),
    filterProvinces: normalizeStringList(row.filter_provinces),
    filterCommunes: normalizeStringList(row.filter_communes),
    usageDescription: row.usage_description ?? "",
    adminComment: row.admin_comment?.trim() ? row.admin_comment.trim() : null,
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
  filterActivities: string[];
  filterProvinces: string[];
  filterCommunes: string[];
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
  const filterActivities = normalizeStringList(input.filterActivities);
  const filterProvinces = normalizeStringList(input.filterProvinces);
  const filterCommunes = normalizeStringList(input.filterCommunes);

  if (!fullName || !phone || !email || !usageDescription || requestedFields.length === 0) {
    throw new Error("Veuillez remplir tous les champs obligatoires et sélectionner au moins un élément.");
  }

  if (
    filterActivities.length === 0 &&
    filterProvinces.length === 0 &&
    filterCommunes.length === 0
  ) {
    throw new Error(
      "Veuillez sélectionner au moins un filtre (activité, province ou commune).",
    );
  }

  const { error } = await supabase.from("cartographie_info_requests").insert({
    full_name: fullName,
    phone,
    email,
    fonction,
    etablissement,
    requested_fields: requestedFields,
    filter_activities: filterActivities,
    filter_provinces: filterProvinces,
    filter_communes: filterCommunes,
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

export type ApproveCartographieInfoRequestInput = {
  requestId: string;
  requestedFields: CartographieInfoFieldKey[];
  filterActivities: string[];
  filterProvinces: string[];
  filterCommunes: string[];
  adminComment: string;
};

export type ApproveCartographieInfoRequestResult = {
  ok: boolean;
  message?: string;
  error?: string;
};

/** Approuve la demande et envoie l'e-mail Excel via Edge Function. */
export async function approveCartographieInfoRequest(
  input: ApproveCartographieInfoRequestInput,
): Promise<ApproveCartographieInfoRequestResult> {
  const requestedFields = input.requestedFields.filter(isCartographieInfoFieldKey);
  if (requestedFields.length === 0) {
    return { ok: false, error: "Sélectionnez au moins un élément d'information." };
  }

  try {
    const { data, error } = await supabase.functions.invoke("approve-cartographie-info-request", {
      body: {
        request_id: input.requestId,
        requested_fields: requestedFields,
        filter_activities: normalizeStringList(input.filterActivities),
        filter_provinces: normalizeStringList(input.filterProvinces),
        filter_communes: normalizeStringList(input.filterCommunes),
        admin_comment: input.adminComment.trim(),
      },
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
