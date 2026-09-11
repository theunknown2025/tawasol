import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import type {
  BarometreChartType,
  BarometreColumn,
  BarometreDataRow,
} from "./barometreDatasetTypes";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(142 76% 36%)",
  "hsl(25 95% 53%)",
  "hsl(199 89% 48%)",
  "hsl(340 82% 52%)",
  "hsl(45 93% 47%)",
  "hsl(173 80% 40%)",
  "hsl(210 90% 52%)",
  "hsl(280 65% 60%)",
  "hsl(0 72% 51%)",
];

const compactFr = new Intl.NumberFormat("fr-FR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const fullFr = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

type Props = {
  columns: BarometreColumn[];
  rows: BarometreDataRow[];
  xColumnId: string | null;
  yColumnIds: string[];
  chartType: BarometreChartType;
  className?: string;
  height?: number;
};

function toNumber(v: string | number | null | undefined): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function buildBarometreChartData(
  columns: BarometreColumn[],
  rows: BarometreDataRow[],
  xColumnId: string | null,
  yColumnIds: string[],
): { data: Record<string, string | number>[]; yKeys: { id: string; label: string }[] } {
  const colById = new Map(columns.map((c) => [c.id, c]));
  const xId = xColumnId && colById.has(xColumnId) ? xColumnId : columns.find((c) => c.type === "text")?.id;
  const yKeys = yColumnIds
    .map((id) => colById.get(id))
    .filter((c): c is BarometreColumn => !!c && c.type === "number")
    .map((c) => ({ id: c.id, label: c.label || c.id }));

  const data = rows
    .filter((r) => !r.isTotal)
    .map((r) => {
      const point: Record<string, string | number> = {
        name: xId ? String(r.cells[xId] ?? "") : "",
      };
      for (const y of yKeys) {
        point[y.id] = toNumber(r.cells[y.id]);
      }
      return point;
    })
    .filter((p) => String(p.name).trim().length > 0);

  return { data, yKeys };
}

export function BarometreFlexibleChart({
  columns,
  rows,
  xColumnId,
  yColumnIds,
  chartType,
  className,
  height = 280,
}: Props) {
  const { data, yKeys } = buildBarometreChartData(columns, rows, xColumnId, yColumnIds);

  if (data.length === 0 || yKeys.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground",
          className,
        )}
        style={{ height }}
      >
        Ajoutez des colonnes et des lignes pour prévisualiser le graphique.
      </div>
    );
  }

  const tip = (value: number, name: string) => [fullFr.format(value), name] as [string, string];

  if (chartType === "pie") {
    const y = yKeys[0];
    const pieData = data.map((d) => ({
      name: String(d.name),
      value: toNumber(d[y.id]),
    }));
    return (
      <div className={cn("w-full", className)} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius="70%" label={false}>
              {pieData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => fullFr.format(v)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const margin = { top: 8, right: 12, left: 4, bottom: 48 };

  if (chartType === "line") {
    return (
      <div className={cn("w-full", className)} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
            <YAxis tickFormatter={(n) => compactFr.format(n)} width={48} />
            <Tooltip formatter={tip} />
            <Legend />
            {yKeys.map((y, i) => (
              <Line
                key={y.id}
                type="monotone"
                dataKey={y.id}
                name={y.label}
                stroke={PIE_COLORS[i % PIE_COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartType === "area") {
    return (
      <div className={cn("w-full", className)} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
            <YAxis tickFormatter={(n) => compactFr.format(n)} width={48} />
            <Tooltip formatter={tip} />
            <Legend />
            {yKeys.map((y, i) => (
              <Area
                key={y.id}
                type="monotone"
                dataKey={y.id}
                name={y.label}
                stroke={PIE_COLORS[i % PIE_COLORS.length]}
                fill={PIE_COLORS[i % PIE_COLORS.length]}
                fillOpacity={0.25}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
          <YAxis tickFormatter={(n) => compactFr.format(n)} width={48} />
          <Tooltip formatter={tip} />
          <Legend />
          {yKeys.map((y, i) => (
            <Bar
              key={y.id}
              dataKey={y.id}
              name={y.label}
              fill={PIE_COLORS[i % PIE_COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
