import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Download,
  Loader2,
  MousePointerClick,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  fetchLibraryStatsHistory,
  resolveLibraryStatsRange,
  type LibraryStatsGranularity,
  type LibraryStatsHistoryPoint,
  type LibraryStatsRangePreset,
} from "./libraryStatsHistoryApi";

type CountMetricKey = "clicks" | "downloads";

const COUNT_METRICS: {
  key: CountMetricKey;
  title: string;
  description: string;
  color: string;
  icon: typeof MousePointerClick;
}[] = [
  {
    key: "clicks",
    title: "Clics",
    description: "Ouvertures de fiche / lecture sur le site public",
    color: "hsl(var(--primary))",
    icon: MousePointerClick,
  },
  {
    key: "downloads",
    title: "Téléchargements",
    description: "Clics sur « Télécharger » (PDF)",
    color: "hsl(199 89% 42%)",
    icon: Download,
  },
];

function CountMetricChart({
  points,
  metric,
  color,
  title,
}: {
  points: LibraryStatsHistoryPoint[];
  metric: CountMetricKey;
  color: string;
  title: string;
}) {
  const hasData = points.some((p) => p[metric] > 0);

  if (!hasData) {
    return (
      <p className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        {`Aucune donnée « ${title.toLowerCase()} » sur cette période.`}
      </p>
    );
  }

  return (
    <div className="h-52 w-full min-w-0 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={28} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--card))",
            }}
          />
          <Line
            type="monotone"
            dataKey={metric}
            name={title}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function EvaluationTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as LibraryStatsHistoryPoint | undefined;
  if (!row) return null;
  const count = row.evaluationsCount;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {count > 0 && row.evaluationAvg != null ? (
        <>
          <p className="tabular-nums text-foreground">
            Note moyenne : <span className="font-semibold">{row.evaluationAvg.toFixed(2)} / 5</span>
          </p>
          <p className="mt-0.5 tabular-nums text-muted-foreground">
            {count} évaluation{count !== 1 ? "s" : ""}
          </p>
        </>
      ) : (
        <p className="text-muted-foreground">Aucune évaluation</p>
      )}
    </div>
  );
}

function EvaluationAvgChart({ points }: { points: LibraryStatsHistoryPoint[] }) {
  // Same continuous series as clicks/downloads: every bucket has a Y value (0 if no avis).
  const chartData = useMemo(
    () =>
      points.map((p) => ({
        ...p,
        evaluationAvgPlot: p.evaluationAvg ?? 0,
      })),
    [points],
  );
  const hasData = chartData.some((p) => p.evaluationsCount > 0);

  if (!hasData) {
    return (
      <p className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        Aucune évaluation sur cette période.
      </p>
    );
  }

  return (
    <div className="h-52 w-full min-w-0 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={28} />
          <YAxis
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            tick={{ fontSize: 11 }}
            width={36}
            allowDecimals
          />
          <Tooltip content={<EvaluationTooltip />} />
          <Line
            type="monotone"
            dataKey="evaluationAvgPlot"
            name="Note moyenne"
            stroke="hsl(45 93% 40%)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

type LibraryStatsHistoryPanelProps = {
  bookIds: string[];
  selectionLabel?: string;
  onBack: () => void;
};

export function LibraryStatsHistoryPanel({
  bookIds,
  selectionLabel,
  onBack,
}: LibraryStatsHistoryPanelProps) {
  const [granularity, setGranularity] = useState<LibraryStatsGranularity>("daily");
  const [preset, setPreset] = useState<LibraryStatsRangePreset>("month");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const range = useMemo(
    () => resolveLibraryStatsRange(preset, customRange?.from, customRange?.to),
    [preset, customRange?.from, customRange?.to],
  );

  const rangeReady =
    bookIds.length > 0 &&
    range != null &&
    (preset !== "custom" || Boolean(customRange?.from && customRange?.to));

  const { data: points = [], isLoading, isError, error } = useQuery({
    queryKey: [
      "library-stats-history",
      bookIds.join(","),
      granularity,
      preset,
      range?.from.toISOString() ?? "",
      range?.to.toISOString() ?? "",
    ],
    queryFn: () =>
      fetchLibraryStatsHistory({
        bookIds,
        range: range!,
        granularity,
      }),
    enabled: rangeReady,
  });

  const summary = useMemo(() => {
    const clicks = points.reduce((s, p) => s + p.clicks, 0);
    const downloads = points.reduce((s, p) => s + p.downloads, 0);
    const evaluationsCount = points.reduce((s, p) => s + p.evaluationsCount, 0);
    let ratingSum = 0;
    for (const p of points) {
      if (p.evaluationAvg != null && p.evaluationsCount > 0) {
        ratingSum += p.evaluationAvg * p.evaluationsCount;
      }
    }
    const evaluationAvg =
      evaluationsCount > 0 ? Math.round((ratingSum / evaluationsCount) * 100) / 100 : null;
    return { clicks, downloads, evaluationsCount, evaluationAvg };
  }, [points]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" size="sm" className="gap-1.5 px-2" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Totaux
            </Button>
            <h3 className="text-base font-semibold text-foreground">Historique</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Un graphique par indicateur
            {selectionLabel ? (
              <>
                {" "}
                — <span className="font-medium text-foreground">{selectionLabel}</span>
              </>
            ) : null}
            . La granularité et la période s’appliquent aux trois graphiques.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-end sm:p-4">
        <div className="space-y-1.5">
          <Label htmlFor="stats-granularity">Granularité</Label>
          <Select
            value={granularity}
            onValueChange={(v) => setGranularity(v as LibraryStatsGranularity)}
          >
            <SelectTrigger id="stats-granularity" className="w-full sm:w-[11rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Quotidien</SelectItem>
              <SelectItem value="weekly">Hebdomadaire</SelectItem>
              <SelectItem value="monthly">Mensuel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stats-preset">Période</Label>
          <Select value={preset} onValueChange={(v) => setPreset(v as LibraryStatsRangePreset)}>
            <SelectTrigger id="stats-preset" className="w-full sm:w-[12rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Dernier mois</SelectItem>
              <SelectItem value="6months">6 derniers mois</SelectItem>
              <SelectItem value="year">Dernière année</SelectItem>
              <SelectItem value="custom">Personnalisée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {preset === "custom" ? (
          <div className="space-y-1.5">
            <Label>Du … au …</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-10 w-full min-w-[14rem] justify-start text-left font-normal sm:w-auto",
                    !customRange?.from && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                  {customRange?.from ? (
                    customRange.to ? (
                      <>
                        {format(customRange.from, "dd/MM/yyyy", { locale: fr })} –{" "}
                        {format(customRange.to, "dd/MM/yyyy", { locale: fr })}
                      </>
                    ) : (
                      format(customRange.from, "dd/MM/yyyy", { locale: fr })
                    )
                  ) : (
                    "Choisir les dates"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={customRange}
                  onSelect={(r) => {
                    setCustomRange(r);
                    if (r?.from && r?.to) setCalendarOpen(false);
                  }}
                  locale={fr}
                  numberOfMonths={2}
                  disabled={{ after: new Date() }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        ) : null}
      </div>

      {bookIds.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Sélectionnez au moins une ressource pour afficher l’historique.
        </p>
      ) : preset === "custom" && !rangeReady ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Choisissez une date de début et une date de fin dans le calendrier.
        </p>
      ) : isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          <span className="text-sm">Chargement de l’historique…</span>
        </div>
      ) : isError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
          {error instanceof Error ? error.message : "Impossible de charger l’historique."}
        </p>
      ) : (
        <div className="grid gap-4">
          {COUNT_METRICS.map((metric) => {
            const Icon = metric.icon;
            const total = summary[metric.key];
            return (
              <Card key={metric.key}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Icon className="h-4 w-4" aria-hidden />
                        <CardTitle className="text-sm font-medium text-foreground">
                          {metric.title}
                        </CardTitle>
                      </div>
                      <CardDescription>{metric.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold tabular-nums text-foreground">{total}</p>
                      <p className="text-xs text-muted-foreground">Total période</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CountMetricChart
                    points={points}
                    metric={metric.key}
                    color={metric.color}
                    title={metric.title}
                  />
                </CardContent>
              </Card>
            );
          })}

          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Star className="h-4 w-4" aria-hidden />
                    <CardTitle className="text-sm font-medium text-foreground">Évaluations</CardTitle>
                  </div>
                  <CardDescription>
                    Note moyenne (1–5) par période — survol : nombre d’avis
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {summary.evaluationAvg != null ? `${summary.evaluationAvg.toFixed(2)} / 5` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Moyenne période
                    {summary.evaluationsCount > 0
                      ? ` · ${summary.evaluationsCount} avis`
                      : ""}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <EvaluationAvgChart points={points} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
