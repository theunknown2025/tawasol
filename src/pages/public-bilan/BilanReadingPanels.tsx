import { useState } from "react";
import { Download, FileWarning, Loader2, Star } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchBilanReviews,
  insertBilanReview,
  type BilanDocumentReview,
} from "@/lib/publicBilanApi";
import { incrementBilanDocumentDownloads } from "@/lib/bilanAnalyticsApi";
import { ShareResourceMenu } from "@/components/public/ShareResourceMenu";
import { buildBilanShareUrl } from "@/lib/shareLinks";
import { cn } from "@/lib/utils";

export const bilanReviewsQueryKey = (documentId: string) =>
  ["public-bilan-reviews", documentId] as const;

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1" role="group" aria-label="Note sur 5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            "rounded-md p-1 transition-colors hover:bg-muted",
            n <= value ? "text-amber-500" : "text-muted-foreground/40",
          )}
          aria-label={`${n} sur 5`}
        >
          <Star className={cn("h-7 w-7", n <= value && "fill-current")} aria-hidden />
        </button>
      ))}
    </div>
  );
}

function ReviewRow({ review }: { review: BilanDocumentReview }) {
  return (
    <li className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex text-amber-500">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={`${review.id}-s-${i}`}
              className={cn("h-3.5 w-3.5", i < review.rating ? "fill-current" : "opacity-25")}
              aria-hidden
            />
          ))}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(review.created_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-foreground">{review.comment}</p>
    </li>
  );
}

type BilanPdfPanelProps = {
  documentId: string;
  title: string;
  pdfUrl: string;
  showShare?: boolean;
  minHeightClass?: string;
};

export function BilanPdfPanel({
  documentId,
  title,
  pdfUrl,
  showShare = true,
  minHeightClass = "min-h-[50vh] lg:min-h-[70vh]",
}: BilanPdfPanelProps) {
  const trimmed = pdfUrl.trim();
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2 sm:px-5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Document
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {showShare ? (
            <ShareResourceMenu
              title={title}
              url={buildBilanShareUrl(documentId)}
              variant="outline"
              size="sm"
            />
          ) : null}
          {trimmed ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                void incrementBilanDocumentDownloads(documentId);
                window.open(trimmed, "_blank", "noopener,noreferrer");
              }}
            >
              <Download className="h-4 w-4" aria-hidden />
              Télécharger
            </Button>
          ) : null}
        </div>
      </div>
      <div className={cn("min-h-0 flex-1 bg-muted/30", minHeightClass)}>
        {trimmed ? (
          <iframe
            title={title}
            src={trimmed}
            className={cn("h-full w-full border-0", minHeightClass)}
          />
        ) : (
          <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
            <FileWarning className="h-10 w-10 opacity-30" aria-hidden />
            Aucun PDF associé à ce bilan.
          </div>
        )}
      </div>
    </div>
  );
}

type BilanReviewsPanelProps = {
  documentId: string;
  enabled?: boolean;
  className?: string;
};

export function BilanReviewsPanel({
  documentId,
  enabled = true,
  className,
}: BilanReviewsPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: bilanReviewsQueryKey(documentId),
    queryFn: () => fetchBilanReviews(documentId),
    enabled: enabled && !!documentId,
  });

  const reviewMutation = useMutation({
    mutationFn: insertBilanReview,
    onSuccess: () => {
      toast.success("Merci pour votre avis");
      setComment("");
      setRating(0);
      void queryClient.invalidateQueries({ queryKey: [...bilanReviewsQueryKey(documentId)] });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Impossible d’enregistrer l’avis");
    },
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId) return;
    if (rating < 1) {
      toast.error("Choisissez une note entre 1 et 5 étoiles");
      return;
    }
    reviewMutation.mutate({ document_id: documentId, rating, comment });
  };

  return (
    <div
      className={cn(
        "space-y-5 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Avis ({reviews.length})
        </h3>
        {reviewsLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-xs text-muted-foreground">Pas encore d’avis.</p>
        ) : (
          <ul className="space-y-2">
            {reviews.map((r) => (
              <ReviewRow key={r.id} review={r} />
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Votre avis
        </h3>
        {!user ? (
          <p className="text-sm text-muted-foreground">
            <a href="/auth" className="font-medium text-primary underline underline-offset-4">
              Connectez-vous
            </a>{" "}
            pour noter ce bilan et laisser un commentaire.
          </p>
        ) : (
          <form className="space-y-3" onSubmit={handleSubmitReview}>
            <div className="space-y-2">
              <Label>Note (évaluation)</Label>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`bilan-rev-${documentId}`}>Commentaire</Label>
              <Textarea
                id={`bilan-rev-${documentId}`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Partagez votre ressenti…"
                required
              />
            </div>
            <Button type="submit" size="sm" disabled={reviewMutation.isPending}>
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Envoi…
                </>
              ) : (
                "Publier l’avis"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
