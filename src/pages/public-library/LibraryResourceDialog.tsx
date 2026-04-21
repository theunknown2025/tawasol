import { useState } from "react";
import { Download, FileWarning, Loader2, Star } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchBookReviews,
  insertBookReview,
  type LibraryBookReview,
  type PublicLibraryBook,
} from "@/lib/publicLibraryBooksApi";
import { incrementLibraryBookDownloads } from "@/lib/libraryBookAnalyticsApi";
import { cn } from "@/lib/utils";

const reviewsKey = (bookId: string) => ["public-library-reviews", bookId] as const;

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

function ReviewRow({ review }: { review: LibraryBookReview }) {
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

type LibraryResourceDialogProps = {
  book: PublicLibraryBook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LibraryResourceDialog({ book, open, onOpenChange }: LibraryResourceDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const bookId = book?.id ?? "";

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: reviewsKey(bookId),
    queryFn: () => fetchBookReviews(bookId),
    enabled: open && !!bookId,
  });

  const reviewMutation = useMutation({
    mutationFn: insertBookReview,
    onSuccess: () => {
      toast.success("Merci pour votre avis");
      setComment("");
      setRating(0);
      void queryClient.invalidateQueries({ queryKey: [...reviewsKey(bookId)] });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Impossible d’enregistrer l’avis");
    },
  });

  const pdfUrl = book?.pdf_url?.trim() ?? "";

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookId) return;
    if (rating < 1) {
      toast.error("Choisissez une note entre 1 et 5 étoiles");
      return;
    }
    reviewMutation.mutate({ book_id: bookId, rating, comment });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[95vh] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-3 pr-12 text-left sm:px-6">
          <DialogTitle className="line-clamp-2 text-lg sm:text-xl">
            {book?.title ?? "Ressource"}
          </DialogTitle>
          {book?.author?.trim() && (
            <p className="text-sm font-medium text-muted-foreground">{book.author}</p>
          )}
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-border lg:border-b-0 lg:border-r">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2 sm:px-6">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Document
              </span>
              {pdfUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    if (bookId) void incrementLibraryBookDownloads(bookId);
                    window.open(pdfUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Télécharger
                </Button>
              ) : null}
            </div>
            <div className="min-h-[40vh] flex-1 bg-muted/30 lg:min-h-[65vh]">
              {pdfUrl ? (
                <iframe
                  title={book?.title ?? "PDF"}
                  src={pdfUrl}
                  className="h-full min-h-[40vh] w-full border-0 lg:min-h-[65vh]"
                />
              ) : (
                <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
                  <FileWarning className="h-10 w-10 opacity-30" aria-hidden />
                  Aucun PDF associé à cette ressource.
                </div>
              )}
            </div>
          </div>

          <ScrollArea className="h-[50vh] w-full shrink-0 lg:h-auto lg:w-[22rem] lg:max-w-[40%] xl:w-[26rem]">
            <div className="space-y-5 p-4 sm:p-5">
              {book?.description?.trim() && (
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Présentation
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground">{book.description}</p>
                </div>
              )}

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
                    pour noter ce livre et laisser un commentaire.
                  </p>
                ) : (
                  <form className="space-y-3" onSubmit={handleSubmitReview}>
                    <div className="space-y-2">
                      <Label>Note</Label>
                      <StarPicker value={rating} onChange={setRating} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rev-comment">Commentaire</Label>
                      <Textarea
                        id="rev-comment"
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
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
