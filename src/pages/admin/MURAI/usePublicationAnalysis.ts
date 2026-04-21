import { useState, useCallback, useRef, useEffect } from "react";
import type { Publication } from "@/hooks/usePublications";
import type { PublicationAnalysis, AnalysisPhase } from "./types";

const ANALYZING_DURATION_MS = 2500;

/**
 * Simulates AI analysis of a publication. Replace with actual AI API call when available.
 */
function generateMockAnalysis(pub: Publication): PublicationAnalysis {
  const engagement = pub.likes + pub.comments.length + pub.clicks;
  const metrics = [
    { name: "Likes", value: pub.likes },
    { name: "Commentaires", value: pub.comments.length },
    { name: "Clics", value: pub.clicks },
  ];

  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  let sentimentScore = 0.5;
  const textLower = (pub.text || "").toLowerCase();
  if (textLower.includes("super") || textLower.includes("excellent") || textLower.includes("merci")) {
    sentiment = "positive";
    sentimentScore = 0.85;
  } else if (textLower.includes("problème") || textLower.includes("erreur") || textLower.includes("non")) {
    sentiment = "negative";
    sentimentScore = 0.25;
  }

  const recommendations: string[] = [];
  if (pub.likes < 5 && engagement > 0) recommendations.push("Encourager les interactions pour augmenter les likes.");
  if (pub.comments.length === 0) recommendations.push("Poser une question dans la publication pour stimuler les commentaires.");
  if ((pub.tags ?? []).length < 2) recommendations.push("Ajouter des hashtags pertinents pour améliorer la portée.");
  if (recommendations.length === 0) recommendations.push("Publication bien optimisée. Continuer sur cette lancée.");

  return {
    id: crypto.randomUUID(),
    publicationId: pub.id,
    generatedAt: new Date().toISOString(),
    summary: `Cette publication de ${pub.authorName} reçoit une audience modérée avec ${engagement} interactions au total. Le ton général est ${sentiment === "positive" ? "positif" : sentiment === "negative" ? "négatif" : "neutre"}.`,
    detailedReport: `Analyse détaillée : La publication contient ${(pub.text || "").split(/\s+/).filter(Boolean).length} mots et ${pub.files.length} pièce(s) jointe(s). ${(pub.tags ?? []).length > 0 ? `Les hashtags utilisés (#${(pub.tags ?? []).join(", #")}) contribuent à la visibilité.` : "Aucun hashtag détecté."} Le taux d'engagement peut être amélioré en publiant à des heures de pointe.`,
    sentiment,
    sentimentScore,
    engagement: {
      likes: pub.likes,
      comments: pub.comments.length,
      clicks: pub.clicks,
      total: engagement,
    },
    metrics,
    recommendations,
  };
}

export function usePublicationAnalysis() {
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [analysis, setAnalysis] = useState<PublicationAnalysis | null>(null);
  const [currentPubId, setCurrentPubId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const runAnalysis = useCallback((pub: Publication) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentPubId(pub.id);
    setPhase("analyzing");
    setAnalysis(null);

    timerRef.current = setTimeout(() => {
      const result = generateMockAnalysis(pub);
      setAnalysis(result);
      setPhase("complete");
      timerRef.current = null;
    }, ANALYZING_DURATION_MS);
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPhase("idle");
    setAnalysis(null);
    setCurrentPubId(null);
  }, []);

  const saveAnalysis = useCallback(async (a: PublicationAnalysis) => {
    // TODO: Persist to backend when API is ready
    // For now, download as JSON
    const blob = new Blob([JSON.stringify(a, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const aEl = document.createElement("a");
    aEl.href = url;
    aEl.download = `analyse-publication-${a.publicationId}-${Date.now()}.json`;
    aEl.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
    phase,
    analysis,
    currentPubId,
    runAnalysis,
    reset,
    saveAnalysis,
  };
}
