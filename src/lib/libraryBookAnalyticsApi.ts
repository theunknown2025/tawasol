import { supabase } from "./supabase";

/** Incrémente les clics (ouverture ressource publiée) — RPC sécurisée côté Supabase. */
export async function incrementLibraryBookClicks(bookId: string): Promise<void> {
  const { error } = await supabase.rpc("increment_lp_library_book_clicks", { p_book_id: bookId });
  if (error) console.warn("incrementLibraryBookClicks:", error.message);
}

/** Incrémente les téléchargements PDF (ressource publiée). */
export async function incrementLibraryBookDownloads(bookId: string): Promise<void> {
  const { error } = await supabase.rpc("increment_lp_library_book_downloads", { p_book_id: bookId });
  if (error) console.warn("incrementLibraryBookDownloads:", error.message);
}
