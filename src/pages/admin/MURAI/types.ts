export interface PublicationAnalysis {
  id: string;
  publicationId: string;
  generatedAt: string;
  summary: string;
  detailedReport: string;
  sentiment: "positive" | "neutral" | "negative";
  sentimentScore: number;
  engagement: {
    likes: number;
    comments: number;
    clicks: number;
    total: number;
  };
  metrics: { name: string; value: number }[];
  recommendations: string[];
}

export type AnalysisPhase = "idle" | "analyzing" | "complete" | "error";
