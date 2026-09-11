import { Linkedin, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EquipeMember } from "../../types";
import { linkedinHref, mailtoHref, previewFirstLetters } from "./equipePreview";

type EquipeMemberCardProps = {
  member: EquipeMember;
  onOpenDetail: (member: EquipeMember) => void;
};

export function EquipeMemberCard({ member, onOpenDetail }: EquipeMemberCardProps) {
  const hasPhoto = member.photoUrl.trim().length > 0;
  const name = member.fullName.trim() || "Nom à compléter";
  const role = member.functionTitle.trim() || "Fonction";
  const bio = member.bio.trim();
  const { preview } = previewFirstLetters(bio, 15);
  const hoverBio = preview || "Biographie à venir.";
  const linkedin = linkedinHref(member.linkedinUrl);
  const mail = mailtoHref(member.email);

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm outline-none",
        "transition-shadow duration-200 hover:shadow-lg",
      )}
    >
      <button
        type="button"
        onClick={() => onOpenDetail(member)}
        className={cn(
          "relative aspect-[3/4] w-full shrink-0 overflow-hidden bg-muted text-left",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
        aria-label={`Voir le profil de ${name}`}
      >
        {hasPhoto ? (
          <img
            src={member.photoUrl}
            alt=""
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
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
            "pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 pt-16",
            "opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100",
          )}
        >
          <p className="text-pretty text-sm leading-relaxed text-white md:text-[0.95rem]">{hoverBio}</p>
        </div>
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <button
          type="button"
          onClick={() => onOpenDetail(member)}
          className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <h3 className="text-lg font-semibold leading-tight tracking-tight text-foreground">{name}</h3>
          <p className="mt-1 text-sm font-medium text-primary">{role}</p>
        </button>
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
