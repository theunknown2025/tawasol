export interface ProjetPlanItem {
  id?: string;
  axe: string;
  tache: string;
  responsable_id: string | null;
  responsable_name?: string;
  date_debut: string | null;
  date_fin: string | null;
  livrable: string;
  commentaire: string;
  /** PMO: étape marquée comme terminée (avancement) */
  pmo_step_completed?: boolean;
  ordre?: number;
}

export interface ProjetPlanItemDocument {
  id: string;
  plan_item_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface Projet {
  id: string;
  nom: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjetWithPlan extends Projet {
  plan_items: ProjetPlanItem[];
}
