import { X } from "lucide-react";

const TAG_STYLES = [
  { shape: "rounded-full", color: "bg-primary/15 text-primary border-primary/30" },
  { shape: "rounded-lg", color: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  { shape: "rounded-md", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  { shape: "rounded", color: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  { shape: "rounded-2xl", color: "bg-violet-500/15 text-violet-600 border-violet-500/30" },
  { shape: "rounded-tl-full rounded-br-full", color: "bg-rose-500/15 text-rose-600 border-rose-500/30" },
  { shape: "rounded-bl-full rounded-tr-full", color: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30" },
] as const;

function getTagStyle(tag: string) {
  const hash = tag.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return TAG_STYLES[Math.abs(hash) % TAG_STYLES.length];
}

export function HashtagBadge({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  const style = getTagStyle(tag);
  const displayTag = tag.startsWith("#") ? tag : `#${tag}`;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border ${style.shape} ${style.color}`}
    >
      {displayTag}
      {onRemove && (
        <button type="button" onClick={onRemove} className="hover:opacity-70" aria-label="Retirer le tag">
          <X size={12} />
        </button>
      )}
    </span>
  );
}
