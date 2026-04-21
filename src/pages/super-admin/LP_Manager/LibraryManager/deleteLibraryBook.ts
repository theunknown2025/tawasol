import { supabase } from "@/lib/supabase";

export async function deleteLibraryBook(id: string): Promise<void> {
  const { error } = await supabase.from("lp_library_books").delete().eq("id", id);
  if (error) throw error;
}
