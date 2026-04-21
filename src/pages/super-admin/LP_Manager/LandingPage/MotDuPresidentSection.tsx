import { UserRound } from "lucide-react";
import type { MotDuPresidentContent } from "../types";
import { cn } from "@/lib/utils";

type MotDuPresidentSectionProps = {
  content: MotDuPresidentContent;
  className?: string;
};

export function MotDuPresidentSection({ content, className }: MotDuPresidentSectionProps) {
  const hasImage = content.presidentImageUrl.trim().length > 0;
  const hasName = content.presidentName.trim().length > 0;
  const hasPosition = content.position.trim().length > 0;
  const hasMessage = content.messageText.trim().length > 0;
  const hasSignature = content.signature.trim().length > 0;

  return (
    <section
      className={cn(
        "border-border/80 bg-gradient-to-b from-muted/40 to-background py-12 md:py-16",
        className,
      )}
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-10 md:grid-cols-[min(280px,100%)_1fr] md:items-start">
          <div className="flex justify-center md:justify-start">
            {hasImage ? (
              <img
                src={content.presidentImageUrl}
                alt={hasName ? content.presidentName : "Portrait du président"}
                className="aspect-[3/4] w-full max-w-[280px] rounded-2xl object-cover object-top shadow-lg ring-1 ring-border"
              />
            ) : (
              <div
                className="flex aspect-[3/4] w-full max-w-[280px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/30 text-muted-foreground"
                aria-hidden
              >
                <UserRound className="h-14 w-14 opacity-40" />
                <span className="px-4 text-center text-sm">Photo du président</span>
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-4 text-pretty">
            {(hasName || hasPosition) && (
              <header className="space-y-1 border-b border-border/60 pb-4">
                {hasName && (
                  <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                    {content.presidentName}
                  </h2>
                )}
                {hasPosition && (
                  <p className="text-base font-medium text-primary md:text-lg">{content.position}</p>
                )}
              </header>
            )}

            {hasMessage && (
              <div className="prose prose-neutral max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground md:text-lg">
                  {content.messageText}
                </p>
              </div>
            )}

            {hasSignature && (
              <p
                className="font-signature pt-2 text-3xl text-foreground md:text-4xl"
                style={{ lineHeight: 1.2 }}
              >
                {content.signature}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
