import { useRef, useState } from "react";
import { Link2, Upload, X, FileText, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SelectedFile } from "./types";

interface NouveauEventProps {
  forms: { id: string; title: string }[];
  onSubmit: (data: {
    titre: string;
    description: string;
    banner?: File | null;
    duree: string;
    deadlineInscription: string | null;
    liens: string[];
    files: { file: File; name: string; type: string }[];
    registrationFormId: string | null;
  }) => Promise<void>;
  onCreateSuccess: () => void;
  isCreating: boolean;
}

export function NouveauEvent({
  forms,
  onSubmit,
  onCreateSuccess,
  isCreating,
}: NouveauEventProps) {
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [duree, setDuree] = useState("");
  const [deadlineInscription, setDeadlineInscription] = useState("");
  const [liens, setLiens] = useState<string[]>([""]);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [registrationFormId, setRegistrationFormId] = useState<string>("none");
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBanner(f);
    setBannerPreview(URL.createObjectURL(f));
    e.target.value = "";
  };

  const removeBanner = () => {
    setBanner(null);
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerPreview(null);
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    setSelectedFiles((prev) => [
      ...prev,
      ...Array.from(selected).map((f) => ({ file: f, name: f.name, type: f.type })),
    ]);
    e.target.value = "";
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const addLien = () => setLiens((prev) => [...prev, ""]);
  const updateLien = (idx: number, val: string) => {
    setLiens((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };
  const removeLien = (idx: number) => {
    setLiens((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setTitre("");
    setDescription("");
    removeBanner();
    setDuree("");
    setDeadlineInscription("");
    setLiens([""]);
    setSelectedFiles([]);
    setRegistrationFormId("none");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;
    await onSubmit({
      titre: titre.trim(),
      description: description.trim(),
      banner: banner ?? undefined,
      duree: duree.trim() || undefined,
      deadlineInscription: deadlineInscription.trim() || null,
      liens: liens.filter((l) => l.trim()),
      files: selectedFiles.map(({ file, name, type }) => ({ file, name, type })),
      registrationFormId: registrationFormId === "none" ? null : registrationFormId,
    });
    resetForm();
    onCreateSuccess();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6 max-w-2xl"
    >
      <h2 className="text-lg font-semibold text-foreground">Nouveau événement</h2>

      <div className="space-y-2">
        <Label htmlFor="titre">Titre</Label>
        <Input
          id="titre"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Titre de l'événement"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description détaillée"
          className="min-h-[100px] resize-y"
        />
      </div>

      <div className="space-y-2">
        <Label>Banner</Label>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBannerChange}
        />
        {bannerPreview ? (
          <div className="relative inline-block">
            <img
              src={bannerPreview}
              alt="Banner"
              className="h-32 rounded-lg object-cover border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={removeBanner}
            >
              <X size={12} />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => bannerInputRef.current?.click()}
            className="gap-2"
          >
            <ImageIcon size={16} />
            Choisir une image
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duree">Durée</Label>
          <Input
            id="duree"
            value={duree}
            onChange={(e) => setDuree(e.target.value)}
            placeholder="ex: 2 heures, 1 journée"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline d'inscription</Label>
          <Input
            id="deadline"
            type="datetime-local"
            value={deadlineInscription}
            onChange={(e) => setDeadlineInscription(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Liens</Label>
          <Button type="button" variant="ghost" size="sm" onClick={addLien} className="gap-1">
            <Link2 size={14} />
            Ajouter un lien
          </Button>
        </div>
        <div className="space-y-2">
          {liens.map((l, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={l}
                onChange={(e) => updateLien(i, e.target.value)}
                placeholder="https://..."
                type="url"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeLien(i)}
                disabled={liens.length === 1}
              >
                <X size={14} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Choisir Formulaire</Label>
        <Select value={registrationFormId} onValueChange={setRegistrationFormId}>
          <SelectTrigger>
            <SelectValue placeholder="Selectionnez un formulaire" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun formulaire</SelectItem>
            {forms.map((form) => (
              <SelectItem key={form.id} value={form.id}>
                {form.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Fichier(s)</Label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <Upload size={16} />
          Ajouter des fichiers
        </Button>
        {selectedFiles.length > 0 && (
          <ul className="flex flex-wrap gap-2 mt-2">
            {selectedFiles.map((f, i) => (
              <li
                key={i}
                className="flex items-center gap-2 bg-muted rounded-lg px-2 py-1 text-sm"
              >
                <FileText size={14} />
                <span className="max-w-[120px] truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isCreating}>
          Créer l'événement
        </Button>
        <Button type="button" variant="outline" onClick={resetForm}>
          Réinitialiser
        </Button>
      </div>
    </form>
  );
}
