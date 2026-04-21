import { Building2, CheckCircle2, Circle, Edit3, FileText, Link2, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ADMIN_DOC_CATEGORY_LABELS, type AdminOrgProfileInput } from "@/lib/adminProfileApi";
import type { LinkDraft } from "./LinksEditor";

interface ProfilePreviewProps {
  organization: AdminOrgProfileInput;
  links: LinkDraft[];
  createdAt: string;
  documents: Array<{ id: string; file_name: string; category: keyof typeof ADMIN_DOC_CATEGORY_LABELS }>;
  onEdit: () => void;
}

const valueOrDash = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : "—";
};

const formatCreated = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export function ProfilePreview({
  organization,
  links,
  createdAt,
  documents,
  onEdit,
}: ProfilePreviewProps) {
  const validLinks = links.filter((l) => l.url.trim().length > 0);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Profil enregistré
            </div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              {valueOrDash(organization.organization_name)}
            </CardTitle>
            <CardDescription>Créé le {formatCreated(createdAt)}.</CardDescription>
          </div>
          <Button type="button" onClick={onEdit} className="gap-2">
            <Edit3 className="h-4 w-4" />
            Modifier
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coordonnées organisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {valueOrDash(organization.contact_email)}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {valueOrDash(organization.contact_phone)}
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <span>{valueOrDash(organization.contact_address)}</span>
            </p>
            <p className="whitespace-pre-wrap text-muted-foreground">{valueOrDash(organization.description)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Représentant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              {valueOrDash(organization.rep_full_name)}
            </p>
            <p>{valueOrDash(organization.rep_fonction)}</p>
            <p>{valueOrDash(organization.rep_email)}</p>
            <p>{valueOrDash(organization.rep_phone)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              {organization.statut_liste_membre ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm">Liste de membre</span>
            </div>
            <div className="flex items-center gap-2">
              {organization.statut_assemblee_generale ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm">Assemblée générale</span>
            </div>
            <div className="flex items-center gap-2">
              {organization.statut_bilan_activite ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm">Bilan d&apos;activité</span>
            </div>
            <div className="flex items-center gap-2">
              {organization.statut_bilan_financier ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm">Bilan financier</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Liens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {validLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun lien renseigné.</p>
            ) : (
              validLinks.map((link, index) => (
                <a
                  key={`${link.url}-${index}`}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Link2 className="h-4 w-4" />
                  {valueOrDash(link.label) === "—" ? link.url : link.label}
                </a>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents administratifs</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun document téléversé.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {documents.map((doc) => (
                <Badge key={doc.id} variant="secondary" className="gap-1.5 py-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  {doc.file_name} - {ADMIN_DOC_CATEGORY_LABELS[doc.category]}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
