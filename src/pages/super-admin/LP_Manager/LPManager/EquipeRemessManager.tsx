import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, ImagePlus, Plus, Trash2, Users, X } from "lucide-react";
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
  EQUIPE_SKILLS_MAX,
  type EquipeMember,
  type EquipeRemessContent,
  type EquipeSkill,
} from "../types";

type EquipeRemessManagerProps = {
  value: EquipeRemessContent;
  onChange: (next: EquipeRemessContent) => void;
};

type SkillDraft = { name: string; percentage: string };

export function EquipeRemessManager({ value, onChange }: EquipeRemessManagerProps) {
  const members = value.members ?? [];
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [skillDrafts, setSkillDrafts] = useState<Record<string, SkillDraft>>({});
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
        if (partial.skills !== undefined) {
          next.skills = normalizeSkills(partial.skills);
        }
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

  const getDraft = (id: string): SkillDraft =>
    skillDrafts[id] ?? { name: "", percentage: "80" };

  const addSkill = (index: number) => {
    const m = members[index];
    if (!m) return;
    const draft = getDraft(m.id);
    const name = draft.name.trim();
    if (!name) {
      toast.error("Indiquez le nom de la compétence.");
      return;
    }
    const percentage = clampPct(Number(draft.percentage));
    const skills = m.skills ?? [];
    if (skills.length >= EQUIPE_SKILLS_MAX) {
      toast.error(`Maximum ${EQUIPE_SKILLS_MAX} compétences.`);
      return;
    }
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Cette compétence est déjà ajoutée.");
      return;
    }
    patchMember(index, { skills: [...skills, { name, percentage }] });
    setSkillDrafts((prev) => ({ ...prev, [m.id]: { name: "", percentage: "80" } }));
  };

  const updateSkill = (index: number, skillName: string, partial: Partial<EquipeSkill>) => {
    const m = members[index];
    if (!m) return;
    patchMember(index, {
      skills: (m.skills ?? []).map((s) =>
        s.name === skillName
          ? {
              name: partial.name !== undefined ? partial.name.trim() || s.name : s.name,
              percentage:
                partial.percentage !== undefined ? clampPct(partial.percentage) : s.percentage,
            }
          : s,
      ),
    });
  };

  const removeSkill = (index: number, skillName: string) => {
    const m = members[index];
    if (!m) return;
    patchMember(index, { skills: (m.skills ?? []).filter((s) => s.name !== skillName) });
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
          {members.length} / {EQUIPE_MEMBERS_MAX} membres · bio max. {EQUIPE_BIO_MAX_CHARS}{" "}
          caractères · {EQUIPE_SKILLS_MAX} compétences max. (avec %).
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
          {members.map((m, index) => {
            const draft = getDraft(m.id);
            return (
              <Card key={m.id} className="overflow-hidden shadow-sm">
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 border-b border-border bg-muted/30 py-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Users className="h-4 w-4 text-primary" aria-hidden />
                    Membre {index + 1}
                    {index === 0 ? (
                      <span className="text-xs font-normal text-muted-foreground">
                        (profil principal par défaut)
                      </span>
                    ) : null}
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
                      Bio (max. {EQUIPE_BIO_MAX_CHARS} caractères)
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

                  <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                    <div className="space-y-1">
                      <Label>Compétences (bandeau %, max. {EQUIPE_SKILLS_MAX})</Label>
                      <p className="text-xs text-muted-foreground">
                        Nom + pourcentage affichés à droite du profil principal.
                      </p>
                    </div>
                    {(m.skills ?? []).length > 0 ? (
                      <ul className="space-y-2">
                        {(m.skills ?? []).map((skill) => (
                          <li
                            key={skill.name}
                            className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-2"
                          >
                            <Input
                              value={skill.name}
                              onChange={(e) =>
                                updateSkill(index, skill.name, { name: e.target.value })
                              }
                              className="min-w-[8rem] flex-1"
                              placeholder="Compétence"
                            />
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={skill.percentage}
                                onChange={(e) =>
                                  updateSkill(index, skill.name, {
                                    percentage: Number(e.target.value),
                                  })
                                }
                                className="w-20"
                                aria-label={`Pourcentage ${skill.name}`}
                              />
                              <span className="text-xs text-muted-foreground">%</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              aria-label={`Retirer ${skill.name}`}
                              onClick={() => removeSkill(index, skill.name)}
                            >
                              <X className="h-4 w-4" aria-hidden />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="min-w-[10rem] flex-1 space-y-1">
                        <Label className="text-xs">Nom</Label>
                        <Input
                          value={draft.name}
                          onChange={(e) =>
                            setSkillDrafts((prev) => ({
                              ...prev,
                              [m.id]: { ...draft, name: e.target.value },
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addSkill(index);
                            }
                          }}
                          placeholder="ex. Gouvernance"
                          disabled={(m.skills ?? []).length >= EQUIPE_SKILLS_MAX}
                        />
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-xs">%</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={draft.percentage}
                          onChange={(e) =>
                            setSkillDrafts((prev) => ({
                              ...prev,
                              [m.id]: { ...draft, percentage: e.target.value },
                            }))
                          }
                          disabled={(m.skills ?? []).length >= EQUIPE_SKILLS_MAX}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={(m.skills ?? []).length >= EQUIPE_SKILLS_MAX}
                        onClick={() => addSkill(index)}
                      >
                        Ajouter
                      </Button>
                    </div>
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
            );
          })}
        </div>
      )}
    </div>
  );
}

function clampBio(s: string): string {
  return s.length > EQUIPE_BIO_MAX_CHARS ? s.slice(0, EQUIPE_BIO_MAX_CHARS) : s;
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizeSkills(skills: EquipeSkill[]): EquipeSkill[] {
  return skills
    .map((s) => ({
      name: typeof s.name === "string" ? s.name.trim() : "",
      percentage: clampPct(s.percentage),
    }))
    .filter((s) => s.name.length > 0)
    .slice(0, EQUIPE_SKILLS_MAX);
}
