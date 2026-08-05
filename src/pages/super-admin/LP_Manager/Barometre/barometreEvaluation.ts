/** Critères d’évaluation coopérative (scores 1–5). */
export const EVALUATION_CRITERIA = [
  { key: "gouvernance", label: "Gouvernance" },
  { key: "conditions_travail", label: "Conditions de travail" },
  { key: "developpement_personnel", label: "Développement du personnel" },
  { key: "transparence", label: "Transparence" },
  { key: "ancrage_territorial", label: "Ancrage territorial" },
  { key: "intercooperation", label: "Intercoopération ou réseautage" },
  { key: "performance_economique", label: "Performance économique et financière" },
  { key: "communication_externe", label: "Communication externe" },
  { key: "approche_genre", label: "Approche genre" },
  { key: "durabilite_environnementale", label: "Durabilité environnementale" },
  { key: "innovation", label: "Innovation" },
] as const;

export type EvaluationCriterionKey = (typeof EVALUATION_CRITERIA)[number]["key"];

export type CooperativeEvaluation = Partial<Record<EvaluationCriterionKey, number | null>>;

export const EVALUATION_SCORE_MIN = 1;
export const EVALUATION_SCORE_MAX = 5;

export function emptyEvaluation(): CooperativeEvaluation {
  const out: CooperativeEvaluation = {};
  for (const c of EVALUATION_CRITERIA) out[c.key] = null;
  return out;
}

export function parseEvaluation(raw: unknown): CooperativeEvaluation {
  const out = emptyEvaluation();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const rec = raw as Record<string, unknown>;
  for (const c of EVALUATION_CRITERIA) {
    const v = rec[c.key];
    if (typeof v === "number" && Number.isInteger(v) && v >= EVALUATION_SCORE_MIN && v <= EVALUATION_SCORE_MAX) {
      out[c.key] = v;
    } else if (typeof v === "string" && v.trim()) {
      const n = Number.parseInt(v, 10);
      if (Number.isInteger(n) && n >= EVALUATION_SCORE_MIN && n <= EVALUATION_SCORE_MAX) {
        out[c.key] = n;
      }
    }
  }
  return out;
}

/** JSONB payload : omet les scores vides. */
export function evaluationToJson(evaluation: CooperativeEvaluation): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of EVALUATION_CRITERIA) {
    const v = evaluation[c.key];
    if (typeof v === "number" && Number.isInteger(v) && v >= EVALUATION_SCORE_MIN && v <= EVALUATION_SCORE_MAX) {
      out[c.key] = v;
    }
  }
  return out;
}

export const TEMPS_DE_TRAVAIL_OPTIONS = [
  "Temps plein",
  "Temps partiel",
  "Saisonnier",
  "Autre",
] as const;
