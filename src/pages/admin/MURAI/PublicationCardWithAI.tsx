import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIAnalysisPanel } from "./AIAnalysisPanel";
import { usePublicationAnalysis } from "./usePublicationAnalysis";
import type { Publication } from "@/hooks/usePublications";
import { toast } from "sonner";

interface PublicationCardWithAIProps {
  publication: Publication;
  showAI: boolean;
  children: React.ReactNode;
}

export function PublicationCardWithAI({
  publication,
  showAI,
  children,
}: PublicationCardWithAIProps) {
  const {
    phase,
    analysis,
    runAnalysis,
    reset,
    saveAnalysis,
    currentPubId,
  } = usePublicationAnalysis();

  const isExpanded = phase !== "idle" && currentPubId === publication.id;

  const handleAIClick = () => {
    if (isExpanded) {
      reset();
    } else {
      runAnalysis(publication);
    }
  };

  const handleSave = async (a: Parameters<typeof saveAnalysis>[0]) => {
    await saveAnalysis(a);
    toast.success("Analyse enregistrée");
  };

  return (
    <div
      className={`flex rounded-2xl border border-border overflow-hidden bg-card shadow-sm transition-all duration-300 ease-in-out ${
        isExpanded ? "flex-row shadow-lg" : "flex-col"
      }`}
    >
      {/* Card content - shifts left when expanded */}
      <div
        className={`flex-1 min-w-0 overflow-hidden transition-all duration-300 ${
          isExpanded ? "w-[55%] shrink-0" : "w-full"
        }`}
      >
        <div className="relative p-6">
          {showAI && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-9 w-9 rounded-lg hover:bg-primary/10 text-primary"
              onClick={handleAIClick}
              title={isExpanded ? "Fermer l'analyse" : "Analyser avec l'IA"}
            >
              <Sparkles size={18} />
            </Button>
          )}
          <div className={showAI ? "pr-12" : ""}>
            {children}
          </div>
        </div>
      </div>

      {/* AI Panel - slides in from right */}
      {isExpanded && (
        <AIAnalysisPanel
          phase={phase}
          analysis={analysis}
          onClose={reset}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
