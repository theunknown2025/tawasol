import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  OPPORTUNITY_FORMAT_LABELS,
  OPPORTUNITY_TYPE_LABELS,
  type Opportunity,
} from "@/types/opportunity";
import PublishOpportunityAction from "./actions/PublishOpportunityAction";
import EditOpportunityAction from "./actions/EditOpportunityAction";
import DeleteOpportunityAction from "./actions/DeleteOpportunityAction";

type ListeOpportunitesTabProps = {
  opportunities: Opportunity[];
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (opportunity: Opportunity) => void;
  onPublishToggle: (opportunity: Opportunity) => void;
};

export default function ListeOpportunitesTab({
  opportunities,
  onEdit,
  onDelete,
  onPublishToggle,
}: ListeOpportunitesTabProps) {
  if (opportunities.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Aucune opportunité enregistrée pour le moment.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titre</TableHead>
          <TableHead className="hidden md:table-cell">Type</TableHead>
          <TableHead className="hidden lg:table-cell">Format</TableHead>
          <TableHead className="w-[110px]">Date limite</TableHead>
          <TableHead className="w-[100px]">Statut</TableHead>
          <TableHead className="w-[140px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {opportunities.map((opp) => (
          <TableRow key={opp.id}>
            <TableCell className="font-medium">{opp.title}</TableCell>
            <TableCell className="hidden md:table-cell">
              {OPPORTUNITY_TYPE_LABELS[opp.opportunityType]}
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              {OPPORTUNITY_FORMAT_LABELS[opp.format]}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {new Date(opp.deadline).toLocaleDateString("fr-FR")}
            </TableCell>
            <TableCell>
              <Badge variant={opp.status === "published" ? "default" : "secondary"}>
                {opp.status === "published" ? "Publié" : "Brouillon"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <PublishOpportunityAction opportunity={opp} onPublishToggle={onPublishToggle} />
                <EditOpportunityAction opportunity={opp} onEdit={onEdit} />
                <DeleteOpportunityAction opportunity={opp} onDelete={onDelete} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
