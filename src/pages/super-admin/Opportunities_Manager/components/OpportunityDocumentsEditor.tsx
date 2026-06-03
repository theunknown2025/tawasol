import { useRef, useState } from "react";
import { FileUp, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { OpportunityDocument } from "@/types/opportunity";

type OpportunityDocumentsEditorProps = {
  documents: OpportunityDocument[];
  onChange: (documents: OpportunityDocument[]) => void;
  onUpload: (file: File, label: string) => Promise<OpportunityDocument>;
  isUploading?: boolean;
};

function defaultLabelFromFile(file: File, sharedLabel: string, isSingle: boolean): string {
  if (isSingle && sharedLabel.trim()) return sharedLabel.trim();
  const base = file.name.replace(/\.[^.]+$/, "") || file.name;
  return base;
}

export default function OpportunityDocumentsEditor({
  documents,
  onChange,
  onUpload,
  isUploading = false,
}: OpportunityDocumentsEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sharedLabel, setSharedLabel] = useState("");
  const [uploadingLocal, setUploadingLocal] = useState(false);

  const busy = isUploading || uploadingLocal;

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    setUploadingLocal(true);
    try {
      const uploaded: OpportunityDocument[] = [];
      for (const file of list) {
        const label = defaultLabelFromFile(file, sharedLabel, list.length === 1);
        uploaded.push(await onUpload(file, label));
      }
      onChange([...documents, ...uploaded]);
      setSharedLabel("");
      toast.success(
        uploaded.length === 1 ? "Document ajouté" : `${uploaded.length} documents ajoutés`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de téléversement");
    } finally {
      setUploadingLocal(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateLabel = (id: string, label: string) => {
    onChange(documents.map((doc) => (doc.id === id ? { ...doc, label } : doc)));
  };

  const removeDocument = (id: string) => {
    onChange(documents.filter((doc) => doc.id !== id));
  };

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
      <div className="space-y-1">
        <Label>Documents (référence)</Label>
        <p className="text-xs text-muted-foreground">
          Ajoutez un ou plusieurs fichiers (PDF, Word, etc.). Sélection multiple autorisée.
        </p>
      </div>

      <div className="space-y-2">
        <Input
          placeholder="Libellé (optionnel, 1 seul fichier)"
          value={sharedLabel}
          disabled={busy}
          onChange={(e) => setSharedLabel(e.target.value)}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const files = e.target.files;
            if (files?.length) void handleFiles(files);
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Téléversement…
            </>
          ) : (
            <>
              <FileUp className="h-4 w-4" />
              Choisir des fichiers
            </>
          )}
        </Button>
      </div>

      {documents.length > 0 && (
        <ul className="space-y-2 border-t border-border pt-3">
          {documents.map((doc, index) => (
            <li
              key={doc.id}
              className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-2 sm:flex-row sm:items-center"
            >
              <span className="shrink-0 text-xs font-medium text-muted-foreground sm:w-6">
                {index + 1}.
              </span>
              <Input
                className="h-8 flex-1 text-sm"
                value={doc.label}
                onChange={(e) => updateLabel(doc.id, e.target.value)}
                aria-label={`Libellé du document ${index + 1}`}
              />
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-xs text-primary hover:underline sm:max-w-[8rem]"
                title={doc.fileName}
              >
                {doc.fileName}
              </a>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 self-end text-destructive sm:self-center"
                title="Supprimer"
                onClick={() => removeDocument(doc.id)}
              >
                <Trash2 size={14} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
