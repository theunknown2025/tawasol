import { supabase } from "@/lib/supabase";
import type { BilanDocument, BilanDocumentInsert } from "./types";

export async function createBilanDocument(payload: BilanDocumentInsert): Promise<BilanDocument> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("lp_bilan_documents")
    .insert({
      year: payload.year,
      title: payload.title,
      description: payload.description,
      pdf_url: payload.pdf_url,
      is_published: payload.is_published,
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as BilanDocument;
}
