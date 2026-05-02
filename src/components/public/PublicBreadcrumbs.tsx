import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export type PublicBreadcrumbItem = { label: string; to?: string };

export function PublicBreadcrumbs({ items }: { items: PublicBreadcrumbItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Fil d’Ariane" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1">
            {i > 0 ? (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            ) : null}
            {item.to ? (
              <Link to={item.to} className="transition-colors hover:text-primary">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
