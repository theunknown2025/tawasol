import * as React from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Personnel } from "@/types/personnel";

interface PersonnelEditActionProps {
  personnel: Personnel;
  onEdit: (personnel: Personnel) => void;
}

export function PersonnelEditAction({ personnel, onEdit }: PersonnelEditActionProps) {
  return (
    <Button variant="ghost" size="icon" onClick={() => onEdit(personnel)} title="Modifier">
      <Pencil className="h-4 w-4" />
    </Button>
  );
}
