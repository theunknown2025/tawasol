import { ArrowLeft, FileText, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Evenement } from "@/hooks/useEvenements";

interface EventPreviewProps {
  event: Evenement;
  onBack: () => void;
  onSubscribe: (evt: Evenement) => void;
}

export function EventPreview({ event, onBack, onSubscribe }: EventPreviewProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 p-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 gap-2 -ml-2"
        >
          <ArrowLeft size={18} />
          Retour à la liste
        </Button>

        <div className="max-w-4xl mx-auto">
          {event.bannerUrl && (
            <img
              src={event.bannerUrl}
              alt={event.titre}
              className="w-full aspect-[21/9] object-cover rounded-2xl mb-8"
            />
          )}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant={event.status === "published" ? "default" : "secondary"}
                className="text-xs"
              >
                {event.status === "published" ? "Publié" : "Brouillon"}
              </Badge>
              <span className="text-muted-foreground text-sm">
                Par {event.authorName} • {event.createdAt.toLocaleDateString("fr-FR")}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">{event.titre}</h1>
            <p className="text-muted-foreground whitespace-pre-wrap text-base leading-relaxed">
              {event.description || "—"}
            </p>
            <div className="flex flex-wrap gap-6 py-4 border-y border-border">
              {event.duree && (
                <div>
                  <span className="text-muted-foreground text-sm block">Durée</span>
                  <span className="font-medium">{event.duree}</span>
                </div>
              )}
              {event.deadlineInscription && (
                <div>
                  <span className="text-muted-foreground text-sm block">
                    Deadline d'inscription
                  </span>
                  <span className="font-medium">
                    {event.deadlineInscription.toLocaleString("fr-FR")}
                  </span>
                </div>
              )}
            </div>
            {event.liens.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Liens</h3>
                <ul className="space-y-2">
                  {event.liens.map((url, i) => (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {event.files.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Fichiers</h3>
                <ul className="space-y-2">
                  {event.files.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <FileText size={16} />
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {f.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="pt-8">
              <Button size="lg" onClick={() => onSubscribe(event)} className="gap-2">
                <UserPlus size={18} />
                S'inscrire
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
