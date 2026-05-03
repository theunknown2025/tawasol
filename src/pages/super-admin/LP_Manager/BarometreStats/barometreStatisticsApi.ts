import { supabase } from "@/lib/supabase";
import type { BarometreBreakdownType, ParsedBarometreRow } from "./barometreExcelParser";

export type BarometreStatisticsRow = {
  id: string;
  year: number;
  breakdown_type: BarometreBreakdownType;
  category_label: string;
  cooperatives: number;
  adherents: number;
  row_order: number;
  created_at: string;
};

export async function fetchBarometreStatisticsYears(): Promise<number[]> {
  const { data, error } = await supabase.from("barometre_statistics_rows").select("year");
  if (error) throw new Error(error.message);
  const years = [...new Set((data ?? []).map((r) => r.year))].sort((a, b) => b - a);
  return years;
}

export async function fetchBarometreStatisticsForYear(
  year: number,
  breakdownType: BarometreBreakdownType,
): Promise<BarometreStatisticsRow[]> {
  const { data, error } = await supabase
    .from("barometre_statistics_rows")
    .select("*")
    .eq("year", year)
    .eq("breakdown_type", breakdownType)
    .order("row_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as BarometreStatisticsRow[];
}

export async function replaceBarometreStatisticsYear(
  year: number,
  regions: ParsedBarometreRow[],
  sectors: ParsedBarometreRow[],
): Promise<void> {
  const { error: delErr } = await supabase.from("barometre_statistics_rows").delete().eq("year", year);
  if (delErr) throw new Error(delErr.message);

  const rows = [
    ...regions.map((r, i) => ({
      year,
      breakdown_type: "region" as const,
      category_label: r.categoryLabel,
      cooperatives: r.cooperatives,
      adherents: r.adherents,
      row_order: i,
    })),
    ...sectors.map((r, i) => ({
      year,
      breakdown_type: "sector" as const,
      category_label: r.categoryLabel,
      cooperatives: r.cooperatives,
      adherents: r.adherents,
      row_order: i,
    })),
  ];

  if (rows.length === 0) return;

  const { error: insErr } = await supabase.from("barometre_statistics_rows").insert(rows);
  if (insErr) throw new Error(insErr.message);
}
