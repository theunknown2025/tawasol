import { useEffect, useRef, useState } from "react";
import { UserRound } from "lucide-react";
import {
  resolveMotDuPresidentSignatureFont,
  resolveMotDuPresidentSignatureSize,
  type MotDuPresidentContent,
} from "../types";
import { cn } from "@/lib/utils";

type MotDuPresidentSectionProps = {
  content: MotDuPresidentContent;
  className?: string;
};

/** Fixed message viewport (~portrait height on md+). */
const MESSAGE_VIEWPORT_CLASS = "h-[16rem] sm:h-[18rem] md:h-[22rem]";

function ScrollMouseIndicator({ visible }: { visible: boolean }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
      )}
      aria-hidden
    >
      <div className="relative h-8 w-5 rounded-full border-2 border-muted-foreground/55">
        <span className="absolute left-1/2 top-1.5 h-1.5 w-1 -translate-x-1/2 rounded-full bg-muted-foreground/70 animate-[mot-scroll-wheel_1.4s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}

export function MotDuPresidentSection({ content, className }: MotDuPresidentSectionProps) {
  const hasImage = content.presidentImageUrl.trim().length > 0;
  const hasName = content.presidentName.trim().length > 0;
  const hasPosition = content.position.trim().length > 0;
  const hasMessage = content.messageText.trim().length > 0;
  const hasSignature = content.signature.trim().length > 0;
  const messageDir = content.messageDirection === "rtl" ? "rtl" : "ltr";
  const signatureDir = content.signatureDirection === "rtl" ? "rtl" : "ltr";
  const signatureFont = resolveMotDuPresidentSignatureFont(content.signatureFont);
  const signatureSize = resolveMotDuPresidentSignatureSize(content.signatureSize);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollMore, setCanScrollMore] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !hasMessage) {
      setCanScrollMore(false);
      return;
    }

    const update = () => {
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      setCanScrollMore(el.scrollHeight > el.clientHeight + 2 && remaining > 8);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [hasMessage, content.messageText]);

  return (
    <section className={cn("pb-8 pt-2 md:pb-10 md:pt-3", className)}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[min(280px,100%)_1fr] md:items-start">
          <div className="flex flex-col items-center gap-4 md:items-start">
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

            {(hasName || hasPosition) && (
              <header className="w-full max-w-[280px] space-y-1 text-center md:text-left" dir={messageDir}>
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
          </div>

          <div className="min-w-0 space-y-4 text-pretty">
            {hasMessage && (
              <div className={cn("relative pr-7", MESSAGE_VIEWPORT_CLASS)}>
                <div
                  ref={scrollRef}
                  className="h-full overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  tabIndex={0}
                  aria-label="Mot du président — faire défiler pour lire la suite"
                >
                  <div className="prose prose-neutral max-w-none dark:prose-invert" dir={messageDir}>
                    <p className="whitespace-pre-wrap text-justify text-base leading-relaxed text-foreground md:text-lg">
                      {content.messageText}
                    </p>
                  </div>
                </div>
                <ScrollMouseIndicator visible={canScrollMore} />
              </div>
            )}

            {hasSignature && (
              <p
                className="pt-2 text-foreground"
                dir={signatureDir}
                style={{
                  fontFamily: signatureFont.family,
                  fontSize: `${signatureSize.px}px`,
                  lineHeight: 1.2,
                }}
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
