import { supabase } from "@/lib/supabase";

export async function deleteBilanDocument(id: string): Promise<void> {
  const { error } = await supabase.from("lp_bilan_documents").delete().eq("id", id);
  if (error) throw error;
}
