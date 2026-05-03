import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

export type BarometreChartType = "bar" | "line" | "area" | "pie";

export type BarometreChartRow = {
  categoryLabel: string;
  cooperatives: number;
  adherents: number;
};

export const BAROMETRE_CHART_TYPE_OPTIONS: { value: BarometreChartType; label: string }[] = [
  { value: "bar", label: "Barres" },
  { value: "line", label: "Courbes" },
  { value: "area", label: "Aires" },
  { value: "pie", label: "Camembert" },
];

const compactFr = new Intl.NumberFormat("fr-FR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const fullFr = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

function formatTickCompact(n: number): string {
  if (!Number.isFinite(n)) return "";
  return compactFr.format(n);
}

function formatFull(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return fullFr.format(n);
}

/** Échelle log si toutes les valeurs &gt; 0 et rapport max/min fort (petites barres visibles). */
function useLogScale(values: number[]): boolean {
  const pos = values.filter((v) => v > 0);
  if (pos.length !== values.length || pos.length < 2) return false;
  const min = Math.min(...pos);
  const max = Math.max(...pos);
  return max / min >= 15;
}

function logDomain(values: number[]): [number, string] {
  const pos = values.filter((v) => v > 0);
  const min = Math.min(...pos);
  return [Math.max(min * 0.85, 1), "dataMax"];
}

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(142 76% 36%)",
  "hsl(262 83% 58%)",
  "hsl(25 95% 53%)",
  "hsl(199 89% 48%)",
  "hsl(340 82% 52%)",
  "hsl(45 93% 47%)",
  "hsl(280 65% 60%)",
  "hsl(173 80% 40%)",
  "hsl(0 72% 51%)",
  "hsl(210 90% 52%)",
  "hsl(80 70% 45%)",
];

function pieColor(i: number): string {
  return PIE_COLORS[i % PIE_COLORS.length];
}

type ChartDatum = { name: string; cooperatives: number; adherents: number };

type Props = {
  rows: BarometreChartRow[];
  chartType: BarometreChartType;
  className?: string;
};

function toChartData(rows: BarometreChartRow[]): ChartDatum[] {
  return rows.map((r) => ({
    name: r.categoryLabel,
    cooperatives: r.cooperatives,
    adherents: r.adherents,
  }));
}

const axisTickStyle = { fontSize: 10 };

type TooltipPayload = { name?: string; value?: number; payload?: { name?: string } };

function BarTooltip({
  active,
  payload,
  label,
  valueLabel,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  valueLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const v = typeof p.value === "number" ? p.value : Number(p.value);
  const name = (label ?? p.payload?.name ?? p.name) as string;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-foreground">{name}</p>
      <p className="text-muted-foreground">
        {valueLabel} : <span className="font-medium tabular-nums text-foreground">{formatFull(v)}</span>
      </p>
    </div>
  );
}

function CoopLinearChart({
  data,
  chartType,
  tall,
  coopLog,
  coopLogDom,
}: {
  data: ChartDatum[];
  chartType: Exclude<BarometreChartType, "pie">;
  tall: boolean;
  coopLog: boolean;
  coopLogDom: [number, string];
}) {
  const h = tall ? 320 : 280;
  const bottom = tall ? 100 : 72;
  const yAxis = (
    <YAxis
      tick={axisTickStyle}
      className="text-muted-foreground"
      width={72}
      scale={coopLog ? "log" : "linear"}
      domain={coopLog ? coopLogDom : [0, "auto"]}
      tickFormatter={formatTickCompact}
      allowDataOverflow={coopLog}
    />
  );
  const commonAxis = (
    <>
      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
      <XAxis
        dataKey="name"
        tick={axisTickStyle}
        interval={0}
        angle={-32}
        textAnchor="end"
        height={bottom}
        className="text-muted-foreground"
      />
      {yAxis}
      <Tooltip content={<BarTooltip valueLabel="Coopératives" />} />
    </>
  );

  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: bottom - 40 }}>
          {commonAxis}
          <Line type="monotone" dataKey="cooperatives" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: bottom - 40 }}>
          {commonAxis}
          <Area
            type="monotone"
            dataKey="cooperatives"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary) / 0.2)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom }}>
        {commonAxis}
        <Bar dataKey="cooperatives" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function AdhLinearChart({
  data,
  chartType,
  tall,
  adhLog,
  adhLogDom,
}: {
  data: ChartDatum[];
  chartType: Exclude<BarometreChartType, "pie">;
  tall: boolean;
  adhLog: boolean;
  adhLogDom: [number, string];
}) {
  const h = tall ? 320 : 280;
  const bottom = tall ? 100 : 72;
  const yAxis = (
    <YAxis
      tick={axisTickStyle}
      className="text-muted-foreground"
      width={72}
      scale={adhLog ? "log" : "linear"}
      domain={adhLog ? adhLogDom : [0, "auto"]}
      tickFormatter={formatTickCompact}
      allowDataOverflow={adhLog}
    />
  );
  const commonAxis = (
    <>
      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
      <XAxis
        dataKey="name"
        tick={axisTickStyle}
        interval={0}
        angle={-32}
        textAnchor="end"
        height={bottom}
        className="text-muted-foreground"
      />
      {yAxis}
      <Tooltip content={<BarTooltip valueLabel="Adhérents" />} />
    </>
  );

  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: bottom - 40 }}>
          {commonAxis}
          <Line
            type="monotone"
            dataKey="adherents"
            stroke="hsl(142 76% 36%)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: bottom - 40 }}>
          {commonAxis}
          <Area
            type="monotone"
            dataKey="adherents"
            stroke="hsl(142 76% 36%)"
            fill="hsl(142 76% 36% / 0.2)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom }}>
        {commonAxis}
        <Bar dataKey="adherents" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

type PieRow = { name: string; value: number; fill: string };

function toPieRows(data: ChartDatum[], key: "cooperatives" | "adherents"): PieRow[] {
  return data
    .map((d, i) => ({
      name: d.name,
      value: d[key],
      fill: pieColor(i),
    }))
    .filter((d) => d.value > 0);
}

function SinglePieChart({
  rows,
  title,
}: {
  rows: PieRow[];
  title: string;
}) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  const h = 340;

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aucune valeur positive pour ce graphique.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={h}>
      <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Pie
          data={rows}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="46%"
          innerRadius={52}
          outerRadius={118}
          paddingAngle={0.5}
          label={({ name, percent }) =>
            percent >= 0.04 ? `${String(name).slice(0, 18)}${String(name).length > 18 ? "…" : ""} (${(percent * 100).toFixed(0)}%)` : ""
          }
          labelLine={false}
        >
          {rows.map((entry, i) => (
            <Cell key={`${entry.name}-${i}`} fill={entry.fill} stroke="hsl(var(--background))" strokeWidth={1} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as PieRow;
            const pct = total > 0 ? (p.value / total) * 100 : 0;
            return (
              <div className="max-w-xs rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
                <p className="font-semibold text-foreground">{p.name}</p>
                <p className="text-muted-foreground">
                  {title} :{" "}
                  <span className="font-medium tabular-nums text-foreground">{formatFull(p.value)}</span>
                </p>
                <p className="text-xs text-muted-foreground">{pct.toFixed(1)} % du total</p>
              </div>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ScaleHint({ coopLog, adhLog }: { coopLog: boolean; adhLog: boolean }) {
  if (!coopLog && !adhLog) return null;
  return (
    <p className="mt-2 text-xs text-muted-foreground">
      {coopLog || adhLog
        ? "Échelle logarithmique sur l’axe des valeurs : les petits effectifs restent lisibles à côté des grands. Les infobulles affichent le nombre exact."
        : null}
    </p>
  );
}

export function BarometreDualCharts({ rows, chartType, className }: Props) {
  const data = toChartData(rows);
  const tall = rows.length > 14;

  const coopVals = data.map((d) => d.cooperatives);
  const adhVals = data.map((d) => d.adherents);
  const coopLog = chartType !== "pie" && useLogScale(coopVals);
  const adhLog = chartType !== "pie" && useLogScale(adhVals);
  const coopLogDom = coopLog ? logDomain(coopVals) : ([1, "dataMax"] as [number, string]);
  const adhLogDom = adhLog ? logDomain(adhVals) : ([1, "dataMax"] as [number, string]);

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        Aucune donnée à afficher. Importez un fichier Excel ou sélectionnez une autre année.
      </div>
    );
  }

  if (chartType === "pie") {
    const coopPie = toPieRows(data, "cooperatives");
    const adhPie = toPieRows(data, "adherents");
    return (
      <div className={cn("flex flex-col gap-8", className)}>
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-foreground">Nombre de coopératives (parts)</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Camembert : lisible quand les ordres de grandeur diffèrent fortement ; survol pour la valeur exacte et le
            pourcentage.
          </p>
          <SinglePieChart rows={coopPie} title="Coopératives" />
        </section>
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-foreground">Nombre d&apos;adhérents (parts)</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Répartition relative des adhérents par catégorie (seules les parts &gt; 0 sont affichées).
          </p>
          <SinglePieChart rows={adhPie} title="Adhérents" />
        </section>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-foreground">Nombre de coopératives</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Axe en notation compacte (k, M).{coopLog ? " Échelle logarithmique activée." : ""}
        </p>
        <CoopLinearChart
          data={data}
          chartType={chartType}
          tall={tall}
          coopLog={coopLog}
          coopLogDom={coopLogDom}
        />
        <ScaleHint coopLog={coopLog} adhLog={false} />
      </section>
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-foreground">Nombre d&apos;adhérents</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Axe en notation compacte (k, M).{adhLog ? " Échelle logarithmique activée." : ""}
        </p>
        <AdhLinearChart
          data={data}
          chartType={chartType}
          tall={tall}
          adhLog={adhLog}
          adhLogDom={adhLogDom}
        />
        <ScaleHint coopLog={false} adhLog={adhLog} />
      </section>
    </div>
  );
}
