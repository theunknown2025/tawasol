import { useCallback, useEffect, useState } from "react";
import { Building2, Globe, Instagram, Linkedin, Mail, UserRound } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import {
  DEFAULT_NOS_MEMBRES_CONTENT,
  type NosMembresContent,
  type NosMembresEntry,
  type NosMembresOrgLink,
  type NosMembresOrgLinkKind,
} from "../types";

function externalHref(url: string): string | null {
  const t = url.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, "")}`;
}

function mailtoHref(email: string): string | null {
  const t = email.trim();
  if (!t) return null;
  return `mailto:${encodeURIComponent(t)}`;
}

function orgLinkHref(link: NosMembresOrgLink): string | null {
  return externalHref(link.url);
}

function OrgLinkIcon({ kind }: { kind: NosMembresOrgLinkKind }) {
  const cls = "h-4 w-4 shrink-0";
  if (kind === "linkedin") return <Linkedin className={cls} aria-hidden />;
  if (kind === "instagram") return <Instagram className={cls} aria-hidden />;
  return <Globe className={cls} aria-hidden />;
}

function orgLinkLabel(kind: NosMembresOrgLinkKind): string {
  if (kind === "linkedin") return "LinkedIn";
  if (kind === "instagram") return "Instagram";
  return "Site web";
}

function MembreCard({ entry }: { entry: NosMembresEntry }) {
  const org = entry.organization;
  const rep = entry.representative;
  const hasLogo = org.logoUrl.trim().length > 0;
  const orgName = org.name.trim() || "Organisation";
  const desc = org.shortDescription.trim();
  const repName = rep.fullName.trim() || "Nom du représentant";
  const repRole = rep.position.trim() || "Fonction";
  const repEmail = rep.email.trim();
  const repLi = externalHref(rep.linkedinUrl);
  const repMail = mailtoHref(repEmail);

  const orgLinks = org.links.filter((l) => orgLinkHref(l));

  return (
    <article className="relative overflow-visible rounded-2xl border border-border bg-card shadow-sm">
      <div className="relative px-5 pb-6 pt-14 md:px-8 md:pb-8 md:pt-16">
        <div className="absolute left-1/2 top-0 z-20 flex h-[4.5rem] w-[4.5rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-background shadow-md ring-1 ring-border/60 md:h-[5.25rem] md:w-[5.25rem]">
          {hasLogo ? (
            <img
              src={org.logoUrl}
              alt=""
              className="h-full w-full object-contain p-1.5"
              loading="lazy"
            />
          ) : (
            <Building2 className="h-10 w-10 text-muted-foreground/50" aria-hidden />
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:gap-10">
          <div className="space-y-3 border-border md:border-r md:pr-6 md:pt-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Organisation
            </p>
            <h3 className="text-lg font-semibold leading-tight text-foreground md:text-xl">
              {orgName}
            </h3>
            {orgLinks.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {orgLinks.map((link) => {
                  const href = orgLinkHref(link);
                  if (!href) return null;
                  return (
                    <li key={link.id}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <OrgLinkIcon kind={link.kind} />
                        {orgLinkLabel(link.kind)}
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun lien renseigné.</p>
            )}
          </div>

          <div className="space-y-3 md:pt-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Représentant
            </p>
            <h3 className="flex items-start gap-2 text-lg font-semibold leading-tight text-foreground md:text-xl">
              <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span>{repName}</span>
            </h3>
            <p className="text-sm font-medium text-primary">{repRole}</p>
            <div className="space-y-2 pt-1 text-sm">
              {repMail && repEmail ? (
                <a
                  href={repMail}
                  className="inline-flex items-center gap-2 text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="break-all">{repEmail}</span>
                </a>
              ) : (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" aria-hidden />
                  E-mail à compléter
                </p>
              )}
              {repLi ? (
                <a
                  href={repLi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Linkedin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  Profil LinkedIn
                </a>
              ) : (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Linkedin className="h-4 w-4 shrink-0" aria-hidden />
                  LinkedIn à compléter
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-border/70 pt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Description
          </p>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground md:text-[0.95rem]">
            {desc.length > 0 ? desc : "Description à compléter dans l’éditeur."}
          </p>
        </div>
      </div>
    </article>
  );
}

type NosMembresSectionProps = {
  content?: NosMembresContent;
  className?: string;
};

export function NosMembresSection({
  content = DEFAULT_NOS_MEMBRES_CONTENT,
  className,
}: NosMembresSectionProps) {
  const subtitle = content.subtitle?.trim() ?? "";
  const entries = content.entries ?? [];
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback((embla: CarouselApi) => {
    if (!embla) return;
    setSelectedIndex(embla.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;
    setScrollSnaps(api.scrollSnapList());
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect]);

  return (
    <div className={cn("mx-auto max-w-6xl px-4 pb-8 pt-1 md:pb-10 md:pt-2 lg:px-8", className)}>
      {subtitle ? (
        <p className="mx-auto mb-4 max-w-3xl text-center text-sm leading-snug text-muted-foreground md:mb-5 md:text-base md:leading-relaxed">
          {subtitle}
        </p>
      ) : null}
      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          Aucun membre REMESS pour l’instant. Ajoutez des fiches depuis l’éditeur « Nos membres ».
        </p>
      ) : (
        <div className="space-y-5">
          <Carousel
            key={entries.map((e) => e.id).join("|")}
            setApi={setApi}
            opts={{
              align: "start",
              slidesToScroll: 1,
              loop: false,
              containScroll: "trimSnaps",
            }}
            className="relative w-full px-11 sm:px-14 md:px-16"
          >
            <CarouselContent className="-ml-3 sm:-ml-4">
              {entries.map((e) => (
                <CarouselItem key={e.id} className="basis-full pl-3 sm:pl-4">
                  <div className="pt-12 sm:pt-14">
                    <MembreCard entry={e} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious
              className="left-0 h-9 w-9 border-border bg-background/95 shadow-sm disabled:opacity-40"
              aria-label="Fiche précédente"
            />
            <CarouselNext
              className="right-0 h-9 w-9 border-border bg-background/95 shadow-sm disabled:opacity-40"
              aria-label="Fiche suivante"
            />
          </Carousel>

          {scrollSnaps.length > 1 ? (
            <div
              className="flex flex-wrap items-center justify-center gap-2"
              role="tablist"
              aria-label="Navigation des membres"
            >
              {scrollSnaps.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  aria-selected={index === selectedIndex}
                  aria-label={`Aller à la fiche ${index + 1}`}
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-200",
                    index === selectedIndex
                      ? "w-6 bg-primary"
                      : "w-2.5 bg-muted-foreground/35 hover:bg-muted-foreground/55",
                  )}
                  onClick={() => api?.scrollTo(index)}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
