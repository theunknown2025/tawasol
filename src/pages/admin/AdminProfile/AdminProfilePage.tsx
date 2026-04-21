import { useEffect, useRef, useState, useCallback } from "react";
import { Building2, Loader2, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LinksEditor, type LinkDraft } from "./LinksEditor";
import {
  ADMIN_DOC_CATEGORY_LABELS,
  type AdminDocCategory,
  type AdminOrgProfileInput,
} from "@/lib/adminProfileApi";
import { toast } from "sonner";
import { ProfilePreview } from "./ProfilePreview";

const emptyOrg = (): AdminOrgProfileInput => ({
  organization_name: null,
  contact_email: null,
  contact_phone: null,
  contact_address: null,
  description: null,
  rep_full_name: null,
  rep_fonction: null,
  rep_email: null,
  rep_phone: null,
  statut_liste_membre: false,
  statut_assemblee_generale: false,
  statut_bilan_activite: false,
  statut_bilan_financier: false,
});

const formatCreated = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function AdminProfilePage() {
  const { profile } = useAuth();
  const {
    data,
    isLoading,
    saveProfile,
    saveLoading,
    uploadDocument,
    uploadLoading,
    deleteDocument,
    deleteLoading,
  } = useAdminProfile();

  const [org, setOrg] = useState<AdminOrgProfileInput>(emptyOrg);
  const [links, setLinks] = useState<LinkDraft[]>([]);
  const [docCategory, setDocCategory] = useState<AdminDocCategory>("autre");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formHydrated = useRef(false);

  const hydrateForm = useCallback(() => {
    if (!data) return;
    const row = data.org;
    if (row) {
      setOrg({
        organization_name: row.organization_name,
        contact_email: row.contact_email,
        contact_phone: row.contact_phone,
        contact_address: row.contact_address,
        description: row.description,
        rep_full_name: row.rep_full_name,
        rep_fonction: row.rep_fonction,
        rep_email: row.rep_email,
        rep_phone: row.rep_phone,
        statut_liste_membre: row.statut_liste_membre,
        statut_assemblee_generale: row.statut_assemblee_generale,
        statut_bilan_activite: row.statut_bilan_activite,
        statut_bilan_financier: row.statut_bilan_financier,
      });
    } else if (profile) {
      setOrg({
        ...emptyOrg(),
        organization_name: profile.full_name,
        contact_email: profile.email,
        contact_phone: profile.phone,
        contact_address: profile.address,
      });
    }
    setLinks(
      data.links.map((l, i) => ({
        label: l.label ?? "",
        url: l.url,
        sort_order: l.sort_order ?? i,
      }))
    );
  }, [data, profile]);

  useEffect(() => {
    if (!data || formHydrated.current) return;
    formHydrated.current = true;
    hydrateForm();
  }, [data, hydrateForm]);

  useEffect(() => {
    return () => {
      formHydrated.current = false;
    };
  }, []);

  const handleSave = async () => {
    const validLinks = links.filter((l) => l.url.trim().length > 0);
    try {
      await saveProfile({
        org,
        links: validLinks.map((l, i) => ({ ...l, sort_order: i })),
      });
      setIsPreviewMode(true);
      toast.success("Profil enregistré");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur à l’enregistrement");
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await uploadDocument({ file, category: docCategory });
      toast.success("Document téléversé");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du téléversement");
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isPreviewMode) {
    return (
      <ProfilePreview
        organization={org}
        links={links}
        createdAt={profile.created_at}
        documents={(data?.docs ?? []).map((d) => ({
          id: d.id,
          file_name: d.file_name,
          category: d.category,
        }))}
        onEdit={() => setIsPreviewMode(false)}
      />
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2">
          <Building2 className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profil organisation</h1>
          <p className="text-muted-foreground text-sm">
            Informations membre, représentant, statuts et documents administratifs.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Information membre</CardTitle>
          <CardDescription>Données de l&apos;organisation associée à votre compte admin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Nom</Label>
              <Input
                id="org-name"
                value={org.organization_name ?? ""}
                onChange={(e) => setOrg({ ...org, organization_name: e.target.value || null })}
                placeholder="Nom de l’organisation"
              />
            </div>
            <div className="space-y-2">
              <Label>Date de création</Label>
              <Input readOnly value={formatCreated(profile.created_at)} className="bg-muted/50" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="org-address">Adresse</Label>
              <Input
                id="org-address"
                value={org.contact_address ?? ""}
                onChange={(e) => setOrg({ ...org, contact_address: e.target.value || null })}
                placeholder="Adresse complète"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-email">Email</Label>
              <Input
                id="org-email"
                type="email"
                value={org.contact_email ?? ""}
                onChange={(e) => setOrg({ ...org, contact_email: e.target.value || null })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-phone">Tél</Label>
              <Input
                id="org-phone"
                value={org.contact_phone ?? ""}
                onChange={(e) => setOrg({ ...org, contact_phone: e.target.value || null })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="org-desc">Description</Label>
              <Textarea
                id="org-desc"
                rows={4}
                value={org.description ?? ""}
                onChange={(e) => setOrg({ ...org, description: e.target.value || null })}
                placeholder="Présentation de l’organisation…"
              />
            </div>
          </div>
          <LinksEditor links={links} onChange={setLinks} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Information représentant</CardTitle>
          <CardDescription>Contact officiel du représentant légal ou délégué.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="rep-name">Nom complet</Label>
            <Input
              id="rep-name"
              value={org.rep_full_name ?? ""}
              onChange={(e) => setOrg({ ...org, rep_full_name: e.target.value || null })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rep-fn">Fonction</Label>
            <Input
              id="rep-fn"
              value={org.rep_fonction ?? ""}
              onChange={(e) => setOrg({ ...org, rep_fonction: e.target.value || null })}
              placeholder="Directeur·rice, président·e…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rep-email">Email</Label>
            <Input
              id="rep-email"
              type="email"
              value={org.rep_email ?? ""}
              onChange={(e) => setOrg({ ...org, rep_email: e.target.value || null })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="rep-phone">Tél</Label>
            <Input
              id="rep-phone"
              value={org.rep_phone ?? ""}
              onChange={(e) => setOrg({ ...org, rep_phone: e.target.value || null })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statut</CardTitle>
          <CardDescription>Indicateurs de conformité ou de complétude.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={org.statut_liste_membre}
              onCheckedChange={(v) => setOrg({ ...org, statut_liste_membre: v === true })}
            />
            <span className="text-sm font-medium">Liste de membre</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={org.statut_assemblee_generale}
              onCheckedChange={(v) => setOrg({ ...org, statut_assemblee_generale: v === true })}
            />
            <span className="text-sm font-medium">Assemblée générale</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={org.statut_bilan_activite}
              onCheckedChange={(v) => setOrg({ ...org, statut_bilan_activite: v === true })}
            />
            <span className="text-sm font-medium">Bilan d&apos;activité</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={org.statut_bilan_financier}
              onCheckedChange={(v) => setOrg({ ...org, statut_bilan_financier: v === true })}
            />
            <span className="text-sm font-medium">Bilan financier</span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents administratifs (optionnel)</CardTitle>
          <CardDescription>
            PDF ou images (max. 50 Mo). Stockage sécurisé — visible par vous et le super admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-2 flex-1">
              <Label>Catégorie</Label>
              <Select value={docCategory} onValueChange={(v) => setDocCategory(v as AdminDocCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ADMIN_DOC_CATEGORY_LABELS) as AdminDocCategory[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {ADMIN_DOC_CATEGORY_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={onFile}
                accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={uploadLoading}
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                {uploadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Choisir un fichier
              </Button>
            </div>
          </div>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {(data?.docs ?? []).length === 0 ? (
              <li className="p-4 text-sm text-muted-foreground">Aucun document.</li>
            ) : (
              (data?.docs ?? []).map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                  <div>
                    <span className="font-medium">{d.file_name}</span>
                    <span className="text-muted-foreground ml-2">
                      ({ADMIN_DOC_CATEGORY_LABELS[d.category]})
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={deleteLoading}
                    onClick={async () => {
                      try {
                        await deleteDocument(d);
                        toast.success("Document supprimé");
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Erreur");
                      }
                    }}
                  >
                    Supprimer
                  </Button>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={saveLoading} className="gap-2">
          {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer le profil
        </Button>
      </div>
    </div>
  );
}
