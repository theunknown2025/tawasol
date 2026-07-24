import { ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const PUBLIC_PAGE_SIZE_OPTIONS = [3, 9, 30] as const;
export type PublicPageSize = (typeof PUBLIC_PAGE_SIZE_OPTIONS)[number];
export type PublicListViewMode = "cards" | "rows";

export function visiblePageIndices(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  const indices: number[] = [];
  const windowSize = 5;
  let start = Math.max(0, currentPage - Math.floor(windowSize / 2));
  let end = start + windowSize - 1;
  if (end > totalPages - 1) {
    end = totalPages - 1;
    start = Math.max(0, end - windowSize + 1);
  }
  for (let i = start; i <= end; i++) indices.push(i);
  return indices;
}

type PublicPagedListToolbarProps = {
  viewMode: PublicListViewMode;
  onViewModeChange: (mode: PublicListViewMode) => void;
  pageSize: PublicPageSize;
  onPageSizeChange: (size: PublicPageSize) => void;
};

export function PublicPagedListToolbar({
  viewMode,
  onViewModeChange,
  pageSize,
  onPageSizeChange,
}: PublicPagedListToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Par page
        </span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => {
            const n = Number(v) as PublicPageSize;
            if (n === 3 || n === 9 || n === 30) onPageSizeChange(n);
          }}
        >
          <SelectTrigger className="h-9 w-[7.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PUBLIC_PAGE_SIZE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} par page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5"
        role="group"
        aria-label="Mode d'affichage"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 shrink-0",
            viewMode === "cards" && "bg-background text-foreground shadow-sm",
          )}
          title="Affichage en cartes"
          aria-pressed={viewMode === "cards"}
          onClick={() => onViewModeChange("cards")}
        >
          <LayoutGrid size={16} aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 shrink-0",
            viewMode === "rows" && "bg-background text-foreground shadow-sm",
          )}
          title="Affichage en lignes"
          aria-pressed={viewMode === "rows"}
          onClick={() => onViewModeChange("rows")}
        >
          <List size={16} aria-hidden />
        </Button>
      </div>
    </div>
  );
}

type PublicPagedListPaginationProps = {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel: string;
  ariaLabel: string;
};

export function PublicPagedListPagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  itemLabel,
  ariaLabel,
}: PublicPagedListPaginationProps) {
  const safePage = Math.min(Math.max(0, page), Math.max(0, totalPages - 1));
  const start = totalCount === 0 ? 0 : safePage * pageSize + 1;
  const end = Math.min((safePage + 1) * pageSize, totalCount);

  return (
    <nav
      className="flex flex-col items-stretch gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between"
      aria-label={ariaLabel}
    >
      <p className="text-center text-sm text-muted-foreground sm:text-left">
        {totalCount === 0
          ? "—"
          : `${start}–${end} sur ${totalCount} ${itemLabel}${totalCount > 1 ? "s" : ""} · page ${safePage + 1} / ${totalPages}`}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => onPageChange(Math.max(0, safePage - 1))}
          disabled={safePage <= 0}
          aria-label="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Button>

        <div className="flex flex-wrap items-center justify-center gap-1">
          {visiblePageIndices(safePage, totalPages).map((idx) => (
            <Button
              key={idx}
              type="button"
              variant={idx === safePage ? "default" : "outline"}
              size="sm"
              className="h-9 min-w-9 px-2"
              onClick={() => onPageChange(idx)}
              aria-label={`Page ${idx + 1}`}
              aria-current={idx === safePage ? "page" : undefined}
            >
              {idx + 1}
            </Button>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => onPageChange(Math.min(totalPages - 1, safePage + 1))}
          disabled={safePage >= totalPages - 1}
          aria-label="Page suivante"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
