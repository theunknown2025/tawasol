import { CalendarDays, FileText, ImageIcon, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectedFile } from "./types";
import { formatEventDateRange, formatFrDate } from "./eventDates";

export type AdminEventPreviewPanelProps = {
  titre: string;
  description: string;
  bannerPreviewUrl: string | null;
  eventDateStart: string | null;
  eventDateEnd: string | null;
  deadlineInscription: string | null;
  liens: string[];
  existingFileNames?: string[];
  newFiles: SelectedFile[];
  registrationFormTitle: string | null;
  className?: string;
};

export function AdminEventPreviewPanel({
  titre,
  description,
  bannerPreviewUrl,
  eventDateStart,
  eventDateEnd,
  deadlineInscription,
  liens,
  existingFileNames = [],
  newFiles,
  registrationFormTitle,
  className,
}: AdminEventPreviewPanelProps) {
  const validLiens = liens.filter((l) => l.trim());

  return (
    <aside
      className={cn(
        "rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-6",
        className,
      )}
    >
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Aperçu
      </p>
      <div className="space-y-4">
        {bannerPreviewUrl ? (
          <div className="overflow-hidden rounded-xl border border-border">
            <img
              src={bannerPreviewUrl}
              alt=""
              className="aspect-[21/9] w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-[21/9] items-center justify-center rounded-xl border border-dashed border-border bg-muted/40">
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImageIcon className="h-8 w-8 opacity-50" />
              <span className="text-xs">Aucune bannière</span>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold leading-snug text-foreground">
            {titre.trim() || "Titre de l’événement"}
          </h3>
        </div>

        <div className="flex flex-wrap gap-3 border-y border-border py-3 text-sm">
          <div className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <span className="text-xs text-muted-foreground">Période</span>
              <p className="font-medium">{formatEventDateRange(eventDateStart, eventDateEnd)}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <span className="text-xs text-muted-foreground">Inscription avant</span>
              <p className="font-medium">{deadlineInscription ? formatFrDate(deadlineInscription) : "—"}</p>
            </div>
          </div>
        </div>

        <div>
          <span className="text-xs text-muted-foreground">Description</span>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {description.trim() || "—"}
          </p>
        </div>

        {validLiens.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground">Liens</span>
            <ul className="mt-2 space-y-1.5">
              {validLiens.map((url, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="break-all text-primary">{url}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <span className="text-xs text-muted-foreground">Formulaire d’inscription</span>
          <p className="mt-1 text-sm font-medium">{registrationFormTitle ?? "Aucun"}</p>
        </div>

        {(existingFileNames.length > 0 || newFiles.length > 0) && (
          <div>
            <span className="text-xs text-muted-foreground">Fichiers joints</span>
            <ul className="mt-2 space-y-1">
              {existingFileNames.map((name) => (
                <li key={`ex-${name}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{name}</span>
                  <span className="text-xs">(enregistré)</span>
                </li>
              ))}
              {newFiles.map((f, i) => (
                <li key={`nw-${i}`} className="flex items-center gap-2 text-sm">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{f.name}</span>
                  <span className="text-xs text-muted-foreground">(nouveau)</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
