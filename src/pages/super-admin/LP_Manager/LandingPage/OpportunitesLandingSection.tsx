import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchPublishedOpportunities } from "@/lib/opportunitiesApi";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";

export function OpportunitesLandingSection() {
  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ["opportunities", "published", 3],
    queryFn: () => fetchPublishedOpportunities(3),
    staleTime: 60_000,
  });

  if (!isLoading && opportunities.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Nos opportunités
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Découvrez les dernières offres publiées par le REMESS.
            </p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/opportunites">
              Découvrir tous nos opportunités
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
