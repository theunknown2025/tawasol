import { Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Evenement } from "@/hooks/useEvenements";

interface OrganizerDialogProps {
  event: Evenement | null;
  onClose: () => void;
}

export function OrganizerDialog({ event, onClose }: OrganizerDialogProps) {
  if (!event) return null;
  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Organisateur</DialogTitle>
          <DialogDescription>
            Organisateur de l'événement « {event.titre} »
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 py-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users size={24} className="text-primary" />
          </div>
          <div>
            <p className="font-medium">{event.authorName}</p>
            <p className="text-sm text-muted-foreground">Organisateur</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
