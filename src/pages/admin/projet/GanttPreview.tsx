import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { ProjetPlanItem } from "@/types/projet";

export function GanttPreview({ items }: { items: ProjetPlanItem[] }) {
  const itemsWithDates = items.filter((i) => i.date_debut && i.date_fin);
  if (itemsWithDates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6">
        Ajoutez des lignes avec des dates (début et fin) pour voir l'aperçu Gantt.
      </p>
    );
  }

  const dates = itemsWithDates.flatMap((i) => [
    new Date(i.date_debut!).getTime(),
    new Date(i.date_fin!).getTime(),
  ]);
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  const totalMs = maxDate.getTime() - minDate.getTime() || 1;

  const getLeft = (d: string) =>
    ((new Date(d).getTime() - minDate.getTime()) / totalMs) * 100;
  const getWidth = (start: string, end: string) =>
    ((new Date(end).getTime() - new Date(start).getTime()) / totalMs) * 100;

  const colors = [
    "bg-primary",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
  ];

  const dayLabels: Date[] = [];
  const d = new Date(minDate);
  const endDate = new Date(maxDate);
  while (d <= endDate) {
    dayLabels.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  const DAY_COL_WIDTH = 20;
  const timelineWidth = dayLabels.length * DAY_COL_WIDTH;
  const gridCols = dayLabels.length;

  return (
    <div className="space-y-3 py-2 overflow-x-auto">
      <table className="w-max border-collapse table-fixed">
        <colgroup>
          <col className="w-auto" />
          <col className="w-auto" />
          <col className="w-auto" />
          <col style={{ width: timelineWidth }} />
        </colgroup>
        <thead>
          <tr>
            <th className="text-left text-xs font-medium text-muted-foreground pr-4 pb-2 whitespace-nowrap">Axe</th>
            <th className="text-left text-xs font-medium text-muted-foreground pr-4 pb-2 whitespace-nowrap">Tâche</th>
            <th className="text-left text-xs font-medium text-muted-foreground pr-4 pb-2 whitespace-nowrap">Responsable</th>
            <th className="text-left p-0 pb-2 border-l border-border" style={{ width: timelineWidth }}>
              <div
                className="grid box-border min-w-0"
                style={{
                  gridTemplateColumns: `repeat(${gridCols}, ${DAY_COL_WIDTH}px)`,
                  width: timelineWidth,
                }}
              >
                {dayLabels.map((day, i) => (
                  <div
                    key={i}
                    className="text-[10px] text-muted-foreground text-center"
                    title={format(day, "dd MMM yyyy", { locale: fr })}
                  >
                    {format(day, "d")}
                  </div>
                ))}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
        {itemsWithDates.map((item, idx) => (
          <tr key={idx}>
            <td className="text-sm pr-4 py-1 whitespace-nowrap align-middle" title={item.axe}>{item.axe || "—"}</td>
            <td className="text-sm pr-4 py-1 whitespace-nowrap align-middle" title={item.tache}>{item.tache || "—"}</td>
            <td className="text-sm pr-4 py-1 whitespace-nowrap align-middle" title={item.responsable_name}>{item.responsable_name || "—"}</td>
            <td className="p-0 py-1 align-middle border-l border-border" style={{ width: timelineWidth }}
            >
              <div
                className="h-7 bg-muted/50 rounded relative overflow-hidden box-border"
                style={{ width: timelineWidth }}
              >
                <div
                  className={cn(
                    "absolute h-full rounded top-0",
                    colors[idx % colors.length]
                  )}
                  style={{
                    left: `${getLeft(item.date_debut!)}%`,
                    width: `${Math.max(2, getWidth(item.date_debut!, item.date_fin!))}%`,
                  }}
                  title={`${format(new Date(item.date_debut!), "dd/MM/yy", { locale: fr })} - ${format(new Date(item.date_fin!), "dd/MM/yy", { locale: fr })}`}
                />
              </div>
            </td>
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
}
