import { useEffect, useMemo, useState } from "react";
import { Download, Eye, FileText, FileWarning, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type SignedStorageFileAccessProps = {
  path: string;
  fileName: string;
  getSignedUrl: (path: string) => Promise<string>;
  /** When true, PDF/image preview is shown inline (no dialog). */
  inlinePreview?: boolean;
  previewClassName?: string;
};

function extensionOf(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? (parts.pop() ?? "").toLowerCase() : "";
}

function isPdf(ext: string) {
  return ext === "pdf";
}

function isWord(ext: string) {
  return ext === "doc" || ext === "docx";
}

function isImage(ext: string) {
  return ["png", "jpg", "jpeg", "webp", "gif"].includes(ext);
}

async function downloadViaBlob(url: string, fileName: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Téléchargement impossible");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

function FilePreviewFrame({
  href,
  fileName,
  ext,
  className,
  frameClassName,
}: {
  href: string;
  fileName: string;
  ext: string;
  className?: string;
  frameClassName?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-muted/30",
        className ?? "min-h-[420px]"
      )}
    >
      {isPdf(ext) ? (
        <iframe
          title={fileName}
          src={href}
          className={cn("w-full border-0", frameClassName ?? "h-[420px]")}
        />
      ) : isImage(ext) ? (
        <div
          className={cn(
            "flex items-center justify-center overflow-auto p-4",
            frameClassName ?? "h-[420px]"
          )}
        >
          <img src={href} alt={fileName} className="max-h-full max-w-full object-contain" />
        </div>
      ) : null}
    </div>
  );
}

export function SignedStorageFileAccess({
  path,
  fileName,
  getSignedUrl,
  inlinePreview = false,
  previewClassName,
}: SignedStorageFileAccessProps) {
  const [href, setHref] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const ext = useMemo(() => extensionOf(fileName), [fileName]);
  const canPreview = isPdf(ext) || isImage(ext);
  const wordFile = isWord(ext);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setHref(null);

    if (!path?.trim()) {
      setLoading(false);
      setError("Chemin du fichier manquant");
      return;
    }

    void getSignedUrl(path)
      .then((url) => {
        if (!cancelled) {
          setHref(url);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setHref(null);
          setLoading(false);
          setError(e instanceof Error ? e.message : "Accès au fichier impossible");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path, getSignedUrl]);

  const handleDownload = async () => {
    if (!href) return;
    setDownloading(true);
    try {
      await downloadViaBlob(href, fileName);
    } catch {
      window.open(href, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {fileName}
      </span>
    );
  }

  if (!href || error) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <FileWarning className="h-3.5 w-3.5 shrink-0 text-destructive" />
        <span>{fileName}</span>
        <span className="text-xs text-destructive">({error ?? "Fichier inaccessible"})</span>
      </span>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-sm">
          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">{fileName}</span>
        </span>

        {!inlinePreview && canPreview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="h-3.5 w-3.5" />
            Aperçu
          </Button>
        )}

        <Button
          type="button"
          variant={wordFile || !canPreview ? "default" : "outline"}
          size="sm"
          className="h-8 gap-1.5"
          disabled={downloading}
          onClick={() => void handleDownload()}
        >
          {downloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Télécharger
        </Button>
      </div>

      {inlinePreview && canPreview && (
        <FilePreviewFrame
          href={href}
          fileName={fileName}
          ext={ext}
          className={previewClassName}
        />
      )}

      {!inlinePreview && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col gap-3 overflow-hidden">
            <DialogHeader>
              <DialogTitle className="truncate pr-8">{fileName}</DialogTitle>
              <DialogDescription className="sr-only">Aperçu du document</DialogDescription>
            </DialogHeader>

            <div className="flex shrink-0 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={downloading}
                onClick={() => void handleDownload()}
              >
                {downloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Télécharger
              </Button>
            </div>

            <FilePreviewFrame
              href={href}
              fileName={fileName}
              ext={ext}
              className="min-h-[60vh]"
              frameClassName="h-[60vh]"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
