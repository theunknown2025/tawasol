import * as React from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Personnel } from "@/types/personnel";

interface PersonnelPreviewActionProps {
  personnel: Personnel;
  onPreview: (personnel: Personnel) => void;
}

export function PersonnelPreviewAction({ personnel, onPreview }: PersonnelPreviewActionProps) {
  return (
    <Button variant="ghost" size="icon" onClick={() => onPreview(personnel)} title="Aperçu">
      <Eye className="h-4 w-4" />
    </Button>
  );
}
