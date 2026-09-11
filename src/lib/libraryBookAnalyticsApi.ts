import { supabase } from "./supabase";

/** Avoid double-count from React StrictMode remount or card click + page view in the same navigation. */
const recentClickAt = new Map<string, number>();
const CLICK_DEBOUNCE_MS = 2500;

/**
 * Incrémente les clics (ouverture / lecture d’une ressource publiée).
 * Côté DB : `click_count = click_count + 1` (atomique, ressource publiée uniquement).
 */
export async function incrementLibraryBookClicks(bookId: string): Promise<void> {
  const id = bookId.trim();
  if (!id) return;

  const now = Date.now();
  const last = recentClickAt.get(id) ?? 0;
  if (now - last < CLICK_DEBOUNCE_MS) return;
  recentClickAt.set(id, now);

  const { error } = await supabase.rpc("increment_lp_library_book_clicks", { p_book_id: id });
  if (error) {
    recentClickAt.delete(id);
    console.warn("incrementLibraryBookClicks:", error.message);
  }
}

/** Incrémente les téléchargements PDF (ressource publiée). */
export async function incrementLibraryBookDownloads(bookId: string): Promise<void> {
  const id = bookId.trim();
  if (!id) return;
  const { error } = await supabase.rpc("increment_lp_library_book_downloads", { p_book_id: id });
  if (error) console.warn("incrementLibraryBookDownloads:", error.message);
}
