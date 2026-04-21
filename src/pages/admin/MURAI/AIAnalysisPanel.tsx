import { Sparkles, BarChart3, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import type { PublicationAnalysis, AnalysisPhase } from "./types";

interface AIAnalysisPanelProps {
  phase: AnalysisPhase;
  analysis: PublicationAnalysis | null;
  onClose: () => void;
  onSave: (analysis: PublicationAnalysis) => void;
}

export function AIAnalysisPanel({
  phase,
  analysis,
  onClose,
  onSave,
}: AIAnalysisPanelProps) {
  if (phase === "idle") return null;

  const chartConfig = {
    value: { label: "Valeur", color: "hsl(var(--primary))" },
  };

  return (
    <div className="flex flex-col w-full min-w-[340px] max-w-[420px] h-full min-h-[400px] bg-card border-l border-border rounded-r-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Sparkles size={18} className="text-primary" />
          </div>
          <span className="font-semibold text-sm">Analyse IA</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X size={16} />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {phase === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-12 gap-6 animate-in fade-in duration-300">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <Sparkles
                size={24}
                className="absolute inset-0 m-auto text-primary animate-pulse"
              />
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium text-foreground">Analyse en cours</p>
              <p className="text-sm text-muted-foreground">
                L&apos;IA analyse la publication...
              </p>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {phase === "complete" && analysis && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Summary */}
            <div>
              <h4 className="font-semibold text-sm mb-1.5">Résumé global</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.summary}
              </p>
            </div>

            {/* Sentiment */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Ton :</span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  analysis.sentiment === "positive"
                    ? "bg-green-500/20 text-green-700 dark:text-green-400"
                    : analysis.sentiment === "negative"
                      ? "bg-red-500/20 text-red-700 dark:text-red-400"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {analysis.sentiment === "positive"
                  ? "Positif"
                  : analysis.sentiment === "negative"
                    ? "Négatif"
                    : "Neutre"}{" "}
                ({(analysis.sentimentScore * 100).toFixed(0)}%)
              </span>
            </div>

            {/* Engagement chart */}
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                <BarChart3 size={16} />
                Engagement
              </h4>
              <ChartContainer config={chartConfig} className="h-[140px] w-full">
                <BarChart data={analysis.metrics} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>

            {/* Detailed report */}
            <div>
              <h4 className="font-semibold text-sm mb-1.5">Rapport détaillé</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.detailedReport}
              </p>
            </div>

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-1.5">Recommandations</h4>
                <ul className="space-y-1.5">
                  {analysis.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground flex gap-2"
                    >
                      <span className="text-primary">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save button - only when complete */}
      {phase === "complete" && analysis && (
        <div className="p-4 border-t border-border">
          <Button
            className="w-full gap-2"
            onClick={() => onSave(analysis)}
          >
            <Save size={16} />
            Enregistrer l&apos;analyse
          </Button>
        </div>
      )}
    </div>
  );
}
