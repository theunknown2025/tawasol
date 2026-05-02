import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PublicLibraryBook } from "@/lib/publicLibraryBooksApi";
import { LibraryBookPdfPanel, LibraryBookReviewsPanel } from "./LibraryBookReadingPanels";

type LibraryResourceDialogProps = {
  book: PublicLibraryBook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LibraryResourceDialog({ book, open, onOpenChange }: LibraryResourceDialogProps) {
  const bookId = book?.id ?? "";
  const pdfUrl = book?.pdf_url?.trim() ?? "";

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
            <LibraryBookPdfPanel
              bookId={bookId}
              title={book?.title ?? "Ressource"}
              pdfUrl={pdfUrl}
              minHeightClass="min-h-[40vh] lg:min-h-[65vh]"
            />
          </div>

          <ScrollArea className="h-[50vh] w-full shrink-0 lg:h-auto lg:w-[22rem] lg:max-w-[40%] xl:w-[26rem]">
            <LibraryBookReviewsPanel bookId={bookId} description={book?.description} enabled={open && !!bookId} />
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
