import type { ReactNode } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PartenaireLayoutProps = {
  nom: string;
  logoUrl: string;
  description: ReactNode;
  footer?: ReactNode;
  /** Larger logo / padding for the detail modal */
  size?: "card" | "modal";
  className?: string;
  titleAs?: "h3" | "div";
};

/**
 * Shared partenaires presentation: centered title, logo ~30% left, text column right.
 * Used by the landing card and the detail modal so colors/layout stay in sync.
 */
export function PartenaireLayout({
  nom,
  logoUrl,
  description,
  footer,
  size = "card",
  className,
  titleAs = "h3",
}: PartenaireLayoutProps) {
  const hasLogo = logoUrl.trim().length > 0;
  const isModal = size === "modal";
  const TitleTag = titleAs;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm",
        isModal ? "p-5 sm:p-6" : "h-full min-h-[11rem] p-4 sm:p-5",
        className,
      )}
    >
      <TitleTag
        className={cn(
          "mb-4 text-center font-semibold leading-snug text-foreground",
          isModal ? "text-lg md:text-xl" : "text-base md:text-lg",
        )}
      >
        {nom}
      </TitleTag>

      <div className="flex flex-1 items-stretch">
        <div
          className={cn(
            "flex w-[30%] shrink-0 items-center justify-center bg-muted/20",
            isModal ? "p-3 sm:p-4" : "p-2 sm:p-3",
          )}
        >
          {hasLogo ? (
            <img
              src={logoUrl}
              alt=""
              className={cn(
                "w-full object-contain",
                isModal ? "max-h-36 sm:max-h-44" : "max-h-24 sm:max-h-28",
              )}
              loading={isModal ? undefined : "lazy"}
            />
          ) : (
            <Building2
              className={cn(
                "text-muted-foreground/45",
                isModal ? "h-12 w-12" : "h-10 w-10",
              )}
              aria-hidden
            />
          )}
        </div>

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col py-1 pl-4 sm:pl-5",
            footer ? "justify-between gap-3" : "gap-4",
          )}
        >
          <div className="text-pretty text-sm leading-relaxed text-muted-foreground md:text-[0.95rem]">
            {description}
          </div>
          {footer}
        </div>
      </div>
    </div>
  );
}
