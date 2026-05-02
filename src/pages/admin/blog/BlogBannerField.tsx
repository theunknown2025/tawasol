import { useId, useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadBlogBannerImage } from "@/lib/blogBannersApi";

type BlogBannerFieldProps = {
  bannerUrl: string;
  onBannerUrlChange: (url: string) => void;
  disabled?: boolean;
};

/**
 * Bannière : téléversement (bucket `blog_banners`) ou URL manuelle.
 */
export function BlogBannerField({ bannerUrl, onBannerUrlChange, disabled }: BlogBannerFieldProps) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file || disabled) return;
    setUploading(true);
    try {
      const { url, usedFallback } = await uploadBlogBannerImage(file);
      onBannerUrlChange(url);
      if (usedFallback) {
        toast.warning("Bannière enregistrée en local", {
          description:
            "Le stockage distant n’est pas disponible : l’image est intégrée pour cette session.",
        });
      } else {
        toast.success("Bannière téléversée");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du téléversement");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          className="gap-2"
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ImagePlus className="h-4 w-4" aria-hidden />
          )}
          {uploading ? "Téléversement…" : "Téléverser une image"}
        </Button>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={inputId} className="text-xs text-muted-foreground">
          Ou URL de la bannière
        </Label>
        <Input
          id={inputId}
          placeholder="https://exemple.com/image.jpg"
          value={bannerUrl}
          onChange={(e) => onBannerUrlChange(e.target.value)}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, WebP ou GIF — 5 Mo max. L’URL remplace l’image téléversée si vous la modifiez.
        </p>
      </div>
    </div>
  );
}
