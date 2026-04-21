import { Badge } from "@/components/ui/badge";
import type { PmoDeadlineTone } from "@/lib/pmoUtils";
import { PMO_TONE_LABELS } from "@/lib/pmoUtils";

export function PmoDeadlineBadge({ tone }: { tone: PmoDeadlineTone }) {
  if (tone === "none") {
    return (
      <Badge variant="secondary" className="font-normal">
        Sans échéance
      </Badge>
    );
  }
  const variant =
    tone === "green"
      ? "default"
      : tone === "red"
        ? "destructive"
        : "outline";
  const className =
    tone === "green"
      ? "bg-emerald-600 hover:bg-emerald-600/90 border-emerald-600"
      : tone === "amber"
        ? "border-amber-500 text-amber-800 dark:text-amber-200 bg-amber-500/15"
        : tone === "yellow"
          ? "border-yellow-500 text-yellow-900 dark:text-yellow-100 bg-yellow-400/20"
          : "";
  return (
    <Badge variant={variant} className={`font-normal ${className}`}>
      {PMO_TONE_LABELS[tone]}
    </Badge>
  );
}
