import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Projet, ProjetWithPlan, ProjetPlanItem } from "@/types/projet";

export function useProjets() {
  const [projets, setProjets] = useState<ProjetWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjets = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: projetsData, error: projErr } = await supabase
      .from("projets")
      .select("*")
      .order("created_at", { ascending: false });

    if (projErr) {
      setError(projErr.message);
      setProjets([]);
      setLoading(false);
      return;
    }

    const projs = (projetsData ?? []) as Projet[];
    const { data: planData } = await supabase
      .from("projet_plan_items")
      .select("*")
      .in("projet_id", projs.map((p) => p.id))
      .order("ordre");

    const respIds = [...new Set((planData ?? []).map((r: { responsable_id?: string }) => r.responsable_id).filter(Boolean))] as string[];
    let respNames: Record<string, string> = {};
    if (respIds.length > 0) {
      const { data: perso } = await supabase.from("personnel").select("id, full_name").in("id", respIds);
      respNames = Object.fromEntries((perso ?? []).map((p: { id: string; full_name: string }) => [p.id, p.full_name]));
    }

    const itemsByProjet = (planData ?? []).reduce(
      (acc: Record<string, ProjetPlanItem[]>, row: Record<string, unknown>) => {
        const pid = row.projet_id as string;
        if (!acc[pid]) acc[pid] = [];
        const rid = row.responsable_id as string | null;
        acc[pid].push({
          id: row.id as string,
          axe: (row.axe as string) ?? "",
          tache: (row.tache as string) ?? "",
          responsable_id: rid,
          responsable_name: rid ? respNames[rid] : undefined,
          date_debut: row.date_debut as string | null,
          date_fin: row.date_fin as string | null,
          livrable: (row.livrable as string) ?? "",
          commentaire: (row.commentaire as string) ?? "",
          pmo_step_completed: Boolean(row.pmo_step_completed),
        });
        return acc;
      },
      {}
    );

    setProjets(
      projs.map((p) => ({
        ...p,
        plan_items: itemsByProjet[p.id] ?? [],
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjets();
  }, [fetchProjets]);

  const createProjet = async (
    nom: string,
    description: string | null,
    planItems: ProjetPlanItem[]
  ): Promise<{ error: string | null }> => {
    const { data: proj, error: insertProj } = await supabase
      .from("projets")
      .insert({ nom, description })
      .select("id")
      .single();

    if (insertProj || !proj) return { error: insertProj?.message ?? "Erreur création projet" };

    if (planItems.length > 0) {
      const rows = planItems.map((item, idx) => ({
        projet_id: proj.id,
        axe: item.axe,
        tache: item.tache,
        responsable_id: item.responsable_id || null,
        date_debut: item.date_debut || null,
        date_fin: item.date_fin || null,
        livrable: item.livrable,
        commentaire: item.commentaire,
        pmo_step_completed: item.pmo_step_completed ?? false,
        ordre: idx,
      }));
      const { error: planErr } = await supabase.from("projet_plan_items").insert(rows);
      if (planErr) return { error: planErr.message };
    }

    await fetchProjets();
    return { error: null };
  };

  const updateProjet = async (
    id: string,
    nom: string,
    description: string | null,
    planItems: ProjetPlanItem[]
  ): Promise<{ error: string | null }> => {
    const { error: updProj } = await supabase
      .from("projets")
      .update({ nom, description })
      .eq("id", id);
    if (updProj) return { error: updProj.message };

    await supabase.from("projet_plan_items").delete().eq("projet_id", id);

    if (planItems.length > 0) {
      const rows = planItems.map((item, idx) => ({
        projet_id: id,
        axe: item.axe,
        tache: item.tache,
        responsable_id: item.responsable_id || null,
        date_debut: item.date_debut || null,
        date_fin: item.date_fin || null,
        livrable: item.livrable,
        commentaire: item.commentaire,
        pmo_step_completed: item.pmo_step_completed ?? false,
        ordre: idx,
      }));
      const { error: planErr } = await supabase.from("projet_plan_items").insert(rows);
      if (planErr) return { error: planErr.message };
    }

    await fetchProjets();
    return { error: null };
  };

  const deleteProjet = async (id: string): Promise<{ error: string | null }> => {
    const { error: delErr } = await supabase.from("projets").delete().eq("id", id);
    if (delErr) return { error: delErr.message };
    await fetchProjets();
    return { error: null };
  };

  const patchPlanItemPmo = async (
    planItemId: string,
    patch: { commentaire?: string; pmo_step_completed?: boolean }
  ): Promise<{ error: string | null }> => {
    const { error: updErr } = await supabase
      .from("projet_plan_items")
      .update(patch)
      .eq("id", planItemId);
    if (updErr) return { error: updErr.message };
    await fetchProjets();
    return { error: null };
  };

  return {
    projets,
    loading,
    error,
    fetchProjets,
    createProjet,
    updateProjet,
    deleteProjet,
    patchPlanItemPmo,
  };
}
