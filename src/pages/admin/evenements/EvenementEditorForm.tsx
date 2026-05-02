import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, Link2, Upload, X, FileText, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SelectedFile } from "./types";
import { AdminEventPreviewPanel } from "./AdminEventPreviewPanel";
import { formatEventDateRange, formatFrDate, isoDateFromLocal, parseIsoDateLocal } from "./eventDates";

export type EvenementFormSubmitPayload = {
  titre: string;
  description: string;
  banner?: File | null;
  eventDateStart: string | null;
  eventDateEnd: string | null;
  deadlineInscription: string | null;
  liens: string[];
  files: { file: File; name: string; type: string }[];
  registrationFormId: string | null;
};

type FormProps = {
  mode: "create" | "edit";
  forms: { id: string; title: string }[];
  initialTitre?: string;
  initialDescription?: string;
  initialEventDateStart?: string | null;
  initialEventDateEnd?: string | null;
  initialDeadlineInscription?: string | null;
  initialLiens?: string[];
  initialRegistrationFormId?: string | null;
  /** Bannière actuelle (URL) en mode édition */
  existingBannerUrl?: string | null;
  /** Noms des fichiers déjà enregistrés (aperçu) */
  existingFileNames?: string[];
  onSubmit: (payload: EvenementFormSubmitPayload) => Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
  showReset?: boolean;
};

export function EvenementEditorForm({
  mode,
  forms,
  initialTitre = "",
  initialDescription = "",
  initialEventDateStart = null,
  initialEventDateEnd = null,
  initialDeadlineInscription = null,
  initialLiens,
  initialRegistrationFormId = null,
  existingBannerUrl = null,
  existingFileNames = [],
  onSubmit,
  submitLabel,
  isSubmitting,
  showReset = true,
}: FormProps) {
  const [titre, setTitre] = useState(initialTitre);
  const [description, setDescription] = useState(initialDescription);
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (initialEventDateStart) {
      const from = parseIsoDateLocal(initialEventDateStart);
      const to = initialEventDateEnd ? parseIsoDateLocal(initialEventDateEnd) : undefined;
      return { from, to: to ?? from };
    }
    return undefined;
  });
  const [deadline, setDeadline] = useState<Date | undefined>(() =>
    initialDeadlineInscription ? parseIsoDateLocal(initialDeadlineInscription) : undefined,
  );
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [liens, setLiens] = useState<string[]>(() =>
    initialLiens && initialLiens.length > 0 ? initialLiens : [""],
  );
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [registrationFormId, setRegistrationFormId] = useState<string>(
    initialRegistrationFormId ?? "none",
  );

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cancelNewBanner = useCallback(() => {
    setBannerPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setBanner(null);
  }, []);

  const syncKey = [
    initialTitre,
    initialDescription,
    initialEventDateStart,
    initialEventDateEnd,
    initialDeadlineInscription,
    initialRegistrationFormId,
    existingBannerUrl,
    JSON.stringify(initialLiens ?? []),
  ].join("|");

  useEffect(() => {
    cancelNewBanner();
    setTitre(initialTitre);
    setDescription(initialDescription);
    if (initialEventDateStart) {
      const from = parseIsoDateLocal(initialEventDateStart);
      const to = initialEventDateEnd ? parseIsoDateLocal(initialEventDateEnd) : undefined;
      setDateRange({ from, to: to ?? from });
    } else {
      setDateRange(undefined);
    }
    setDeadline(
      initialDeadlineInscription ? parseIsoDateLocal(initialDeadlineInscription) : undefined,
    );
    setLiens(initialLiens && initialLiens.length > 0 ? initialLiens : [""]);
    setSelectedFiles([]);
    setRegistrationFormId(initialRegistrationFormId ?? "none");
  }, [syncKey, cancelNewBanner]);

  const displayBannerUrl = bannerPreview ?? existingBannerUrl ?? null;

  const eventDateStartStr = dateRange?.from ? isoDateFromLocal(dateRange.from) : null;
  const eventDateEndStr = dateRange?.to
    ? isoDateFromLocal(dateRange.to)
    : dateRange?.from
      ? isoDateFromLocal(dateRange.from)
      : null;

  const deadlineStr = deadline ? isoDateFromLocal(deadline) : null;

  const registrationFormTitle = useMemo(() => {
    if (registrationFormId === "none") return null;
    return forms.find((f) => f.id === registrationFormId)?.title ?? null;
  }, [forms, registrationFormId]);

  const rangeLabel = useMemo(() => {
    if (!dateRange?.from) return null;
    if (dateRange.to)
      return formatEventDateRange(
        isoDateFromLocal(dateRange.from),
        isoDateFromLocal(dateRange.to),
      );
    return formatFrDate(isoDateFromLocal(dateRange.from));
  }, [dateRange]);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBanner(f);
    setBannerPreview(URL.createObjectURL(f));
    e.target.value = "";
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
    cancelNewBanner();
    setDateRange(undefined);
    setDeadline(undefined);
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
      eventDateStart: eventDateStartStr,
      eventDateEnd: eventDateEndStr,
      deadlineInscription: deadlineStr,
      liens: liens.filter((l) => l.trim()),
      files: selectedFiles.map(({ file, name, type }) => ({ file, name, type })),
      registrationFormId: registrationFormId === "none" ? null : registrationFormId,
    });
    if (mode === "create") {
      resetForm();
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr,min(380px,40%)] lg:items-start">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-foreground">
          {mode === "create" ? "Nouvel événement" : "Modifier l’événement"}
        </h2>

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
          <Label>Bannière</Label>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBannerChange}
          />
          {displayBannerUrl ? (
            <div className="relative inline-block max-w-full">
              <img
                src={displayBannerUrl}
                alt="Bannière"
                className="h-32 max-w-full rounded-lg border object-cover"
              />
              {bannerPreview ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                  onClick={cancelNewBanner}
                  title="Annuler la nouvelle image"
                >
                  <X size={12} />
                </Button>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => bannerInputRef.current?.click()}
              className="gap-2"
            >
              <ImageIcon size={16} />
              {displayBannerUrl ? "Remplacer l’image" : "Choisir une image"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Dates de l’événement</Label>
            <Popover open={rangeOpen} onOpenChange={setRangeOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {rangeLabel ?? "Du … au …"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(r) => {
                    setDateRange(r);
                    if (r?.from && r?.to) setRangeOpen(false);
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Date limite d’inscription</Label>
            <Popover open={deadlineOpen} onOpenChange={setDeadlineOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {deadline ? formatFrDate(deadlineStr!) : "Choisir le jour limite"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={(d) => {
                    setDeadline(d);
                    setDeadlineOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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
          <Label>Formulaire d’inscription</Label>
          <Select value={registrationFormId} onValueChange={setRegistrationFormId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un formulaire" />
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
          {existingFileNames.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {existingFileNames.map((name) => (
                <li
                  key={name}
                  className="flex items-center gap-2 rounded-lg bg-muted/80 px-2 py-1 text-sm text-muted-foreground"
                >
                  <FileText size={14} />
                  <span className="max-w-[180px] truncate">{name}</span>
                  <span className="text-xs">(enregistré)</span>
                </li>
              ))}
            </ul>
          )}
          {selectedFiles.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {selectedFiles.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-lg bg-muted px-2 py-1 text-sm"
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

        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {submitLabel}
          </Button>
          {showReset && mode === "create" ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              Réinitialiser
            </Button>
          ) : null}
        </div>
      </form>

      <AdminEventPreviewPanel
        titre={titre}
        description={description}
        bannerPreviewUrl={displayBannerUrl}
        eventDateStart={eventDateStartStr}
        eventDateEnd={eventDateEndStr}
        deadlineInscription={deadlineStr}
        liens={liens}
        existingFileNames={existingFileNames}
        newFiles={selectedFiles}
        registrationFormTitle={registrationFormTitle}
      />
    </div>
  );
}
