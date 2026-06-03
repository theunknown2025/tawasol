import { SendHorizontal, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Opportunity } from "@/types/opportunity";

type PublishOpportunityActionProps = {
  opportunity: Opportunity;
  onPublishToggle: (opportunity: Opportunity) => void;
};

export default function PublishOpportunityAction({
  opportunity,
  onPublishToggle,
}: PublishOpportunityActionProps) {
  const isPublished = opportunity.status === "published";
  return (
    <Button
      variant="ghost"
      size="icon"
      title={isPublished ? "Dépublier" : "Publier"}
      onClick={() => onPublishToggle(opportunity)}
    >
      {isPublished ? <EyeOff size={16} /> : <SendHorizontal size={16} />}
    </Button>
  );
}
