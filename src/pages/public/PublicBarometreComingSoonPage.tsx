import { Link } from "react-router-dom";
import { BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import { PublicPageHero } from "@/components/public/PublicPageHero";

export default function PublicBarometreComingSoonPage() {
  return (
    <PublicShell>
      <PublicPageHero
        title="Baromètre"
        description="Les indicateurs et statistiques du baromètre REMESS seront bientôt disponibles sur cette page."
      />
      <main className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-12 text-center md:px-8 md:py-16">
        <div className="mb-8 self-start">
          <PublicBreadcrumbs
            items={[
              { label: "Accueil", to: "/" },
              { label: "Baromètre" },
            ]}
          />
        </div>

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BarChart2 className="h-8 w-8" aria-hidden />
        </div>
        <h2 className="mt-6 text-xl font-semibold text-foreground">Bientôt disponible</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
          Cette section est en cours de préparation. En attendant, vous pouvez consulter la
          cartographie des coopératives publiées.
        </p>
        <Button asChild className="mt-8" variant="outline">
          <Link to="/cartographie">Voir la cartographie</Link>
        </Button>
      </main>
    </PublicShell>
  );
}
