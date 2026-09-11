import { Linkedin, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { EquipeMember } from "../../types";
import { linkedinHref, mailtoHref } from "./equipePreview";

type EquipeMemberDetailModalProps = {
  member: EquipeMember | null;
  onClose: () => void;
};

export function EquipeMemberDetailModal({ member, onClose }: EquipeMemberDetailModalProps) {
  const name = member?.fullName.trim() || "Membre";
  const role = member?.functionTitle.trim() || "";
  const bio = member?.bio.trim() ?? "";
  const hasPhoto = Boolean(member?.photoUrl.trim());
  const linkedin = member ? linkedinHref(member.linkedinUrl) : null;
  const mail = member ? mailtoHref(member.email) : null;

  return (
    <Dialog open={member !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "max-h-[90vh] gap-0 overflow-y-auto border-0 bg-transparent p-0 shadow-none sm:max-w-2xl sm:rounded-2xl",
          "[&>button]:right-5 [&>button]:top-5 [&>button]:rounded-md [&>button]:bg-card",
          "[&>button]:text-muted-foreground [&>button]:opacity-100 [&>button]:hover:text-foreground",
        )}
      >
        {member ? (
          <>
            <DialogTitle className="sr-only">{name}</DialogTitle>
            <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-lg">
              <div className="grid sm:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]">
                <div className="relative aspect-[3/4] bg-muted sm:aspect-auto sm:min-h-[22rem]">
                  {hasPhoto ? (
                    <img
                      src={member.photoUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover object-top"
                    />
                  ) : (
                    <div
                      className="flex h-full min-h-[16rem] w-full flex-col items-center justify-center gap-2 text-muted-foreground sm:min-h-[22rem]"
                      aria-hidden
                    >
                      <UserRound className="h-20 w-20 opacity-35" />
                      <span className="text-xs">Photo</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4 p-5 pr-12 sm:p-7 sm:pr-14">
                  <header className="space-y-1.5">
                    <h3 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                      {name}
                    </h3>
                    {role ? (
                      <p className="text-sm font-medium text-primary md:text-base">{role}</p>
                    ) : null}
                  </header>

                  <DialogDescription className="text-pretty text-sm leading-relaxed text-muted-foreground md:text-[0.95rem]">
                    {bio.length > 0 ? bio : "Aucune biographie pour ce membre."}
                  </DialogDescription>

                  {linkedin || mail ? (
                    <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-4">
                      {linkedin ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-full"
                          asChild
                        >
                          <a href={linkedin} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="h-4 w-4" aria-hidden />
                            LinkedIn
                          </a>
                        </Button>
                      ) : null}
                      {mail ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-full"
                          asChild
                        >
                          <a href={mail}>
                            <Mail className="h-4 w-4" aria-hidden />
                            E-mail
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
