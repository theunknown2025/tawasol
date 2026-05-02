import { Link2, Mail, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildLinkedInShareUrl, buildMailtoShareUrl, buildWhatsAppShareUrl } from "@/lib/shareLinks";

type ShareResourceMenuProps = {
  title: string;
  url: string;
  /** Extra line for e-mail / WhatsApp body */
  description?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

async function copyLink(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

export function ShareResourceMenu({
  title,
  url,
  description,
  variant = "outline",
  size = "sm",
  className,
}: ShareResourceMenuProps) {
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const shareBody = [description?.trim(), url].filter(Boolean).join("\n\n");
  const mailSubject = title.trim() || "REMESS";

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: title.trim() || document.title,
        text: description?.trim() || undefined,
        url,
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("Partage impossible", {
        description: e instanceof Error ? e.message : "Réessayez ou utilisez un autre canal.",
      });
    }
  };

  const handleInstagram = async () => {
    const ok = await copyLink(url);
    if (ok) {
      toast.success("Lien copié", {
        description:
          "Instagram ne propose pas de partage web direct : collez ce lien dans une story ou une publication depuis l’application.",
      });
    } else {
      toast.error("Impossible de copier le lien");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant={variant} size={size} className={className} aria-label="Partager">
          <Share2 className="h-4 w-4" aria-hidden />
          {size !== "icon" ? <span className="ml-2">Partager</span> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {canNativeShare ? (
          <>
            <DropdownMenuItem onSelect={() => void handleNativeShare()}>
              <Share2 className="mr-2 h-4 w-4" aria-hidden />
              Appareil (partage natif)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem asChild>
          <a href={buildLinkedInShareUrl(url)} target="_blank" rel="noopener noreferrer">
            <span className="mr-2 inline-block w-4 text-center font-semibold text-[#0A66C2]" aria-hidden>
              in
            </span>
            LinkedIn
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void handleInstagram()}>
          <Link2 className="mr-2 h-4 w-4" aria-hidden />
          Instagram (copier le lien)
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={buildWhatsAppShareUrl(title, url)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" aria-hidden />
            WhatsApp
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={buildMailtoShareUrl(mailSubject, shareBody || url)}>
            <Mail className="mr-2 h-4 w-4" aria-hidden />
            E-mail
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
