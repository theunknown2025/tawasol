import { ImagePlus, Star, Trash2 } from "lucide-react";
import { useId } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MAX_COOP_IMAGES } from "./barometreCooperativesApi";

export type CooperativeImageDraft = {
  id: string;
  /** Preview URL (blob or remote). */
  previewUrl: string;
  /** Remote URL already stored (edit). */
  remoteUrl: string | null;
  file: File | null;
  isMain: boolean;
};

type Props = {
  images: CooperativeImageDraft[];
  onChange: (next: CooperativeImageDraft[]) => void;
  disabled?: boolean;
};

function newDraftId(): string {
  return crypto.randomUUID();
}

export function createDraftFromRemote(url: string, isMain: boolean): CooperativeImageDraft {
  return {
    id: newDraftId(),
    previewUrl: url,
    remoteUrl: url,
    file: null,
    isMain,
  };
}

export function draftsToRemoteImages(
  drafts: CooperativeImageDraft[],
  uploadedById: Map<string, string>,
): { url: string; isMain: boolean }[] {
  return drafts
    .map((d) => {
      const url = uploadedById.get(d.id) ?? d.remoteUrl ?? "";
      return { url: url.trim(), isMain: d.isMain };
    })
    .filter((d) => d.url.length > 0);
}

export default function CooperativeImagesField({ images, onChange, disabled }: Props) {
  const inputId = useId();
  const remaining = MAX_COOP_IMAGES - images.length;

  const ensureMain = (list: CooperativeImageDraft[]): CooperativeImageDraft[] => {
    if (list.length === 0) return list;
    if (list.some((i) => i.isMain)) return list;
    return list.map((img, i) => ({ ...img, isMain: i === 0 }));
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const room = MAX_COOP_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`Maximum ${MAX_COOP_IMAGES} images.`);
      return;
    }

    const accepted: CooperativeImageDraft[] = [];
    for (const file of Array.from(fileList)) {
      if (accepted.length >= room) break;
      if (!file.type.startsWith("image/")) {
        toast.error(`« ${file.name} » n’est pas une image.`);
        continue;
      }
      accepted.push({
        id: newDraftId(),
        previewUrl: URL.createObjectURL(file),
        remoteUrl: null,
        file,
        isMain: false,
      });
    }

    if (accepted.length === 0) return;
    const merged = [...images, ...accepted];
    onChange(
      ensureMain(
        merged.map((img, i) => ({
          ...img,
          isMain: images.length === 0 ? i === 0 : img.isMain,
        })),
      ),
    );
  };

  const removeAt = (id: string) => {
    const target = images.find((i) => i.id === id);
    if (target?.file && target.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(target.previewUrl);
    }
    onChange(ensureMain(images.filter((i) => i.id !== id)));
  };

  const setMain = (id: string) => {
    onChange(images.map((img) => ({ ...img, isMain: img.id === id })));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <Label htmlFor={inputId}>Images</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Jusqu’à {MAX_COOP_IMAGES} images. Une image principale (carte) et des images
            complémentaires (page dédiée).
          </p>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {images.length}/{MAX_COOP_IMAGES}
        </span>
      </div>

      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((img) => (
            <li
              key={img.id}
              className={cn(
                "relative overflow-hidden rounded-md border bg-muted/20",
                img.isMain ? "border-primary ring-1 ring-primary/40" : "border-border",
              )}
            >
              <img
                src={img.previewUrl}
                alt=""
                className="aspect-square w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 pt-6">
                <button
                  type="button"
                  disabled={disabled || img.isMain}
                  onClick={() => setMain(img.id)}
                  className={cn(
                    "inline-flex items-center justify-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
                    img.isMain
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/90 text-foreground hover:bg-background",
                  )}
                >
                  <Star className={cn("h-3 w-3", img.isMain && "fill-current")} aria-hidden />
                  {img.isMain ? "Principale" : "Définir principale"}
                </button>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                disabled={disabled}
                className="absolute right-1 top-1 h-7 w-7 bg-background/90"
                onClick={() => removeAt(img.id)}
                aria-label="Supprimer l’image"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {remaining > 0 ? (
        <label
          htmlFor={inputId}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground transition-colors hover:bg-muted/40",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <ImagePlus className="h-5 w-5" aria-hidden />
          <span>
            Ajouter {remaining === 1 ? "une image" : `des images (max ${remaining})`}
          </span>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            multiple
            disabled={disabled}
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      ) : null}
    </div>
  );
}
