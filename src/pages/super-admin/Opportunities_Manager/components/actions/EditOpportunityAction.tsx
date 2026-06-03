import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Opportunity } from "@/types/opportunity";

type EditOpportunityActionProps = {
  opportunity: Opportunity;
  onEdit: (opportunity: Opportunity) => void;
};

export default function EditOpportunityAction({ opportunity, onEdit }: EditOpportunityActionProps) {
  return (
    <Button variant="ghost" size="icon" title="Modifier" onClick={() => onEdit(opportunity)}>
      <Pencil size={16} />
    </Button>
  );
}
