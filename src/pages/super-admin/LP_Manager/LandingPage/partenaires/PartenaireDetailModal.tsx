import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { NosPartenaireEntry } from "../../types";
import { PartenaireLayout } from "./PartenaireLayout";
import { externalPartnerHref } from "./partenairePreview";

type PartenaireDetailModalProps = {
  entry: NosPartenaireEntry | null;
  onClose: () => void;
};

export function PartenaireDetailModal({ entry, onClose }: PartenaireDetailModalProps) {
  const nom = entry?.nom.trim() || "Partenaire";
  const desc = entry?.description.trim() ?? "";
  const websiteLabel = entry?.websiteUrl.trim() ?? "";
  const href = entry ? externalPartnerHref(entry.websiteUrl) : null;

  return (
    <Dialog open={entry !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90vh] gap-0 overflow-y-auto border-0 bg-transparent p-0 shadow-none sm:max-w-xl sm:rounded-2xl [&>button]:right-5 [&>button]:top-5 [&>button]:rounded-md [&>button]:bg-card [&>button]:text-muted-foreground [&>button]:opacity-100 [&>button]:hover:text-foreground"
      >
        {entry ? (
          <>
            <DialogTitle className="sr-only">{nom}</DialogTitle>
            <PartenaireLayout
              nom={nom}
              logoUrl={entry.logoUrl}
              size="modal"
              titleAs="div"
              className="pr-10 shadow-lg sm:pr-12"
              description={
                <>
                  <DialogDescription className="text-pretty text-sm leading-relaxed text-muted-foreground md:text-[0.95rem]">
                    {desc.length > 0 ? desc : "Aucune description pour ce partenaire."}
                  </DialogDescription>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block break-all text-sm text-primary underline-offset-4 hover:underline"
                    >
                      {websiteLabel}
                    </a>
                  ) : null}
                </>
              }
            />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
