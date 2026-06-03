import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import RichTextContent from "@/components/rich-text/RichTextContent";
import { isRichTextEmpty } from "@/components/rich-text/richTextUtils";
import OpportunityDetailSidebar from "@/components/opportunities/OpportunityDetailSidebar";
import { OpportunityPublicBannerHero } from "@/pages/super-admin/Opportunities_Manager/components/OpportunityPublicBannerFrame";
import {
  fetchPublicOpportunityBySlug,
  submitOpportunityApplication,
  uploadApplicationFile,
} from "@/lib/opportunitiesApi";
import { OPPORTUNITY_TYPE_LABELS } from "@/types/opportunity";

export default function PublicOpportunityDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["public-opportunity", slug],
    queryFn: () => fetchPublicOpportunityBySlug(slug),
    enabled: !!slug,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error("Opportunité introuvable");
      const fileUploads: Record<string, { url: string; path: string; fileName: string }> = {};
      for (const [fieldId, file] of Object.entries(pendingFiles)) {
        fileUploads[fieldId] = await uploadApplicationFile(data.opportunity.id, fieldId, file);
      }
      await submitOpportunityApplication({
        opportunityId: data.opportunity.id,
        applicantName: name.trim(),
        applicantEmail: email.trim(),
        answers,
        fileUploads,
      });
    },
    onSuccess: () => {
      toast.success("Candidature envoyée");
      setOpen(false);
      setName("");
      setEmail("");
      setAnswers({});
      setPendingFiles({});
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erreur d'envoi");
    },
  });

  const formFields = useMemo(() => data?.form?.fields ?? [], [data]);

  if (isLoading) {
    return (
      <PublicShell>
        <div className="p-8 text-center text-sm text-muted-foreground">Chargement…</div>
      </PublicShell>
    );
  }

  if (!data) {
    return (
      <PublicShell>
        <div className="p-8 text-center text-sm text-muted-foreground">Opportunité introuvable.</div>
      </PublicShell>
    );
  }

  const { opportunity, form } = data;
  const { banner } = opportunity;

  return (
    <PublicShell>
      <OpportunityPublicBannerHero
        banner={banner}
        typeLabel={OPPORTUNITY_TYPE_LABELS[opportunity.opportunityType]}
        title={opportunity.title}
      />

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <PublicBreadcrumbs
          items={[
            { label: "Accueil", to: "/" },
            { label: "Opportunités", to: "/opportunites" },
            { label: opportunity.title },
          ]}
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
          <article className="min-w-0 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Description</h2>
            {!isRichTextEmpty(opportunity.description) ? (
              <RichTextContent html={opportunity.description} />
            ) : (
              <p className="text-sm text-muted-foreground">Aucune description disponible.</p>
            )}
          </article>

          <OpportunityDetailSidebar
            opportunity={opportunity}
            canApply={!!form}
            onApply={() => setOpen(true)}
          />
        </div>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form?.title ?? "Candidature"}</DialogTitle>
          </DialogHeader>
          {form?.formDescription && (
            <p className="text-sm text-muted-foreground">{form.formDescription}</p>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom complet *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {formFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label>
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    value={answers[field.id] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))
                    }
                  />
                ) : field.type === "file" ? (
                  <Input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setPendingFiles((prev) => ({ ...prev, [field.id]: file }));
                    }}
                  />
                ) : field.type === "select" ? (
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={answers[field.id] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))
                    }
                  >
                    <option value="">—</option>
                    {(field.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={field.type === "email" ? "email" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                    value={answers[field.id] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending || !name.trim() || !email.trim()}
            >
              Envoyer ma candidature
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PublicShell>
  );
}
