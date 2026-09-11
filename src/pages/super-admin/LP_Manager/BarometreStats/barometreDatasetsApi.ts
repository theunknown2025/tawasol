import { supabase } from "@/lib/supabase";
import type {
  BarometreChartType,
  BarometreColumn,
  BarometreDataRow,
  BarometreDataset,
  BarometreDatasetInput,
} from "./barometreDatasetTypes";

function asColumns(raw: unknown): BarometreColumn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
    .map((c) => ({
      id: String(c.id ?? ""),
      label: String(c.label ?? ""),
      type: c.type === "number" ? ("number" as const) : ("text" as const),
    }))
    .filter((c) => c.id);
}

function asRows(raw: unknown): BarometreDataRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map((r) => ({
      id: String(r.id ?? ""),
      cells:
        r.cells && typeof r.cells === "object" && !Array.isArray(r.cells)
          ? (r.cells as Record<string, string | number | null>)
          : {},
      isTotal: r.isTotal === true,
    }))
    .filter((r) => r.id);
}

function asYIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x)).filter(Boolean);
}

function asChartType(raw: unknown): BarometreChartType {
  if (raw === "line" || raw === "area" || raw === "pie" || raw === "bar") return raw;
  return "bar";
}

function mapRow(row: Record<string, unknown>): BarometreDataset {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    columns: asColumns(row.columns),
    rows: asRows(row.rows),
    x_column_id: row.x_column_id == null ? null : String(row.x_column_id),
    y_column_ids: asYIds(row.y_column_ids),
    chart_type: asChartType(row.chart_type),
    is_published: row.is_published === true,
    display_order: typeof row.display_order === "number" ? row.display_order : 0,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export async function fetchAllBarometreDatasets(): Promise<BarometreDataset[]> {
  const { data, error } = await supabase
    .from("barometre_datasets")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}

export async function fetchPublishedBarometreDatasets(): Promise<BarometreDataset[]> {
  const { data, error } = await supabase
    .from("barometre_datasets")
    .select("*")
    .eq("is_published", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}

export async function fetchBarometreDataset(id: string): Promise<BarometreDataset | null> {
  const { data, error } = await supabase.from("barometre_datasets").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function createBarometreDataset(input: BarometreDatasetInput): Promise<BarometreDataset> {
  const { data, error } = await supabase
    .from("barometre_datasets")
    .insert({
      name: input.name.trim(),
      description: input.description.trim(),
      columns: input.columns,
      rows: input.rows,
      x_column_id: input.x_column_id,
      y_column_ids: input.y_column_ids,
      chart_type: input.chart_type,
      is_published: input.is_published,
      display_order: input.display_order ?? 0,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as Record<string, unknown>);
}

export async function updateBarometreDataset(
  id: string,
  input: Partial<BarometreDatasetInput>,
): Promise<BarometreDataset> {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.description !== undefined) payload.description = input.description.trim();
  if (input.columns !== undefined) payload.columns = input.columns;
  if (input.rows !== undefined) payload.rows = input.rows;
  if (input.x_column_id !== undefined) payload.x_column_id = input.x_column_id;
  if (input.y_column_ids !== undefined) payload.y_column_ids = input.y_column_ids;
  if (input.chart_type !== undefined) payload.chart_type = input.chart_type;
  if (input.is_published !== undefined) payload.is_published = input.is_published;
  if (input.display_order !== undefined) payload.display_order = input.display_order;

  const { data, error } = await supabase
    .from("barometre_datasets")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as Record<string, unknown>);
}

export async function deleteBarometreDataset(id: string): Promise<void> {
  const { error } = await supabase.from("barometre_datasets").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setBarometreDatasetPublished(id: string, is_published: boolean): Promise<void> {
  const { error } = await supabase.from("barometre_datasets").update({ is_published }).eq("id", id);
  if (error) throw new Error(error.message);
}
