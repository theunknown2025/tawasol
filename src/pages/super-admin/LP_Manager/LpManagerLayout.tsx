import { Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import RoleGuard from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import LpManagerSidebar from "./LpManagerSidebar";
import { LpLandingContentProvider, useLpLandingContent } from "./LpLandingContentContext";

function LpManagerLayoutBody() {
  const { lpLandingReady, lpLandingLoadError, lpLandingSaving, saveLpLandingToDb } =
    useLpLandingContent();

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {!lpLandingReady && (
        <div className="border-b border-border bg-muted/50 px-4 py-2 text-center text-sm text-muted-foreground">
          Chargement du contenu landing depuis la base…
        </div>
      )}
      {lpLandingReady && lpLandingLoadError && (
        <div className="border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
          Avertissement chargement : {lpLandingLoadError} — les valeurs par défaut sont utilisées.
        </div>
      )}
      {lpLandingReady && (
        <div className="flex flex-wrap items-center justify-end gap-3 border-b border-border bg-card/80 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <Button
            type="button"
            size="sm"
            disabled={lpLandingSaving}
            className="min-w-[11rem] gap-2"
            onClick={() => void saveLpLandingToDb()}
          >
            {lpLandingSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Enregistrement…
              </>
            ) : (
              "Enregistrer Modifications"
            )}
          </Button>
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        <LpManagerSidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/** Shell super admin dédié à l’éditeur Remess : pas de barre latérale ProManager. */
export default function LpManagerLayout() {
  return (
    <RoleGuard>
      <LpLandingContentProvider>
        <LpManagerLayoutBody />
      </LpLandingContentProvider>
    </RoleGuard>
  );
}
