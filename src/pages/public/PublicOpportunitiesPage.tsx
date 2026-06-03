import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import { OpportunityCard, OpportunityRow } from "@/components/opportunities/OpportunityCard";
import {
  fetchOpportunitiesPublicSettings,
  fetchPublishedOpportunities,
  updateOpportunitiesPublicSettings,
} from "@/lib/opportunitiesApi";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/supabase";
import type { OpportunitiesDisplayMode } from "@/types/opportunity";

const PAGE_SIZE_OPTIONS = [5, 15, 50] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];
const DEFAULT_PAGE_SIZE: PageSizeOption = 15;

function normalizePageSize(value: number | undefined): PageSizeOption {
  if (value === 5 || value === 15 || value === 50) return value;
  return DEFAULT_PAGE_SIZE;
}

export default function PublicOpportunitiesPage() {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === ROLES.SUPER_ADMIN;
  const [page, setPage] = useState(0);
  const [visitorDisplayMode, setVisitorDisplayMode] = useState<OpportunitiesDisplayMode | null>(null);
  const [visitorPageSize, setVisitorPageSize] = useState<PageSizeOption | null>(null);

  const { data: settings, refetch: refetchSettings } = useQuery({
    queryKey: ["opportunities-public-settings"],
    queryFn: fetchOpportunitiesPublicSettings,
  });

  const { data: allOpportunities = [], isLoading } = useQuery({
    queryKey: ["opportunities", "published"],
    queryFn: () => fetchPublishedOpportunities(),
    staleTime: 60_000,
  });

  const serverPageSize = normalizePageSize(settings?.pageSize);
  const pageSize = isSuperAdmin ? serverPageSize : (visitorPageSize ?? serverPageSize);
  const serverDisplayMode = settings?.displayMode ?? "card";
  const displayMode = isSuperAdmin ? serverDisplayMode : (visitorDisplayMode ?? serverDisplayMode);
  const totalCount = allOpportunities.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages - 1);

  const pageItems = useMemo(() => {
    const start = currentPage * pageSize;
    return allOpportunities.slice(start, start + pageSize);
  }, [allOpportunities, currentPage, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [displayMode, pageSize]);

  const handleSettingsChange = async (
    patch: Partial<{ displayMode: OpportunitiesDisplayMode; pageSize: PageSizeOption }>,
  ) => {
    if (!settings || !isSuperAdmin) return;
    await updateOpportunitiesPublicSettings({ ...settings, ...patch });
    void refetchSettings();
    setPage(0);
  };

  const setDisplayMode = (mode: OpportunitiesDisplayMode) => {
    if (isSuperAdmin && settings) {
      void handleSettingsChange({ displayMode: mode });
    } else {
      setVisitorDisplayMode(mode);
      setPage(0);
    }
  };

  const setPageSize = (size: PageSizeOption) => {
    if (isSuperAdmin && settings) {
      void handleSettingsChange({ pageSize: size });
    } else {
      setVisitorPageSize(size);
      setPage(0);
    }
  };

  const rangeStart = totalCount === 0 ? 0 : currentPage * pageSize + 1;
  const rangeEnd = Math.min((currentPage + 1) * pageSize, totalCount);

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <PublicBreadcrumbs items={[{ label: "Accueil", to: "/" }, { label: "Opportunités" }]} />
        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold tracking-tight">Nos opportunités</h1>
          <p className="mt-2 text-muted-foreground">
            Emplois, stages, AMI, TDR et formations du REMESS.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : totalCount === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune opportunité publiée pour le moment.</p>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
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
                    displayMode === "card" && "bg-background text-foreground shadow-sm",
                  )}
                  title="Affichage en cartes"
                  aria-pressed={displayMode === "card"}
                  onClick={() => setDisplayMode("card")}
                >
                  <LayoutGrid size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 shrink-0",
                    displayMode === "rows" && "bg-background text-foreground shadow-sm",
                  )}
                  title="Affichage en lignes"
                  aria-pressed={displayMode === "rows"}
                  onClick={() => setDisplayMode("rows")}
                >
                  <List size={16} />
                </Button>
              </div>
            </div>

            {displayMode === "card" ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pageItems.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {pageItems.map((opp) => (
                  <OpportunityRow key={opp.id} opportunity={opp} />
                ))}
              </div>
            )}

            <nav
              className="mt-8 flex justify-center border-t border-border pt-6"
              aria-label="Pagination des opportunités"
            >
              <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 px-2 py-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  disabled={currentPage === 0}
                  aria-label="Page précédente"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft size={18} />
                </Button>

                <span className="px-1 text-sm text-muted-foreground whitespace-nowrap">
                  {rangeStart}–{rangeEnd} sur {totalCount} opportunité{totalCount > 1 ? "s" : ""}
                </span>

                <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />

                <span className="px-1 text-sm text-muted-foreground whitespace-nowrap">
                  Page {currentPage + 1} / {totalPages}
                </span>

                <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />

                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => setPageSize(Number(v) as PageSizeOption)}
                >
                  <SelectTrigger className="h-8 w-[7.5rem] border-0 bg-transparent shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} par page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  disabled={currentPage >= totalPages - 1}
                  aria-label="Page suivante"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                >
                  <ChevronRight size={18} />
                </Button>
              </div>
            </nav>
          </>
        )}
      </div>
    </PublicShell>
  );
}
