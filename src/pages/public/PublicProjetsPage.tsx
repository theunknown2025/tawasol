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
import { ProjetCard, ProjetRow } from "@/components/projets/ProjetCard";
import {
  fetchLpProjetsPublicSettings,
  fetchPublishedLpProjets,
  updateLpProjetsPublicSettings,
} from "@/lib/lpProjetsApi";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/supabase";
import type { LpProjetsDisplayMode } from "@/types/lpProjet";

const PAGE_SIZE_OPTIONS = [5, 15, 50] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];
const DEFAULT_PAGE_SIZE: PageSizeOption = 15;

function normalizePageSize(value: number | undefined): PageSizeOption {
  if (value === 5 || value === 15 || value === 50) return value;
  return DEFAULT_PAGE_SIZE;
}

export default function PublicProjetsPage() {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === ROLES.SUPER_ADMIN;
  const [page, setPage] = useState(0);
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
  const totalCount = allProjets.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages - 1);

  const pageItems = useMemo(() => {
    const start = currentPage * pageSize;
    return allProjets.slice(start, start + pageSize);
  }, [allProjets, currentPage, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [displayMode, pageSize]);

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

  const rangeStart = totalCount === 0 ? 0 : currentPage * pageSize + 1;
  const rangeEnd = Math.min((currentPage + 1) * pageSize, totalCount);

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <PublicBreadcrumbs items={[{ label: "Accueil", to: "/" }, { label: "Projets" }]} />
        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold tracking-tight">Nos projets</h1>
          <p className="mt-2 text-muted-foreground">
            Découvrez les projets portés par le REMESS et leurs réalisations.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : totalCount === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun projet publié pour le moment.</p>
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
                  size="sm"
                  className={cn("gap-1.5", displayMode === "card" && "bg-background shadow-sm")}
                  onClick={() => setDisplayMode("card")}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Cartes
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn("gap-1.5", displayMode === "rows" && "bg-background shadow-sm")}
                  onClick={() => setDisplayMode("rows")}
                >
                  <List className="h-4 w-4" />
                  Lignes
                </Button>
              </div>
            </div>

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

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {rangeStart}–{rangeEnd} sur {totalCount}
                </span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => setPageSize(Number(v) as PageSizeOption)}
                >
                  <SelectTrigger className="h-8 w-[4.5rem]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={currentPage <= 0}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-sm tabular-nums">
                  {currentPage + 1} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </PublicShell>
  );
}
