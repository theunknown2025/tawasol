import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Opportunity } from "@/types/opportunity";

type DeleteOpportunityActionProps = {
  opportunity: Opportunity;
  onDelete: (opportunity: Opportunity) => void;
};

export default function DeleteOpportunityAction({ opportunity, onDelete }: DeleteOpportunityActionProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      title="Supprimer"
      className="text-destructive"
      onClick={() => onDelete(opportunity)}
    >
      <Trash2 size={16} />
    </Button>
  );
}
