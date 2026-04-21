import { supabase } from "@/lib/supabase";
import type { LibraryBook } from "./types";

export async function fetchLibraryBooks(): Promise<LibraryBook[]> {
  const { data, error } = await supabase
    .from("lp_library_books")
    .select("*")
    .order("title", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LibraryBook[];
}
