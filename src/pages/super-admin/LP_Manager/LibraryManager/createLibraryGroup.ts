import { supabase } from "@/lib/supabase";
import type { LibraryGroup, LibraryGroupInsert } from "./types";

export async function createLibraryGroup(payload: LibraryGroupInsert): Promise<LibraryGroup> {
  const name = payload.name.trim();
  if (!name) {
    throw new Error("Le nom du groupe est obligatoire");
  }

  const sort_order =
    typeof payload.sort_order === "number"
      ? payload.sort_order
      : await nextSortOrder();

  const { data, error } = await supabase
    .from("lp_library_groups")
    .insert({ name, sort_order })
    .select("*")
    .single();

  if (error) throw error;
  return data as LibraryGroup;
}

async function nextSortOrder(): Promise<number> {
  const { data, error } = await supabase
    .from("lp_library_groups")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data?.sort_order ?? -1) + 1;
}
