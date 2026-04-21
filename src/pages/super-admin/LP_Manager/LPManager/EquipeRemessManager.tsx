import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, ImagePlus, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { uploadLandingPageImage } from "@/lib/lpLandingPageApi";
import {
  createDefaultEquipeMember,
  EQUIPE_BIO_MAX_CHARS,
  EQUIPE_MEMBERS_MAX,
  type EquipeMember,
  type EquipeRemessContent,
} from "../types";

type EquipeRemessManagerProps = {
  value: EquipeRemessContent;
  onChange: (next: EquipeRemessContent) => void;
};

export function EquipeRemessManager({ value, onChange }: EquipeRemessManagerProps) {
  const members = value.members ?? [];
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const patchMembers = (next: EquipeMember[]) => {
    onChange({ members: next });
  };

  const patchMember = (index: number, partial: Partial<EquipeMember>) => {
    patchMembers(
      members.map((m, i) => {
        if (i !== index) return m;
        const next = { ...m, ...partial };
        next.bio = clampBio(next.bio);
        return next;
      }),
    );
  };

  const addMember = () => {
    if (members.length >= EQUIPE_MEMBERS_MAX) {
      toast.error(`Maximum ${EQUIPE_MEMBERS_MAX} membres.`);
      return;
    }
    patchMembers([...members, createDefaultEquipeMember(members.length)]);
  };

  const removeMember = (index: number) => {
    patchMembers(members.filter((_, i) => i !== index));
  };

  const moveMember = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= members.length) return;
    const next = [...members];
    const t = next[index];
    next[index] = next[to]!;
    next[to] = t!;
    patchMembers(next);
  };

  const handleFile = async (index: number, file: File | undefined) => {
    if (!file) return;
    setUploadingIndex(index);
    try {
      const { url, usedFallback } = await uploadLandingPageImage(file, "equipe-remess");
      patchMember(index, { photoUrl: url });
      if (usedFallback) {
        toast.warning("Image enregistrée en local", {
          description:
            "Le stockage distant n’est pas disponible : l’image est intégrée pour cette session.",
        });
      } else {
        toast.success("Photo téléversée");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du téléversement");
    } finally {
      setUploadingIndex(null);
      const id = members[index]?.id;
      if (id && fileRefs.current[id]) fileRefs.current[id]!.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {members.length} / {EQUIPE_MEMBERS_MAX} membres · bio max. {EQUIPE_BIO_MAX_CHARS} caractères
        </p>
        <Button type="button" size="sm" className="gap-2" onClick={addMember}>
          <Plus className="h-4 w-4" aria-hidden />
          Ajouter un membre
        </Button>
      </div>

      {members.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Aucun membre. Utilisez « Ajouter un membre » pour commencer.
        </p>
      ) : (
        <div className="space-y-4">
          {members.map((m, index) => (
            <Card key={m.id} className="overflow-hidden shadow-sm">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 border-b border-border bg-muted/30 py-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Users className="h-4 w-4 text-primary" aria-hidden />
                  Membre {index + 1}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === 0}
                    aria-label="Monter"
                    onClick={() => moveMember(index, -1)}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === members.length - 1}
                    aria-label="Descendre"
                    onClick={() => moveMember(index, 1)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-destructive hover:text-destructive"
                    onClick={() => removeMember(index)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Retirer
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Photo</Label>
                  <input
                    ref={(el) => {
                      fileRefs.current[m.id] = el;
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={(e) => void handleFile(index, e.target.files?.[0])}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={uploadingIndex === index}
                      onClick={() => fileRefs.current[m.id]?.click()}
                    >
                      <ImagePlus className="h-4 w-4" aria-hidden />
                      {uploadingIndex === index ? "Téléversement…" : "Choisir une image"}
                    </Button>
                    {m.photoUrl.trim().length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => patchMember(index, { photoUrl: "" })}
                      >
                        Retirer la photo
                      </Button>
                    )}
                  </div>
                  <Input
                    value={m.photoUrl}
                    onChange={(e) => patchMember(index, { photoUrl: e.target.value })}
                    placeholder="Ou URL de l’image (https://…)"
                  />
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`eq-name-${m.id}`}>Nom complet</Label>
                    <Input
                      id={`eq-name-${m.id}`}
                      value={m.fullName}
                      onChange={(e) => patchMember(index, { fullName: e.target.value })}
                      placeholder="Prénom Nom"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`eq-fn-${m.id}`}>Fonction</Label>
                    <Input
                      id={`eq-fn-${m.id}`}
                      value={m.functionTitle}
                      onChange={(e) => patchMember(index, { functionTitle: e.target.value })}
                      placeholder="Rôle au REMESS"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`eq-bio-${m.id}`}>
                    Bio (max. {EQUIPE_BIO_MAX_CHARS} caractères, visible au survol de la carte)
                  </Label>
                  <Textarea
                    id={`eq-bio-${m.id}`}
                    value={m.bio}
                    maxLength={EQUIPE_BIO_MAX_CHARS}
                    rows={4}
                    onChange={(e) => patchMember(index, { bio: e.target.value })}
                    placeholder="Présentation courte…"
                    className="resize-y min-h-[5rem]"
                  />
                  <p className="text-right text-xs text-muted-foreground">
                    {m.bio.length} / {EQUIPE_BIO_MAX_CHARS}
                  </p>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`eq-li-${m.id}`}>LinkedIn (URL)</Label>
                    <Input
                      id={`eq-li-${m.id}`}
                      value={m.linkedinUrl}
                      onChange={(e) => patchMember(index, { linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/…"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`eq-mail-${m.id}`}>E-mail</Label>
                    <Input
                      id={`eq-mail-${m.id}`}
                      type="email"
                      value={m.email}
                      onChange={(e) => patchMember(index, { email: e.target.value })}
                      placeholder="contact@…"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function clampBio(s: string): string {
  return s.length > EQUIPE_BIO_MAX_CHARS ? s.slice(0, EQUIPE_BIO_MAX_CHARS) : s;
}
