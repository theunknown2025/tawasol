import { useState, useCallback, useRef } from "react";
import type { Publication } from "@/hooks/usePublications";
import { analyzePublicationWithOpenAI } from "@/lib/publicationAnalysisApi";
import { downloadPublicationReportPdf } from "@/lib/publicationReportPdf";
import type { PublicationAnalysis, AnalysisPhase } from "./types";

export function usePublicationAnalysis() {
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [analysis, setAnalysis] = useState<PublicationAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPubId, setCurrentPubId] = useState<string | null>(null);
  const abortRef = useRef(false);

  const runAnalysis = useCallback((pub: Publication) => {
    abortRef.current = false;
    setCurrentPubId(pub.id);
    setPhase("analyzing");
    setAnalysis(null);
    setErrorMessage(null);

    void (async () => {
      try {
        const result = await analyzePublicationWithOpenAI(pub);
        if (abortRef.current) return;
        setAnalysis(result);
        setPhase("complete");
      } catch (err) {
        if (abortRef.current) return;
        setErrorMessage(err instanceof Error ? err.message : "Erreur lors de la génération du rapport.");
        setPhase("error");
      }
    })();
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setPhase("idle");
    setAnalysis(null);
    setErrorMessage(null);
    setCurrentPubId(null);
  }, []);

  const saveAnalysis = useCallback(async (a: PublicationAnalysis) => {
    downloadPublicationReportPdf(a);
  }, []);

  return {
    phase,
    analysis,
    errorMessage,
    currentPubId,
    runAnalysis,
    reset,
    saveAnalysis,
  };
}
