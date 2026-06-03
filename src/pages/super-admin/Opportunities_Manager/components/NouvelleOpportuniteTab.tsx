import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/rich-text/RichTextEditor";
import { isRichTextEmpty } from "@/components/rich-text/richTextUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type {
  Opportunity,
  OpportunityInput,
  OpportunityType,
  OpportunityFormat,
  OpportunityContractType,
} from "@/types/opportunity";
import { OPPORTUNITY_CONTRACT_TYPE_LABELS } from "@/types/opportunity";
import type { HeroSlideBackground } from "@/pages/super-admin/LP_Manager/types";
import OpportunityBannerEditor from "./OpportunityBannerEditor";
import OpportunityPreviewPanel from "./OpportunityPreviewPanel";
import OpportunityDurationPicker from "./OpportunityDurationPicker";
import OpportunityDocumentsEditor from "./OpportunityDocumentsEditor";

type NouvelleOpportuniteTabProps = {
  editingOpportunity: Opportunity | null;
  publishedForms: { id: string; title: string }[];
  onCancelEdit: () => void;
  onSave: (id: string | null, payload: OpportunityInput) => Promise<void>;
  onBannerUpload: (file: File) => Promise<string>;
  onDocumentUpload: (file: File, label: string) => Promise<{ id: string; label: string; url: string; fileName: string }>;
  isSubmitting: boolean;
  isUploadingBanner: boolean;
  isUploadingDocument: boolean;
};

const defaultBanner: HeroSlideBackground = { type: "solid", color: "#059669" };

export default function NouvelleOpportuniteTab({
  editingOpportunity,
  publishedForms,
  onCancelEdit,
  onSave,
  onBannerUpload,
  onDocumentUpload,
  isSubmitting,
  isUploadingBanner,
  isUploadingDocument,
}: NouvelleOpportuniteTabProps) {
  const [title, setTitle] = useState("");
  const [opportunityType, setOpportunityType] = useState<OpportunityType>("emploi");
  const [format, setFormat] = useState<OpportunityFormat>("presentiel");
  const [contractType, setContractType] = useState<OpportunityContractType | "">("");
  const [durationStart, setDurationStart] = useState<string | null>(null);
  const [durationEnd, setDurationEnd] = useState<string | null>(null);
  const [salaryMad, setSalaryMad] = useState("");
  const [deadline, setDeadline] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [banner, setBanner] = useState<HeroSlideBackground>(defaultBanner);
  const [registrationFormId, setRegistrationFormId] = useState<string>("");
  const [documents, setDocuments] = useState<Opportunity["documents"]>([]);

  useEffect(() => {
    if (!editingOpportunity) {
      setTitle("");
      setOpportunityType("emploi");
      setFormat("presentiel");
      setContractType("");
      setDurationStart(null);
      setDurationEnd(null);
      setSalaryMad("");
      setDeadline("");
      setLocation("");
      setDescription("");
      setBanner(defaultBanner);
      setRegistrationFormId("");
      setDocuments([]);
      return;
    }
    setTitle(editingOpportunity.title);
    setOpportunityType(editingOpportunity.opportunityType);
    setFormat(editingOpportunity.format);
    setContractType(editingOpportunity.contractType ?? "");
    setDurationStart(editingOpportunity.durationStart);
    setDurationEnd(editingOpportunity.durationEnd);
    setSalaryMad(editingOpportunity.salaryMad != null ? String(editingOpportunity.salaryMad) : "");
    setDeadline(editingOpportunity.deadline);
    setLocation(editingOpportunity.location);
    setDescription(editingOpportunity.description);
    setBanner(editingOpportunity.banner);
    setRegistrationFormId(editingOpportunity.registrationFormId ?? "");
    setDocuments(editingOpportunity.documents);
  }, [editingOpportunity]);

  const buildPayload = (status: "draft" | "published"): OpportunityInput => ({
    title: title.trim(),
    opportunityType,
    format,
    contractType: contractType || null,
    durationStart,
    durationEnd,
    salaryMad: salaryMad.trim() ? Number(salaryMad) : null,
    deadline,
    location: location.trim(),
    description: isRichTextEmpty(description) ? "" : description.trim(),
    banner,
    registrationFormId: registrationFormId || null,
    documents,
    status,
  });

  const handleSave = async (status: "draft" | "published") => {
    if (!title.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }
    if (!deadline) {
      toast.error("La date limite est obligatoire");
      return;
    }
    if (!registrationFormId) {
      toast.error("Sélectionnez un formulaire d'inscription");
      return;
    }
    await onSave(editingOpportunity?.id ?? null, buildPayload(status));
  };

  const handleBannerImage = async (file: File) => {
    try {
      const url = await onBannerUpload(file);
      setBanner({
        type: "image",
        url,
        overlayOpacity: banner.type === "image" ? (banner.overlayOpacity ?? 35) : 35,
        positionY: banner.type === "image" ? (banner.positionY ?? banner.positionX ?? 50) : 50,
      });
      toast.success("Image téléversée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de téléversement");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[7fr_3fr]">
      <OpportunityPreviewPanel
        title={title}
        opportunityType={opportunityType}
        format={format}
        contractType={contractType || null}
        durationStart={durationStart}
        durationEnd={durationEnd}
        salaryMad={salaryMad.trim() ? Number(salaryMad) : null}
        deadline={deadline}
        location={location}
        description={description}
        banner={banner}
        documents={documents}
      />

      <div className="min-w-0 space-y-6 rounded-2xl border border-border bg-card p-4 shadow-sm lg:p-5">
        <OpportunityBannerEditor
          value={banner}
          onChange={setBanner}
          onImageUpload={handleBannerImage}
          isUploading={isUploadingBanner}
        />

        <div className="space-y-2">
          <Label htmlFor="opp-title">Titre</Label>
          <Input id="opp-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={opportunityType} onValueChange={(v) => setOpportunityType(v as OpportunityType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="emploi">Emploi</SelectItem>
              <SelectItem value="stage">Stage</SelectItem>
              <SelectItem value="ami">AMI</SelectItem>
              <SelectItem value="tdr">TDR</SelectItem>
              <SelectItem value="formation">Formation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Format</Label>
          <Select value={format} onValueChange={(v) => setFormat(v as OpportunityFormat)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="presentiel">Présentiel</SelectItem>
              <SelectItem value="distance">Distance</SelectItem>
              <SelectItem value="hybride">Hybride</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Type contrat</Label>
          <Select
            value={contractType || undefined}
            onValueChange={(v) => setContractType(v as OpportunityContractType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir un type de contrat" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(OPPORTUNITY_CONTRACT_TYPE_LABELS) as OpportunityContractType[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {OPPORTUNITY_CONTRACT_TYPE_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Durée</Label>
          <OpportunityDurationPicker
            start={durationStart}
            end={durationEnd}
            onChange={(start, end) => {
              setDurationStart(start);
              setDurationEnd(end);
            }}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-1">
          <div className="space-y-2">
            <Label htmlFor="opp-salary">Salaire (MAD, optionnel)</Label>
            <Input
              id="opp-salary"
              type="number"
              min={0}
              value={salaryMad}
              onChange={(e) => setSalaryMad(e.target.value)}
              placeholder="Ex. 12000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opp-deadline">Date limite</Label>
            <Input
              id="opp-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="opp-location">Lieu</Label>
          <Input id="opp-location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="opp-desc">Description</Label>
          <RichTextEditor
            id="opp-desc"
            value={description}
            onChange={setDescription}
            placeholder="Décrivez l'opportunité (gras, italique, couleur, taille, puces, tabulation…)"
            minHeight="180px"
          />
        </div>

        <div className="space-y-2">
          <Label>Formulaire d&apos;inscription</Label>
          <Select value={registrationFormId} onValueChange={setRegistrationFormId}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un formulaire publié" />
            </SelectTrigger>
            <SelectContent>
              {publishedForms.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {publishedForms.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Publiez d&apos;abord un formulaire dans Gestion Form.
            </p>
          )}
        </div>

        <OpportunityDocumentsEditor
          documents={documents}
          onChange={setDocuments}
          onUpload={onDocumentUpload}
          isUploading={isUploadingDocument}
        />

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button type="button" disabled={isSubmitting} onClick={() => void handleSave("draft")}>
            Enregistrer brouillon
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={() => void handleSave("published")}>
            Publier
          </Button>
          {editingOpportunity && (
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancelEdit}>
              Annuler
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
