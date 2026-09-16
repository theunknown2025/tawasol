import { supabase } from "./supabase";

const recentClickAt = new Map<string, number>();
const CLICK_DEBOUNCE_MS = 2500;

export async function incrementBilanDocumentClicks(documentId: string): Promise<void> {
  const id = documentId.trim();
  if (!id) return;

  const now = Date.now();
  const last = recentClickAt.get(id) ?? 0;
  if (now - last < CLICK_DEBOUNCE_MS) return;
  recentClickAt.set(id, now);

  const { error } = await supabase.rpc("increment_lp_bilan_document_clicks", {
    p_document_id: id,
  });
  if (error) {
    recentClickAt.delete(id);
    console.warn("incrementBilanDocumentClicks:", error.message);
  }
}

export async function incrementBilanDocumentDownloads(documentId: string): Promise<void> {
  const id = documentId.trim();
  if (!id) return;
  const { error } = await supabase.rpc("increment_lp_bilan_document_downloads", {
    p_document_id: id,
  });
  if (error) console.warn("incrementBilanDocumentDownloads:", error.message);
}
