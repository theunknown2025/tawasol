import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import {
  PublicPagedListPagination,
  PublicPagedListToolbar,
  type PublicListViewMode,
} from "@/components/public/PublicPagedListControls";
import { ProjetCard, ProjetRow } from "@/components/projets/ProjetCard";
import {
  fetchLpProjetsPublicSettings,
  fetchPublishedLpProjets,
  updateLpProjetsPublicSettings,
} from "@/lib/lpProjetsApi";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/supabase";
import type { LpProjet, LpProjetsDisplayMode } from "@/types/lpProjet";

function filterProjetsByName(projets: LpProjet[], search: string): LpProjet[] {
  const q = search.trim().toLowerCase();
  if (!q) return projets;
  return projets.filter((p) => p.title.toLowerCase().includes(q));
}

const PAGE_SIZE_OPTIONS = [6, 18, 36] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];
const DEFAULT_PAGE_SIZE: PageSizeOption = 18;

function normalizePageSize(value: number | undefined): PageSizeOption {
  if (value === 6 || value === 18 || value === 36) return value;
  return DEFAULT_PAGE_SIZE;
}

function toViewMode(mode: LpProjetsDisplayMode): PublicListViewMode {
  return mode === "rows" ? "rows" : "cards";
}

function fromViewMode(mode: PublicListViewMode): LpProjetsDisplayMode {
  return mode === "rows" ? "rows" : "card";
}

export default function PublicProjetsPage() {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === ROLES.SUPER_ADMIN;
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [visitorDisplayMode, setVisitorDisplayMode] = useState<LpProjetsDisplayMode | null>(null);
  const [visitorPageSize, setVisitorPageSize] = useState<PageSizeOption | null>(null);

  const { data: settings, refetch: refetchSettings } = useQuery({
    queryKey: ["lp-projets-public-settings"],
    queryFn: fetchLpProjetsPublicSettings,
  });

  const { data: allProjets = [], isLoading } = useQuery({
    queryKey: ["lp-projets", "published"],
    queryFn: () => fetchPublishedLpProjets(),
    staleTime: 60_000,
  });

  const serverPageSize = normalizePageSize(settings?.pageSize);
  const pageSize = isSuperAdmin ? serverPageSize : (visitorPageSize ?? serverPageSize);
  const serverDisplayMode = settings?.displayMode ?? "card";
  const displayMode = isSuperAdmin ? serverDisplayMode : (visitorDisplayMode ?? serverDisplayMode);
  const viewMode = toViewMode(displayMode);

  const filteredProjets = useMemo(
    () => filterProjetsByName(allProjets, search),
    [allProjets, search],
  );
  const totalCount = filteredProjets.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages - 1);

  const pageItems = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredProjets.slice(start, start + pageSize);
  }, [filteredProjets, currentPage, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [displayMode, pageSize, search]);

  const handleSettingsChange = async (
    patch: Partial<{ displayMode: LpProjetsDisplayMode; pageSize: PageSizeOption }>,
  ) => {
    if (!settings || !isSuperAdmin) return;
    await updateLpProjetsPublicSettings({ ...settings, ...patch });
    void refetchSettings();
    setPage(0);
  };

  const setDisplayMode = (mode: LpProjetsDisplayMode) => {
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
        title="Nos projets"
        description="Découvrez les projets portés par le REMESS et leurs réalisations."
      />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:py-10 lg:px-8">
        <PublicBreadcrumbs items={[{ label: "Accueil", to: "/" }, { label: "Projets" }]} />

        {isLoading ? (
          <div className="flex justify-center py-20 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
          </div>
        ) : allProjets.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
            Aucun projet publié pour le moment.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative min-w-[14rem] max-w-xl flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par nom…"
                  aria-label="Rechercher un projet par nom"
                  autoComplete="off"
                />
              </div>
              <PublicPagedListToolbar
                viewMode={viewMode}
                onViewModeChange={(mode) => setDisplayMode(fromViewMode(mode))}
                pageSize={pageSize}
                onPageSizeChange={(n) => setPageSize(normalizePageSize(n))}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
              />
            </div>

            {totalCount === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
                Aucun projet ne correspond à votre recherche.
              </p>
            ) : (
              <>
                {displayMode === "card" ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {pageItems.map((projet) => (
                      <ProjetCard key={projet.id} projet={projet} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pageItems.map((projet) => (
                      <ProjetRow key={projet.id} projet={projet} />
                    ))}
                  </div>
                )}

                <PublicPagedListPagination
                  page={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  itemLabel="projet"
                  ariaLabel="Pagination des projets"
                />
              </>
            )}
          </>
        )}
      </main>
    </PublicShell>
  );
}
