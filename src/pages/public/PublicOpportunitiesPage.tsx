import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import {
  PublicPagedListPagination,
  PublicPagedListToolbar,
  type PublicListViewMode,
} from "@/components/public/PublicPagedListControls";
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

function toViewMode(mode: OpportunitiesDisplayMode): PublicListViewMode {
  return mode === "rows" ? "rows" : "cards";
}

function fromViewMode(mode: PublicListViewMode): OpportunitiesDisplayMode {
  return mode === "rows" ? "rows" : "card";
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
  const viewMode = toViewMode(displayMode);
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

  return (
    <PublicShell>
      <PublicPageHero
        title="Nos opportunités"
        description="Emplois, stages, AMI, TDR et formations du REMESS."
      />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:py-10 lg:px-8">
        <PublicBreadcrumbs items={[{ label: "Accueil", to: "/" }, { label: "Opportunités" }]} />

        {isLoading ? (
          <div className="flex justify-center py-20 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
          </div>
        ) : totalCount === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
            Aucune opportunité publiée pour le moment.
          </p>
        ) : (
          <>
            <div className="flex justify-end">
              <PublicPagedListToolbar
                viewMode={viewMode}
                onViewModeChange={(mode) => setDisplayMode(fromViewMode(mode))}
                pageSize={pageSize}
                onPageSizeChange={(n) => setPageSize(normalizePageSize(n))}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
              />
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

            <PublicPagedListPagination
              page={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
              itemLabel="opportunité"
              ariaLabel="Pagination des opportunités"
            />
          </>
        )}
      </main>
    </PublicShell>
  );
}
