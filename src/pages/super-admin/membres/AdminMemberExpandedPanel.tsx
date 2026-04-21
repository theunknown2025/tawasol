import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAdminMemberDetail } from "@/hooks/useAdminMemberDetail";
import { ADMIN_DOC_CATEGORY_LABELS } from "@/lib/adminProfileApi";
import type { Profile } from "@/lib/supabase";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

const formatDate = (s: string) => new Date(s).toLocaleDateString("fr-FR");

interface AdminMemberExpandedPanelProps {
  member: Profile;
}

export function AdminMemberExpandedPanel({ member }: AdminMemberExpandedPanelProps) {
  const { data, isLoading, signedUrlFor } = useAdminMemberDetail(member);

  /** Ouvre l’onglet tout de suite (geste utilisateur) pour éviter le blocage des popups après un await. */
  const openPreview = (path: string) => {
    const tab = window.open("about:blank", "_blank");
    if (!tab) {
      toast.error("Fenêtre bloquée : autorisez les popups pour ce site pour voir les documents.");
      return;
    }
    void (async () => {
      try {
        const url = await signedUrlFor(path);
        tab.location.assign(url);
      } catch (e) {
        tab.close();
        const msg =
          e instanceof Error
            ? e.message
            : typeof e === "object" && e !== null && "message" in e
              ? String((e as { message: unknown }).message)
              : "Impossible d’ouvrir le document";
        toast.error(msg);
      }
    })();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 text-sm">
      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Compte</h4>
        <dl className="grid gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{member.email}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground">Date de création</dt>
            <dd>{formatDate(member.created_at)}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground">Tél</dt>
            <dd>{member.phone ?? "—"}</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:col-span-2">
            <dt className="text-muted-foreground">Adresse</dt>
            <dd>{member.address ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <Separator />

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Information membre
        </h4>
        {data?.org ? (
          <dl className="grid gap-2 sm:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Nom</dt>
              <dd className="font-medium">{data.org.organization_name ?? "—"}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{data.org.contact_email ?? "—"}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Tél</dt>
              <dd>{data.org.contact_phone ?? "—"}</dd>
            </div>
            <div className="flex flex-col gap-0.5 sm:col-span-2">
              <dt className="text-muted-foreground">Adresse</dt>
              <dd>{data.org.contact_address ?? "—"}</dd>
            </div>
            {data.org.description ? (
              <div className="sm:col-span-2">
                <dt className="mb-1 text-muted-foreground">Description</dt>
                <dd className="whitespace-pre-wrap rounded-lg bg-background/80 p-3 text-foreground">
                  {data.org.description}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="text-muted-foreground">Aucune fiche organisation renseignée.</p>
        )}
      </section>

      {data && data.links.length > 0 ? (
        <>
          <Separator />
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Liens</h4>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {data.links.map((l) => (
                <li key={l.id}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {l.label || l.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      <Separator />

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Représentant
        </h4>
        {data?.org &&
        (data.org.rep_full_name ||
          data.org.rep_fonction ||
          data.org.rep_email ||
          data.org.rep_phone) ? (
          <dl className="grid gap-2 sm:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Nom complet</dt>
              <dd>{data.org.rep_full_name ?? "—"}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Fonction</dt>
              <dd>{data.org.rep_fonction ?? "—"}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{data.org.rep_email ?? "—"}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Tél</dt>
              <dd>{data.org.rep_phone ?? "—"}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground">Non renseigné.</p>
        )}
      </section>

      <Separator />

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Statut</h4>
        <ul className="grid gap-1 sm:grid-cols-2">
          <li>Liste de membre : {data?.org?.statut_liste_membre ? "Oui" : "Non"}</li>
          <li>Assemblée générale : {data?.org?.statut_assemblee_generale ? "Oui" : "Non"}</li>
          <li>Bilan d&apos;activité : {data?.org?.statut_bilan_activite ? "Oui" : "Non"}</li>
          <li>Bilan financier : {data?.org?.statut_bilan_financier ? "Oui" : "Non"}</li>
        </ul>
      </section>

      <Separator />

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Documents administratifs
        </h4>
        {!data?.docs?.length ? (
          <p className="text-muted-foreground">Aucun document.</p>
        ) : (
          <ul className="space-y-2">
            {data.docs.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card/50 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{d.file_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {ADMIN_DOC_CATEGORY_LABELS[d.category]}
                    </div>
                  </div>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => openPreview(d.storage_path)}>
                  Aperçu
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
