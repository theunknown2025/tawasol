import { useCallback, useEffect, useState } from "react";
import { Linkedin, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DEFAULT_EQUIPE_REMESS_CONTENT,
  type EquipeMember,
  type EquipeRemessContent,
  type EquipeSkill,
} from "../types";
import { linkedinHref, mailtoHref } from "./equipe/equipePreview";

/** Nombre de petites cartes visibles / défilées sous le profil principal. */
const CONSEIL_STRIP_VISIBLE = 4;

type EquipeRemessSectionProps = {
  content?: EquipeRemessContent;
  className?: string;
};

export function EquipeRemessSection({
  content = DEFAULT_EQUIPE_REMESS_CONTENT,
  className,
}: EquipeRemessSectionProps) {
  const members = content.members ?? [];
  const [featuredId, setFeaturedId] = useState<string | null>(members[0]?.id ?? null);
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (members.length === 0) {
      setFeaturedId(null);
      return;
    }
    setFeaturedId((current) => {
      if (current && members.some((m) => m.id === current)) return current;
      return members[0]!.id;
    });
  }, [members]);

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

  const featured = members.find((m) => m.id === featuredId) ?? members[0] ?? null;
  const others = members.filter((m) => m.id !== featured?.id);

  return (
    <div className={cn("mx-auto max-w-6xl px-4 pb-8 pt-1 md:pb-10 md:pt-2 lg:px-8", className)}>
      {members.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          Aucun membre pour l’instant. Ajoutez le conseil depuis l’éditeur « Conseil Administrative
          REMESS ».
        </p>
      ) : featured ? (
        <div className="space-y-8 md:space-y-10">
          <FeaturedMember member={featured} />

          {others.length > 0 ? (
            <div className="space-y-4">
              <Carousel
                key={others.map((m) => m.id).join("|")}
                setApi={setApi}
                opts={{
                  align: "start",
                  slidesToScroll: CONSEIL_STRIP_VISIBLE,
                  loop: false,
                  containScroll: "trimSnaps",
                }}
                className="relative w-full px-11 sm:px-14"
              >
                <CarouselContent className="-ml-3 sm:-ml-4">
                  {others.map((m) => (
                    <CarouselItem
                      key={m.id}
                      className="basis-1/2 pl-3 sm:basis-1/3 sm:pl-4 lg:basis-1/4"
                    >
                      <ConseilSmallCard member={m} onSelect={() => setFeaturedId(m.id)} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious
                  className="left-0 h-9 w-9 border-border bg-background/95 shadow-sm hover:bg-background disabled:opacity-40"
                  aria-label="Membres précédents"
                />
                <CarouselNext
                  className="right-0 h-9 w-9 border-border bg-background/95 shadow-sm hover:bg-background disabled:opacity-40"
                  aria-label="Membres suivants"
                />
              </Carousel>

              {scrollSnaps.length > 1 ? (
                <div
                  className="flex flex-wrap items-center justify-center gap-2"
                  role="tablist"
                  aria-label="Navigation du conseil administratif"
                >
                  {scrollSnaps.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      role="tab"
                      aria-selected={index === selectedIndex}
                      aria-label={`Aller à la vue ${index + 1}`}
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
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function FeaturedMember({ member }: { member: EquipeMember }) {
  const name = member.fullName.trim() || "Nom à compléter";
  const role = member.functionTitle.trim() || "Fonction";
  const bio = member.bio.trim();
  const hasPhoto = member.photoUrl.trim().length > 0;
  const linkedin = linkedinHref(member.linkedinUrl);
  const mail = mailtoHref(member.email);
  const skills = (member.skills ?? []).slice(0, 5);

  return (
    <article className="overflow-hidden bg-card">
      <div className="flex flex-col lg:flex-row">
        <div className="relative aspect-square w-full shrink-0 bg-muted lg:w-[30%]">
          {hasPhoto ? (
            <img
              src={member.photoUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
          ) : (
            <div
              className="flex h-full min-h-[14rem] w-full flex-col items-center justify-center gap-2 text-muted-foreground"
              aria-hidden
            >
              <UserRound className="h-16 w-16 opacity-35" />
              <span className="text-xs">Photo</span>
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-6 lg:p-7",
            skills.length > 0 ? "lg:w-[45%] lg:flex-none" : "lg:w-[70%]",
          )}
        >
          <header className="space-y-3 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                {name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {linkedin ? (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-none border-border"
                    asChild
                  >
                    <a href={linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                      <Linkedin className="h-4 w-4" aria-hidden />
                    </a>
                  </Button>
                ) : null}
                {mail ? (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-none border-border"
                    asChild
                  >
                    <a href={mail} aria-label="Envoyer un e-mail">
                      <Mail className="h-4 w-4" aria-hidden />
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
            <p className="text-sm font-medium text-primary md:text-base">{role}</p>
          </header>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground md:text-[0.95rem]">
            {bio.length > 0 ? bio : "Aucune biographie pour ce membre."}
          </p>
        </div>

        {skills.length > 0 ? (
          <div className="flex w-full flex-col justify-center gap-4 bg-muted/20 p-5 sm:p-6 lg:w-[35%] lg:p-7">
            <p className="pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Compétences
            </p>
            <ul className="space-y-3" role="list">
              {skills.map((skill) => (
                <SkillBanner key={skill.name} skill={skill} />
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function SkillBanner({ skill }: { skill: EquipeSkill }) {
  const pct = Math.max(0, Math.min(100, Math.round(skill.percentage)));
  return (
    <li className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-sm font-medium text-foreground">{skill.name}</span>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
          {pct}&nbsp;%
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-none bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${skill.name} : ${pct} %`}
      >
        <div
          className="h-full rounded-none bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

function ConseilSmallCard({
  member,
  onSelect,
}: {
  member: EquipeMember;
  onSelect: () => void;
}) {
  const name = member.fullName.trim() || "Nom";
  const role = member.functionTitle.trim() || "Fonction";
  const hasPhoto = member.photoUrl.trim().length > 0;
  const linkedin = linkedinHref(member.linkedinUrl);
  const mail = mailtoHref(member.email);

  return (
    <article className="flex h-full flex-col overflow-hidden bg-card transition hover:bg-muted/30">
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Afficher ${name} en profil principal`}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {hasPhoto ? (
            <img
              src={member.photoUrl}
              alt=""
              className="h-full w-full object-cover object-top"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground" aria-hidden>
              <UserRound className="h-10 w-10 opacity-35" />
            </div>
          )}
        </div>
        <div className="space-y-0.5 p-3">
          <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{name}</h4>
          <p className="line-clamp-2 text-xs font-medium text-primary">{role}</p>
        </div>
      </button>
      {(linkedin || mail) && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2">
          {linkedin ? (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" asChild>
              <a href={linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Linkedin className="h-3.5 w-3.5" aria-hidden />
              </a>
            </Button>
          ) : null}
          {mail ? (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" asChild>
              <a href={mail} aria-label="Envoyer un e-mail">
                <Mail className="h-3.5 w-3.5" aria-hidden />
              </a>
            </Button>
          ) : null}
        </div>
      )}
    </article>
  );
}
