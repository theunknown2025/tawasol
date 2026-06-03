export interface PublicationAnalysis {
  id: string;
  publicationId: string;
  generatedAt: string;
  /** Vue d'ensemble courte de la publication et des échanges */
  summary: string;
  /** Rapport sur le contenu principal de la publication */
  postReport: string;
  /** Synthèse des commentaires */
  commentsSummary: string;
  engagement: {
    likes: number;
    comments: number;
    clicks: number;
    total: number;
  };
  metrics: { name: string; value: number }[];
}

export type AnalysisPhase = "idle" | "analyzing" | "complete" | "error";
