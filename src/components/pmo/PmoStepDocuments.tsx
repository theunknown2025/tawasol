import { useRef, useState } from "react";
import { FileUp, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjetPlanItemDocument } from "@/types/projet";
import {
  deletePlanItemDocument,
  getPlanDocumentSignedUrl,
  uploadPlanItemDocument,
} from "@/lib/pmoPlanDocumentsApi";

type Props = {
  planItemId: string;
  documents: ProjetPlanItemDocument[];
  canMutate: boolean;
  onChanged: () => void;
};

export function PmoStepDocuments({ planItemId, documents, canMutate, onChanged }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const openDoc = async (doc: ProjetPlanItemDocument) => {
    setErr(null);
    setOpeningId(doc.id);
    const url = await getPlanDocumentSignedUrl(doc.storage_path);
    setOpeningId(null);
    if (!url) {
      setErr("Impossible d’ouvrir le fichier.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canMutate) return;
    setUploading(true);
    setErr(null);
    const { error } = await uploadPlanItemDocument(planItemId, file);
    setUploading(false);
    if (error) setErr(error);
    else onChanged();
  };

  const remove = async (doc: ProjetPlanItemDocument) => {
    if (!canMutate) return;
    setDeletingId(doc.id);
    setErr(null);
    const { error } = await deletePlanItemDocument(doc);
    setDeletingId(null);
    if (error) setErr(error);
    else onChanged();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {canMutate && (
          <>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={onFile}
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              Ajouter un document
            </Button>
          </>
        )}
      </div>
      {err && <p className="text-xs text-destructive">{err}</p>}
      {documents.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucun document.</p>
      ) : (
        <ul className="space-y-1.5">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/80 bg-background/80 px-2 py-1.5 text-sm"
            >
              <span className="truncate max-w-[200px]" title={doc.file_name}>
                {doc.file_name}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openDoc(doc)}
                  disabled={openingId === doc.id}
                  title="Ouvrir"
                >
                  {openingId === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                </Button>
                {canMutate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => remove(doc)}
                    disabled={deletingId === doc.id}
                    title="Supprimer"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
