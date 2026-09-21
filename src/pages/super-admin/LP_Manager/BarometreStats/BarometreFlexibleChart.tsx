import { useEffect, useMemo, useState } from "react";
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
} from "recharts";
import { cn } from "@/lib/utils";
import type {
  BarometreChartStyle,
  BarometreChartType,
  BarometreColumn,
  BarometreDataRow,
} from "./barometreDatasetTypes";
import {
  createDefaultChartStyle,
  resolveSeriesColor,
} from "./barometreDatasetTypes";

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
  chartStyle?: BarometreChartStyle | null;
  className?: string;
  height?: number;
};

type LegendItem = {
  id: string;
  label: string;
  color: string;
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

function measureTextWidth(text: string, fontSize: number): number {
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = `${fontSize}px ui-sans-serif, system-ui, sans-serif`;
      return ctx.measureText(text).width;
    }
  }
  // Fallback: ~0.62em average glyph width for tabular/compact numerals
  return text.length * fontSize * 0.62;
}

function formatAxisNumber(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  // Keep small integers readable; compact for large magnitudes
  if (abs >= 10_000) return compactFr.format(n);
  if (Number.isInteger(n) || Math.abs(n - Math.round(n)) < 1e-9) {
    return fullFr.format(Math.round(n));
  }
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(n);
}

function formatXTickLabel(raw: string | number): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  // Pure numeric labels (possibly with spaces/commas) — format flexibly by length
  const digits = s.replace(/[^\d]/g, "");
  const asNum = Number(s.replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(asNum) || digits.length === 0) return s;
  if (digits.length >= 5) return formatAxisNumber(asNum);
  if (digits.length >= 3 && Math.abs(asNum) >= 1000) return fullFr.format(asNum);
  return s;
}

function estimateYAxisWidth(
  data: Record<string, string | number>[],
  yKeys: { id: string }[],
  fontSize: number,
): number {
  let maxAbs = 0;
  for (const row of data) {
    for (const y of yKeys) {
      const n = Math.abs(toNumber(row[y.id]));
      if (n > maxAbs) maxAbs = n;
    }
  }
  // Recharts "nice" ticks often exceed the data max — sample above the max too
  const candidates = [
    0,
    maxAbs,
    maxAbs * 1.1,
    maxAbs * 1.25,
    maxAbs * 1.5,
    maxAbs * 2,
  ].map((n) => formatAxisNumber(n));

  const widest = Math.max(...candidates.map((t) => measureTextWidth(t, fontSize)), 24);
  // Extra padding so leading digits are never clipped at the SVG edge
  return Math.min(180, Math.max(88, Math.ceil(widest) + 40));
}

function estimateXAxisLayout(
  data: Record<string, string | number>[],
  fontSize: number,
): { angle: number; height: number; interval: number | "preserveStartEnd"; tickFormatter: (v: string) => string } {
  const labels = data.map((d) => formatXTickLabel(d.name));
  const maxLen = Math.max(0, ...labels.map((l) => l.length));
  const maxWidth = Math.max(0, ...labels.map((l) => measureTextWidth(l, fontSize)));
  const count = labels.length;

  const needsAngle = maxLen > 4 || count > 5 || maxWidth > 48;
  const angle = needsAngle ? (maxLen >= 8 ? -40 : -30) : 0;
  const height = needsAngle
    ? Math.min(120, Math.max(56, Math.ceil(maxWidth * Math.sin((Math.abs(angle) * Math.PI) / 180)) + 28))
    : 36;

  // Skip some ticks when many categories to avoid overlap
  const interval =
    count > 16 ? Math.ceil(count / 12) - 1 : count > 10 ? 0 : 0;

  return {
    angle,
    height,
    interval: count > 20 ? "preserveStartEnd" : interval,
    tickFormatter: (v) => formatXTickLabel(v),
  };
}

type TooltipPayloadItem = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  /** Pixel Y of the point when provided by Recharts */
  y?: number;
};

function resolveHoveredTooltipItem(
  payload: TooltipPayloadItem[] | undefined,
  hoveredDataKey: string | null,
  coordinateY?: number,
): TooltipPayloadItem | null {
  if (!payload?.length) return null;

  if (hoveredDataKey) {
    const byKey = payload.find((p) => String(p.dataKey) === hoveredDataKey);
    if (byKey) return byKey;
  }

  if (payload.length === 1) return payload[0]!;

  // Prefer the series whose plotted point is closest to the cursor (not payload[0]).
  if (coordinateY != null) {
    const withY = payload.filter((p) => typeof p.y === "number");
    if (withY.length > 0) {
      return withY.reduce((best, curr) => {
        const bestDist = Math.abs((best.y as number) - coordinateY);
        const currDist = Math.abs((curr.y as number) - coordinateY);
        return currDist < bestDist ? curr : best;
      });
    }
  }

  return null;
}

function ChartTooltipContent({
  active,
  payload,
  label,
  style,
  hoveredDataKey,
  coordinateY,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  style: BarometreChartStyle;
  hoveredDataKey: string | null;
  coordinateY?: number;
}) {
  if (!active) return null;
  const item = resolveHoveredTooltipItem(payload, hoveredDataKey, coordinateY);
  if (!item) return null;

  return (
    <div
      className="rounded-md border border-border/80 bg-background px-2.5 py-1.5 shadow-sm"
      style={{ color: style.tooltipFontColor, fontSize: style.tooltipFontSize }}
    >
      {label != null && String(label).length > 0 ? (
        <p className="mb-0.5 font-medium opacity-80">{label}</p>
      ) : null}
      <p className="flex items-center gap-1.5">
        {item.color ? (
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
        ) : null}
        <span>
          {item.name}: {fullFr.format(toNumber(item.value))}
        </span>
      </p>
    </div>
  );
}

function ChartSeriesLegend({
  items,
  hiddenIds,
  onToggle,
  fontSize,
  fontColor,
}: {
  items: LegendItem[];
  hiddenIds: Set<string>;
  onToggle: (id: string) => void;
  fontSize: number;
  fontColor: string;
}) {
  if (items.length === 0) return null;

  return (
    <ul
      className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 md:grid-cols-3"
      role="list"
      aria-label="Légende du graphique"
    >
      {items.map((item) => {
        const hidden = hiddenIds.has(item.id);
        return (
          <li key={item.id} className="min-w-0">
            <button
              type="button"
              onClick={() => onToggle(item.id)}
              aria-pressed={!hidden}
              title={hidden ? `Afficher « ${item.label} »` : `Masquer « ${item.label} »`}
              className={cn(
                "flex w-full min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-left transition-opacity hover:bg-muted/60",
                hidden && "opacity-45",
              )}
              style={{ fontSize, color: fontColor }}
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-sm",
                  hidden && "opacity-40",
                )}
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              <span className={cn("truncate", hidden && "line-through")}>{item.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function BarometreFlexibleChart({
  columns,
  rows,
  xColumnId,
  yColumnIds,
  chartType,
  chartStyle,
  className,
  height = 280,
}: Props) {
  const style = chartStyle ?? createDefaultChartStyle();
  const { data, yKeys } = buildBarometreChartData(columns, rows, xColumnId, yColumnIds);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  /** Series currently under the pointer — used so the tooltip matches the hovered dot. */
  const [hoveredDataKey, setHoveredDataKey] = useState<string | null>(null);

  const seriesKey = yKeys.map((y) => y.id).join("|");
  useEffect(() => {
    setHiddenIds(new Set());
    setHoveredDataKey(null);
  }, [seriesKey, chartType]);

  const clearHover = () => setHoveredDataKey(null);
  const hoverSeries = (id: string) => setHoveredDataKey(id);

  const makeDotHandlers = (seriesId: string, color: string) => ({
    r: 4,
    fill: color,
    stroke: "transparent",
    strokeWidth: 14,
    onMouseOver: () => hoverSeries(seriesId),
    onMouseOut: clearHover,
  });

  const makeActiveDotHandlers = (seriesId: string, color: string) => ({
    r: 6,
    fill: color,
    strokeWidth: 0,
    onMouseOver: () => hoverSeries(seriesId),
    onMouseOut: clearHover,
  });

  const toggleSeries = (id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleYKeys = useMemo(
    () => yKeys.filter((y) => !hiddenIds.has(y.id)),
    [yKeys, hiddenIds],
  );

  const seriesLegendItems: LegendItem[] = useMemo(
    () =>
      yKeys.map((y, i) => ({
        id: y.id,
        label: y.label,
        color: resolveSeriesColor(style, i),
      })),
    [yKeys, style],
  );

  if (data.length === 0 || yKeys.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground",
          className,
        )}
        style={{ height, backgroundColor: style.backgroundColor }}
      >
        Ajoutez des colonnes et des lignes pour prévisualiser le graphique.
      </div>
    );
  }

  const xTick = {
    fontSize: style.xAxisFontSize,
    fill: style.xAxisFontColor,
  };
  const yTick = {
    fontSize: style.yAxisFontSize,
    fill: style.yAxisFontColor,
  };

  const yAxisWidth = estimateYAxisWidth(data, yKeys, style.yAxisFontSize);
  const xLayout = estimateXAxisLayout(data, style.xAxisFontSize);
  // Reserve left space so long Y labels (e.g. "100 M") are fully visible
  const margin = {
    top: 12,
    right: 24,
    left: Math.max(12, Math.ceil(yAxisWidth * 0.15)),
    bottom: Math.max(20, xLayout.height - 4),
  };

  const xAxisEl = (
    <XAxis
      dataKey="name"
      tick={xTick}
      interval={xLayout.interval}
      angle={xLayout.angle}
      textAnchor={xLayout.angle !== 0 ? "end" : "middle"}
      height={xLayout.height}
      tickMargin={8}
      minTickGap={8}
      tickFormatter={xLayout.tickFormatter}
    />
  );

  const yAxisEl = (
    <YAxis
      tick={yTick}
      tickFormatter={(n) => formatAxisNumber(n)}
      width={yAxisWidth}
      tickMargin={10}
      domain={[0, "auto"]}
      allowDataOverflow={false}
    />
  );

  const tooltip = (
    <Tooltip
      shared={false}
      filterNull
      cursor={{ strokeDasharray: "3 3" }}
      content={(props) => (
        <ChartTooltipContent
          active={props.active}
          payload={props.payload as TooltipPayloadItem[] | undefined}
          hoveredDataKey={hoveredDataKey}
          coordinateY={props.coordinate?.y}
          label={
            props.label != null
              ? formatXTickLabel(props.label as string | number)
              : undefined
          }
          style={style}
        />
      )}
    />
  );

  if (chartType === "pie") {
    const y = yKeys[0]!;
    const pieDataAll = data.map((d, i) => ({
      id: `pie-${i}-${String(d.name)}`,
      name: String(d.name),
      value: toNumber(d[y.id]),
      colorIndex: i,
    }));
    const pieLegendItems: LegendItem[] = pieDataAll.map((d) => ({
      id: d.id,
      label: d.name,
      color: resolveSeriesColor(style, d.colorIndex),
    }));
    const pieData = pieDataAll.filter((d) => !hiddenIds.has(d.id));

    return (
      <div
        className={cn("w-full rounded-lg", className)}
        style={{ backgroundColor: style.backgroundColor }}
      >
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer key={height} width="100%" height="100%">
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius="70%" label={false}>
                {pieData.map((d) => (
                  <Cell key={d.id} fill={resolveSeriesColor(style, d.colorIndex)} />
                ))}
              </Pie>
              {tooltip}
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="px-2 pb-2">
          <ChartSeriesLegend
            items={pieLegendItems}
            hiddenIds={hiddenIds}
            onToggle={toggleSeries}
            fontSize={style.xAxisFontSize}
            fontColor={style.xAxisFontColor}
          />
        </div>
      </div>
    );
  }

  const plot =
    chartType === "line" ? (
      <LineChart data={data} margin={margin} onMouseLeave={clearHover}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        {xAxisEl}
        {yAxisEl}
        {tooltip}
        {visibleYKeys.map((y) => {
          const colorIndex = yKeys.findIndex((k) => k.id === y.id);
          const color = resolveSeriesColor(style, colorIndex);
          return (
            <Line
              key={y.id}
              type="linear"
              dataKey={y.id}
              name={y.label}
              stroke={color}
              strokeWidth={2}
              dot={makeDotHandlers(y.id, color)}
              activeDot={makeActiveDotHandlers(y.id, color)}
            />
          );
        })}
      </LineChart>
    ) : chartType === "area" ? (
      <AreaChart data={data} margin={margin} onMouseLeave={clearHover}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        {xAxisEl}
        {yAxisEl}
        {tooltip}
        {visibleYKeys.map((y) => {
          const colorIndex = yKeys.findIndex((k) => k.id === y.id);
          const color = resolveSeriesColor(style, colorIndex);
          return (
            <Area
              key={y.id}
              type="linear"
              dataKey={y.id}
              name={y.label}
              stroke={color}
              fill={color}
              fillOpacity={0.25}
              dot={makeDotHandlers(y.id, color)}
              activeDot={makeActiveDotHandlers(y.id, color)}
            />
          );
        })}
      </AreaChart>
    ) : (
      <BarChart data={data} margin={margin} onMouseLeave={clearHover}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        {xAxisEl}
        {yAxisEl}
        {tooltip}
        {visibleYKeys.map((y) => {
          const colorIndex = yKeys.findIndex((k) => k.id === y.id);
          return (
            <Bar
              key={y.id}
              dataKey={y.id}
              name={y.label}
              fill={resolveSeriesColor(style, colorIndex)}
              radius={[4, 4, 0, 0]}
              onMouseOver={() => hoverSeries(y.id)}
              onMouseOut={clearHover}
            />
          );
        })}
      </BarChart>
    );

  return (
    <div
      className={cn("w-full rounded-lg px-1", className)}
      style={{ backgroundColor: style.backgroundColor }}
    >
      <div className="w-full overflow-visible" style={{ height }}>
        <ResponsiveContainer key={height} width="100%" height="100%">
          {plot}
        </ResponsiveContainer>
      </div>
      <div className="px-2 pb-2">
        <ChartSeriesLegend
          items={seriesLegendItems}
          hiddenIds={hiddenIds}
          onToggle={toggleSeries}
          fontSize={style.xAxisFontSize}
          fontColor={style.xAxisFontColor}
        />
      </div>
    </div>
  );
}
