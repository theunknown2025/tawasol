import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NosPartenaireEntry } from "../../types";
import { PartenaireLayout } from "./PartenaireLayout";
import { previewFirstWords } from "./partenairePreview";

type PartenaireCardProps = {
  entry: NosPartenaireEntry;
  onOpenDetail: (entry: NosPartenaireEntry) => void;
};

export function PartenaireCard({ entry, onOpenDetail }: PartenaireCardProps) {
  const nom = entry.nom.trim() || "Partenaire";
  const desc = entry.description.trim();
  const { preview } = previewFirstWords(desc, 10);
  const previewText = preview || "Description à compléter dans l’éditeur.";

  return (
    <article className="h-full transition-shadow duration-200 hover:shadow-md">
      <PartenaireLayout
        nom={nom}
        logoUrl={entry.logoUrl}
        description={<p>{previewText}</p>}
        footer={
          <button
            type="button"
            onClick={() => onOpenDetail(entry)}
            className={cn(
              "inline-flex items-center gap-1.5 self-start text-sm font-semibold text-primary",
              "transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
            aria-label={`Plus d’informations sur ${nom}`}
          >
            Plus
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        }
      />
    </article>
  );
}
