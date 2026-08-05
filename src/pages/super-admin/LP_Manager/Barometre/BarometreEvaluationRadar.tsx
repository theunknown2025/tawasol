import { useMemo } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  EVALUATION_CRITERIA,
  EVALUATION_SCORE_MAX,
  type CooperativeEvaluation,
} from "./barometreEvaluation";
import { cn } from "@/lib/utils";

type Props = {
  evaluation: CooperativeEvaluation;
  className?: string;
};

type RadarPoint = {
  criterion: string;
  shortLabel: string;
  score: number;
  fullMark: number;
};

function shortLabel(label: string): string {
  if (label.length <= 18) return label;
  const words = label.split(/\s+/);
  if (words.length === 1) return `${label.slice(0, 16)}…`;
  return words
    .map((w) => (w.length > 8 ? `${w.slice(0, 6)}.` : w))
    .join(" ")
    .slice(0, 22);
}

function RadarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: RadarPoint }>;
}) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-background/95 px-3 py-2 shadow-md backdrop-blur-sm">
      <p className="text-xs font-medium text-foreground">{point.criterion}</p>
      <p className="mt-0.5 text-sm tabular-nums text-primary">
        {point.score}
        <span className="text-muted-foreground"> / {point.fullMark}</span>
      </p>
    </div>
  );
}

export default function BarometreEvaluationRadar({ evaluation, className }: Props) {
  const data = useMemo<RadarPoint[]>(
    () =>
      EVALUATION_CRITERIA.map((c) => {
        const raw = evaluation[c.key];
        const score =
          typeof raw === "number" && Number.isFinite(raw) ? Math.max(0, Math.min(EVALUATION_SCORE_MAX, raw)) : 0;
        return {
          criterion: c.label,
          shortLabel: shortLabel(c.label),
          score,
          fullMark: EVALUATION_SCORE_MAX,
        };
      }),
    [evaluation],
  );

  const hasAnyScore = data.some((d) => d.score > 0);

  if (!hasAnyScore) {
    return (
      <div
        className={cn(
          "flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        Aucune note d&apos;évaluation renseignée pour cette coopérative.
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="mx-auto h-[min(420px,70vw)] w-full max-w-xl animate-in fade-in zoom-in-95 duration-700">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
            <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.9} />
            <PolarAngleAxis
              dataKey="shortLabel"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, EVALUATION_SCORE_MAX]}
              tickCount={EVALUATION_SCORE_MAX + 1}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              axisLine={false}
            />
            <Radar
              name="Évaluation"
              dataKey="score"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.35}
              strokeWidth={2}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
              dot={{
                r: 4,
                fill: "hsl(var(--primary))",
                stroke: "hsl(var(--background))",
                strokeWidth: 2,
                className: "transition-transform duration-200 hover:scale-150",
              }}
              activeDot={{
                r: 7,
                fill: "hsl(var(--primary))",
                stroke: "hsl(var(--background))",
                strokeWidth: 2,
              }}
            />
            <Tooltip content={<RadarTooltip />} cursor={false} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((d) => (
          <li
            key={d.criterion}
            className="group flex items-center justify-between gap-2 rounded-md border border-transparent px-2 py-1.5 text-sm transition-colors hover:border-border hover:bg-muted/40"
          >
            <span className="text-muted-foreground group-hover:text-foreground">{d.criterion}</span>
            <span className="tabular-nums font-medium text-foreground">
              {d.score > 0 ? d.score : "—"}
              <span className="text-muted-foreground">/{EVALUATION_SCORE_MAX}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
