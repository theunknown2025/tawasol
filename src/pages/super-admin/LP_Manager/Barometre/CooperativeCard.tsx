import { Eye, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BarometreCooperative } from "./barometreCooperativesApi";

function presidentGenreLabel(g: BarometreCooperative["presidentGenre"]): string {
  if (g === "male") return "Male";
  if (g === "female") return "Female";
  return "—";
}

type Props = {
  coop: BarometreCooperative;
  onClose: () => void;
  className?: string;
};

export default function CooperativeCard({ coop, onClose, className }: Props) {
  const phones = coop.phones.length > 0 ? coop.phones : coop.tel ? [coop.tel] : [];

  const hasPresident =
    Boolean(coop.presidentGenre) ||
    Boolean(coop.presidentNomComplet.trim()) ||
    Boolean(coop.presidentEmail.trim()) ||
    Boolean(coop.presidentTel.trim());

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-[min(100%,320px)] flex-col overflow-hidden rounded-lg border border-border bg-popover text-left text-popover-foreground shadow-lg",
        className,
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex min-w-0 flex-1 items-start gap-1.5">
          <p className="min-w-0 flex-1 text-sm font-semibold leading-tight text-foreground">{coop.nom}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            asChild
          >
            <Link
              to={`/cartographie/cooperative/${coop.id}`}
              aria-label={`Voir la page de ${coop.nom}`}
              title="Voir la page"
            >
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {!coop.isPublished ? (
        <p className="border-b border-border bg-amber-500/10 px-3 py-1.5 text-[10px] font-medium text-amber-900 dark:text-amber-200">
          Brouillon (visible admin uniquement)
        </p>
      ) : null}
      <Accordion
        type="multiple"
        defaultValue={["cooperative", ...(hasPresident ? ["president"] : [])]}
        className="min-h-0 flex-1 overflow-y-auto px-0"
      >
        <AccordionItem value="cooperative" className="border-b border-border px-3">
          <AccordionTrigger className="py-2 text-xs font-medium hover:no-underline">
            Coopérative
          </AccordionTrigger>
          <AccordionContent className="pb-3 pt-0">
            {coop.activite ? (
              <p className="text-xs text-muted-foreground">{coop.activite}</p>
            ) : null}
            {coop.description ? (
              <div className="mt-3 border-t border-border pt-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                  {coop.description}
                </p>
              </div>
            ) : null}
            {phones.length > 0 ? (
              <div className="mt-2 space-y-1 text-xs">
                {phones.map((phone, i) => (
                  <p key={`${phone}-${i}`}>
                    <span className="text-muted-foreground">
                      {phones.length > 1 ? `Tél. ${i + 1} ` : "Tél. "}
                    </span>
                    {phone}
                  </p>
                ))}
              </div>
            ) : null}
            {coop.email ? (
              <p className="mt-1 break-all text-xs">
                <span className="text-muted-foreground">Email </span>
                <a className="text-primary underline" href={`mailto:${coop.email}`}>
                  {coop.email}
                </a>
              </p>
            ) : null}
            {coop.adresse ? (
              <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{coop.adresse}</p>
            ) : null}
            {coop.links.length > 0 ? (
              <ul className="mt-2 list-inside list-disc text-xs">
                {coop.links.map((l, i) => (
                  <li key={i}>
                    <a href={l.url} target="_blank" rel="noreferrer" className="break-all text-primary underline">
                      {l.label || l.url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            {coop.imageUrl ? (
              <img
                src={coop.imageUrl}
                alt=""
                className="mt-3 max-h-28 w-full rounded-md border border-border object-contain"
              />
            ) : null}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="president" className="border-b-0 px-3">
          <AccordionTrigger className="py-2 text-xs font-medium hover:no-underline">
            Président(e)
          </AccordionTrigger>
          <AccordionContent className="pb-3 pt-0">
            {hasPresident ? (
              <div className="space-y-2 text-xs">
                <p>
                  <span className="text-muted-foreground">Genre </span>
                  <span className="font-medium">{presidentGenreLabel(coop.presidentGenre)}</span>
                </p>
                {coop.presidentNomComplet ? (
                  <p>
                    <span className="text-muted-foreground">Nom complet </span>
                    <span className="font-medium text-foreground">{coop.presidentNomComplet}</span>
                  </p>
                ) : null}
                {coop.presidentEmail ? (
                  <p className="break-all">
                    <span className="text-muted-foreground">Email </span>
                    <a className="text-primary underline" href={`mailto:${coop.presidentEmail}`}>
                      {coop.presidentEmail}
                    </a>
                  </p>
                ) : null}
                {coop.presidentTel ? (
                  <p>
                    <span className="text-muted-foreground">Tél. </span>
                    {coop.presidentTel}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Non renseigné.</p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
