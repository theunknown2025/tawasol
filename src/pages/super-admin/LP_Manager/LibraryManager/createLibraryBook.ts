import { supabase } from "@/lib/supabase";
import type { LibraryBook, LibraryBookInsert } from "./types";

export async function createLibraryBook(payload: LibraryBookInsert): Promise<LibraryBook> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("lp_library_books")
    .insert({
      cover_url: payload.cover_url,
      pdf_url: payload.pdf_url,
      title: payload.title,
      author: payload.author,
      description: payload.description,
      keywords: payload.keywords,
      is_published: payload.is_published,
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as LibraryBook;
}
