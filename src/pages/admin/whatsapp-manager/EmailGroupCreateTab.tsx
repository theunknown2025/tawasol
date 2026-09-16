import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { EmailGroupMemberInput } from "./emailGroupTypes";
import { createEmailGroup } from "./emailGroupsApi";

const QUERY_KEY = ["email-notification-groups"] as const;

function emptyMember(): EmailGroupMemberInput {
  return { full_name: "", email: "" };
}

type Props = {
  onCreated?: () => void;
};

export default function EmailGroupCreateTab({ onCreated }: Props) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [members, setMembers] = useState<EmailGroupMemberInput[]>([emptyMember()]);

  const createMut = useMutation({
    mutationFn: () =>
      createEmailGroup({
        name,
        members,
        created_by: user?.id ?? null,
      }),
    onSuccess: () => {
      toast.success("Groupe créé");
      setName("");
      setMembers([emptyMember()]);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      onCreated?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMember = (index: number, patch: Partial<EmailGroupMemberInput>) => {
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  };

  const removeMember = (index: number) => {
    setMembers((prev) => (prev.length <= 1 ? [emptyMember()] : prev.filter((_, i) => i !== index)));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <p className="text-sm text-muted-foreground">
        Créez un groupe de destinataires. Les publications, événements, projets, opportunités et articles publiés
        leur seront envoyés par email (Postfix / Dovecot).
      </p>

      <div className="space-y-2">
        <Label htmlFor="eg-name">Nom du groupe *</Label>
        <Input
          id="eg-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex. Comité de suivi"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label>Membres *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setMembers((prev) => [...prev, emptyMember()])}
          >
            <Plus size={16} />
            Ajouter
          </Button>
        </div>

        <div className="space-y-3">
          {members.map((m, index) => (
            <div
              key={index}
              className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end rounded-xl border border-border p-3"
            >
              <div className="space-y-2">
                <Label htmlFor={`eg-member-name-${index}`}>Nom</Label>
                <Input
                  id={`eg-member-name-${index}`}
                  value={m.full_name}
                  onChange={(e) => updateMember(index, { full_name: e.target.value })}
                  placeholder="Prénom Nom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`eg-member-email-${index}`}>Email</Label>
                <Input
                  id={`eg-member-email-${index}`}
                  type="email"
                  value={m.email}
                  onChange={(e) => updateMember(index, { email: e.target.value })}
                  placeholder="exemple@domaine.ma"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive shrink-0"
                onClick={() => removeMember(index)}
                aria-label="Retirer le membre"
              >
                <Trash2 size={18} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Button
        type="button"
        onClick={() => {
          if (!name.trim()) {
            toast.error("Le nom du groupe est obligatoire");
            return;
          }
          createMut.mutate();
        }}
        disabled={createMut.isPending}
      >
        {createMut.isPending ? "Enregistrement…" : "Créer le groupe"}
      </Button>
    </div>
  );
}
