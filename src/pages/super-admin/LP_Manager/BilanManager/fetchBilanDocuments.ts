import { supabase } from "@/lib/supabase";
import type { BilanDocument } from "./types";

export async function fetchBilanDocuments(): Promise<BilanDocument[]> {
  const { data, error } = await supabase
    .from("lp_bilan_documents")
    .select("*")
    .order("year", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BilanDocument[];
}
