import { supabase } from "@/lib/supabase";
import type { LibraryGroup } from "./types";

export async function fetchLibraryGroups(): Promise<LibraryGroup[]> {
  const { data, error } = await supabase
    .from("lp_library_groups")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LibraryGroup[];
}
