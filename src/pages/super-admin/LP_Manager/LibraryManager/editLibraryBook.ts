import { supabase } from "@/lib/supabase";
import type { LibraryBook, LibraryBookInsert } from "./types";

export type EditLibraryBookPayload = LibraryBookInsert & { id: string };

export async function editLibraryBook(payload: EditLibraryBookPayload): Promise<LibraryBook> {
  const { id, ...fields } = payload;
  const { data, error } = await supabase
    .from("lp_library_books")
    .update({
      cover_url: fields.cover_url,
      pdf_url: fields.pdf_url,
      title: fields.title,
      author: fields.author,
      description: fields.description,
      keywords: fields.keywords,
      is_published: fields.is_published,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as LibraryBook;
}
