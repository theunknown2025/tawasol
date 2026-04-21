import { Building2, Globe, Instagram, Linkedin, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
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
  const cls = "h-4 w-4";
  if (kind === "linkedin") return <Linkedin className={cls} aria-hidden />;
  if (kind === "instagram") return <Instagram className={cls} aria-hidden />;
  return <Globe className={cls} aria-hidden />;
}

function orgLinkAriaLabel(kind: NosMembresOrgLinkKind): string {
  if (kind === "linkedin") return "LinkedIn de l’organisation";
  if (kind === "instagram") return "Instagram de l’organisation";
  return "Site web de l’organisation";
}

function MembreCard({ entry }: { entry: NosMembresEntry }) {
  const org = entry.organization;
  const rep = entry.representative;
  const hasLogo = org.logoUrl.trim().length > 0;
  const orgName = org.name.trim() || "Organisation";
  const desc = org.shortDescription.trim();
  const repName = rep.fullName.trim() || "Nom du représentant";
  const repRole = rep.position.trim() || "Fonction";
  const repLi = externalHref(rep.linkedinUrl);
  const repMail = mailtoHref(rep.email);

  const orgLinks = org.links.filter((l) => orgLinkHref(l));

  return (
    <article
      tabIndex={0}
      className={cn(
        /* overflow-visible so the logo (half above the card) is not clipped */
        "group relative overflow-visible rounded-2xl border border-border bg-card shadow-sm outline-none",
        "transition-shadow duration-200 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      <div className="relative px-5 pb-6 pt-14 md:px-8 md:pt-16">
        <div
          className={cn(
            "absolute left-1/2 top-0 z-20 flex h-[4.5rem] w-[4.5rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-background shadow-md ring-1 ring-border/60 md:h-[5.25rem] md:w-[5.25rem]",
          )}
        >
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

        <div className="relative min-h-[10rem] overflow-hidden rounded-xl">
          <div
            className={cn(
              "pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4 text-center opacity-0 transition-opacity duration-300",
              "bg-neutral-950/85 backdrop-blur-[2px]",
              "group-hover:opacity-100 group-focus-within:opacity-100",
            )}
          >
            <p className="text-pretty text-sm font-medium leading-relaxed text-white md:text-[0.95rem]">
              {desc.length > 0 ? desc : "Description courte à compléter dans l’éditeur."}
            </p>
          </div>

          <div className="relative z-[1] grid gap-6 md:grid-cols-2 md:gap-10">
            <div className="space-y-3 border-border md:border-r md:pr-6 md:pt-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Organisation
              </p>
              <h3 className="text-lg font-semibold leading-tight text-foreground md:text-xl">
                {orgName}
              </h3>
              <div className="flex flex-wrap gap-2">
                {orgLinks.map((link) => {
                  const href = orgLinkHref(link);
                  if (!href) return null;
                  return (
                    <Button
                      key={link.id}
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-full"
                      asChild
                    >
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={orgLinkAriaLabel(link.kind)}
                      >
                        <OrgLinkIcon kind={link.kind} />
                      </a>
                    </Button>
                  );
                })}
              </div>
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
              <div className="flex flex-wrap gap-2 pt-1">
                {repLi ? (
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-full" asChild>
                    <a href={repLi} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                      <Linkedin className="h-4 w-4" aria-hidden />
                    </a>
                  </Button>
                ) : null}
                {repMail ? (
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-full" asChild>
                    <a href={repMail} aria-label="Envoyer un e-mail">
                      <Mail className="h-4 w-4" aria-hidden />
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
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
        <Carousel
          key={entries.map((e) => e.id).join("|")}
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
              <CarouselItem
                key={e.id}
                className="basis-full pl-3 sm:basis-1/2 sm:pl-4"
              >
                <div className="pt-12 sm:pt-14">
                  <MembreCard entry={e} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious
            className="left-0 h-9 w-9 border-border bg-background/95 shadow-sm hover:bg-background disabled:opacity-40"
            aria-label="Fiche précédente"
          />
          <CarouselNext
            className="right-0 h-9 w-9 border-border bg-background/95 shadow-sm hover:bg-background disabled:opacity-40"
            aria-label="Fiche suivante"
          />
        </Carousel>
      )}
    </div>
  );
}
