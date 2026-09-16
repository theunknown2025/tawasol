import { supabase } from "@/lib/supabase";
import type { BilanDocument, BilanDocumentInsert } from "./types";

export async function editBilanDocument(
  payload: BilanDocumentInsert & { id: string },
): Promise<BilanDocument> {
  const { data, error } = await supabase
    .from("lp_bilan_documents")
    .update({
      year: payload.year,
      title: payload.title,
      description: payload.description,
      pdf_url: payload.pdf_url,
      is_published: payload.is_published,
    })
    .eq("id", payload.id)
    .select("*")
    .single();

  if (error) throw error;
  return data as BilanDocument;
}
