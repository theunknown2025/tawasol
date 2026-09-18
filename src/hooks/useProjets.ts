import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { fetchDocumentsByProjetIds, uploadProjetDocument } from "@/lib/projetDocumentsApi";
import type {
  Projet,
  ProjetWithPlan,
  ProjetPlanItem,
  ProjetKpi,
  ProjetCreateInput,
} from "@/types/projet";

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

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

    const projs = (projetsData ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      nom: row.nom as string,
      description: (row.description as string | null) ?? null,
      zone_region: (row.zone_region as string | null) ?? null,
      zone_province: (row.zone_province as string | null) ?? null,
      budget: toNumberOrNull(row.budget),
      date_debut: (row.date_debut as string | null) ?? null,
      date_fin: (row.date_fin as string | null) ?? null,
      bailleurs_de_fonds: Array.isArray(row.bailleurs_de_fonds)
        ? (row.bailleurs_de_fonds as string[]).filter(Boolean)
        : [],
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    })) as Projet[];

    if (projs.length === 0) {
      setProjets([]);
      setLoading(false);
      return;
    }

    const projetIds = projs.map((p) => p.id);

    const [{ data: planData }, { data: kpiData }, docsByProjet] = await Promise.all([
      supabase.from("projet_plan_items").select("*").in("projet_id", projetIds).order("ordre"),
      supabase.from("projet_kpis").select("*").in("projet_id", projetIds).order("ordre"),
      fetchDocumentsByProjetIds(projetIds),
    ]);

    const personnelIds = new Set<string>();
    for (const row of planData ?? []) {
      const rid = row.responsable_id as string | null;
      if (rid) personnelIds.add(rid);
      const cids = (row.contributeur_ids as string[] | null) ?? [];
      for (const cid of cids) if (cid) personnelIds.add(cid);
    }

    let nameById: Record<string, string> = {};
    if (personnelIds.size > 0) {
      const { data: perso } = await supabase
        .from("personnel")
        .select("id, full_name")
        .in("id", [...personnelIds]);
      nameById = Object.fromEntries(
        (perso ?? []).map((p: { id: string; full_name: string }) => [p.id, p.full_name])
      );
    }

    const itemsByProjet = (planData ?? []).reduce(
      (acc: Record<string, ProjetPlanItem[]>, row: Record<string, unknown>) => {
        const pid = row.projet_id as string;
        if (!acc[pid]) acc[pid] = [];
        const rid = row.responsable_id as string | null;
        const contributeurIds = ((row.contributeur_ids as string[] | null) ?? []).filter(Boolean);
        acc[pid].push({
          id: row.id as string,
          axe: (row.axe as string) ?? "",
          tache: (row.tache as string) ?? "",
          responsable_id: rid,
          responsable_name: rid ? nameById[rid] : undefined,
          contributeur_ids: contributeurIds,
          contributeur_names: contributeurIds.map((id) => nameById[id] ?? id),
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

    const kpisByProjet = (kpiData ?? []).reduce(
      (acc: Record<string, ProjetKpi[]>, row: Record<string, unknown>) => {
        const pid = row.projet_id as string;
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push({
          id: row.id as string,
          nom: (row.nom as string) ?? "",
          description: (row.description as string) ?? "",
          objectif: (row.objectif as string) ?? "",
          resultat_escompte: (row.resultat_escompte as string) ?? "",
          mesure: (row.mesure as string) ?? "",
          frequence: (row.frequence as string) ?? "",
          ordre: row.ordre as number | undefined,
        });
        return acc;
      },
      {}
    );

    setProjets(
      projs.map((p) => ({
        ...p,
        plan_items: itemsByProjet[p.id] ?? [],
        kpis: kpisByProjet[p.id] ?? [],
        documents: docsByProjet[p.id] ?? [],
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjets();
  }, [fetchProjets]);

  const insertPlanItems = async (projetId: string, planItems: ProjetPlanItem[]) => {
    if (planItems.length === 0) return null;
    const rows = planItems.map((item, idx) => {
      const contributeurIds = (item.contributeur_ids ?? []).filter(
        (id) => id && id !== item.responsable_id
      );
      return {
        projet_id: projetId,
        axe: item.axe,
        tache: item.tache,
        responsable_id: item.responsable_id || null,
        contributeur_ids: contributeurIds,
        date_debut: item.date_debut || null,
        date_fin: item.date_fin || null,
        livrable: item.livrable,
        commentaire: item.commentaire,
        pmo_step_completed: item.pmo_step_completed ?? false,
        ordre: idx,
      };
    });
    const { error: planErr } = await supabase.from("projet_plan_items").insert(rows);
    return planErr?.message ?? null;
  };

  const insertKpis = async (projetId: string, kpis: ProjetKpi[]) => {
    const meaningful = kpis.filter(
      (k) =>
        k.nom.trim() ||
        k.description.trim() ||
        k.objectif.trim() ||
        k.resultat_escompte.trim() ||
        k.mesure.trim() ||
        k.frequence.trim()
    );
    if (meaningful.length === 0) return null;
    const rows = meaningful.map((k, idx) => ({
      projet_id: projetId,
      nom: k.nom,
      description: k.description,
      objectif: k.objectif,
      resultat_escompte: k.resultat_escompte,
      mesure: k.mesure,
      frequence: k.frequence,
      ordre: idx,
    }));
    const { error: kpiErr } = await supabase.from("projet_kpis").insert(rows);
    return kpiErr?.message ?? null;
  };

  const createProjet = async (input: ProjetCreateInput): Promise<{ error: string | null }> => {
    const { data: proj, error: insertProj } = await supabase
      .from("projets")
      .insert({
        nom: input.nom,
        description: input.description,
        zone_region: input.zone_region,
        zone_province: input.zone_province,
        budget: input.budget,
        date_debut: input.date_debut,
        date_fin: input.date_fin,
        bailleurs_de_fonds: input.bailleurs_de_fonds.filter((b) => b.trim()).map((b) => b.trim()),
      })
      .select("id")
      .single();

    if (insertProj || !proj) return { error: insertProj?.message ?? "Erreur création projet" };

    const planErr = await insertPlanItems(proj.id, input.planItems);
    if (planErr) return { error: planErr };

    const kpiErr = await insertKpis(proj.id, input.kpis);
    if (kpiErr) return { error: kpiErr };

    for (const file of input.documentFiles ?? []) {
      const { error: docErr } = await uploadProjetDocument(proj.id, file);
      if (docErr) return { error: docErr };
    }

    await fetchProjets();
    return { error: null };
  };

  const updateProjet = async (
    id: string,
    input: ProjetCreateInput
  ): Promise<{ error: string | null }> => {
    const { error: updProj } = await supabase
      .from("projets")
      .update({
        nom: input.nom,
        description: input.description,
        zone_region: input.zone_region,
        zone_province: input.zone_province,
        budget: input.budget,
        date_debut: input.date_debut,
        date_fin: input.date_fin,
        bailleurs_de_fonds: input.bailleurs_de_fonds.filter((b) => b.trim()).map((b) => b.trim()),
      })
      .eq("id", id);
    if (updProj) return { error: updProj.message };

    await supabase.from("projet_plan_items").delete().eq("projet_id", id);
    await supabase.from("projet_kpis").delete().eq("projet_id", id);

    const planErr = await insertPlanItems(id, input.planItems);
    if (planErr) return { error: planErr };

    const kpiErr = await insertKpis(id, input.kpis);
    if (kpiErr) return { error: kpiErr };

    for (const file of input.documentFiles ?? []) {
      const { error: docErr } = await uploadProjetDocument(id, file);
      if (docErr) return { error: docErr };
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
