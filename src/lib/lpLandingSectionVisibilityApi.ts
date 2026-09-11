import { supabase } from "./supabase";
import {
  createDefaultSectionVisibility,
  mergeSectionVisibilityPayload,
  type LandingSectionVisibilityMap,
} from "./lpLandingSectionVisibility";

const SINGLETON_ID = "default" as const;

export async function fetchLpLandingSectionVisibility(): Promise<LandingSectionVisibilityMap | null> {
  const { data, error } = await supabase
    .from("lp_landing_section_visibility")
    .select("payload")
    .eq("id", SINGLETON_ID)
    .maybeSingle();
  if (error) throw error;
  if (!data?.payload) return null;
  return mergeSectionVisibilityPayload(data.payload);
}

export async function upsertLpLandingSectionVisibility(
  payload: LandingSectionVisibilityMap,
): Promise<LandingSectionVisibilityMap> {
  const normalized = mergeSectionVisibilityPayload(payload);

  const { data, error } = await supabase.rpc("upsert_lp_landing_section_visibility", {
    p_payload: normalized,
  });

  if (error) {
    // Fallback for environments where the RPC is not yet deployed.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: row, error: upsertError } = await supabase
      .from("lp_landing_section_visibility")
      .upsert(
        {
          id: SINGLETON_ID,
          payload: normalized,
          updated_by: user?.id ?? null,
        },
        { onConflict: "id" },
      )
      .select("payload")
      .maybeSingle();

    if (upsertError) throw upsertError;
    if (!row?.payload) {
      throw new Error(
        "Écriture de la visibilité refusée. Vérifiez que vous êtes connecté en super_admin.",
      );
    }
    return mergeSectionVisibilityPayload(row.payload);
  }

  if (data == null) {
    throw new Error(
      "Écriture de la visibilité refusée. Vérifiez que vous êtes connecté en super_admin.",
    );
  }

  return mergeSectionVisibilityPayload(data);
}

export async function fetchLpLandingSectionVisibilityResolved(): Promise<LandingSectionVisibilityMap> {
  try {
    const row = await fetchLpLandingSectionVisibility();
    return row ?? createDefaultSectionVisibility();
  } catch {
    return createDefaultSectionVisibility();
  }
}
