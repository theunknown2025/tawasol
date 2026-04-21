import { Linkedin, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DEFAULT_EQUIPE_REMESS_CONTENT,
  type EquipeMember,
  type EquipeRemessContent,
} from "../types";

function linkedinHref(url: string): string | null {
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

function TeamMemberCard({ member }: { member: EquipeMember }) {
  const hasPhoto = member.photoUrl.trim().length > 0;
  const name = member.fullName.trim() || "Nom à compléter";
  const role = member.functionTitle.trim() || "Fonction";
  const bio = member.bio.trim();
  const linkedin = linkedinHref(member.linkedinUrl);
  const mail = mailtoHref(member.email);

  return (
    <article
      tabIndex={0}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm outline-none",
        "transition-shadow duration-200 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden bg-muted">
        {hasPhoto ? (
          <img
            src={member.photoUrl}
            alt=""
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground"
            aria-hidden
          >
            <UserRound className="h-16 w-16 opacity-35" />
            <span className="px-4 text-center text-xs">Photo</span>
          </div>
        )}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/75 to-transparent p-4 pt-16",
            "opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100",
          )}
        >
          <p className="text-pretty text-sm leading-relaxed text-white md:text-[0.95rem]">
            {bio.length > 0 ? bio : "Biographie à venir."}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg font-semibold leading-tight tracking-tight text-foreground">{name}</h3>
        <p className="text-sm font-medium text-primary">{role}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {linkedin ? (
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-full" asChild>
              <a href={linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" aria-hidden />
              </a>
            </Button>
          ) : null}
          {mail ? (
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-full" asChild>
              <a href={mail} aria-label="Envoyer un e-mail">
                <Mail className="h-4 w-4" aria-hidden />
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

type EquipeRemessSectionProps = {
  content?: EquipeRemessContent;
  className?: string;
};

export function EquipeRemessSection({
  content = DEFAULT_EQUIPE_REMESS_CONTENT,
  className,
}: EquipeRemessSectionProps) {
  const members = content.members ?? [];

  return (
    <div className={cn("mx-auto max-w-6xl px-4 py-10 md:py-14 lg:px-8", className)}>
      {members.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          Aucun membre pour l’instant. Ajoutez l’équipe depuis l’éditeur « Équipe REMESS ».
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <li key={m.id}>
              <TeamMemberCard member={m} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
