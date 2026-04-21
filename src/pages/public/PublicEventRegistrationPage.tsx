import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { fetchPublicEventBySlug, submitPublicEventRegistration } from "@/lib/eventsApi";

export default function PublicEventRegistrationPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["public-event", slug],
    queryFn: () => fetchPublicEventBySlug(slug),
    enabled: !!slug,
  });

  const submitMutation = useMutation({
    mutationFn: submitPublicEventRegistration,
    onSuccess: () => {
      toast.success("Inscription envoyee");
      setOpen(false);
      setName("");
      setEmail("");
      setAnswers({});
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erreur d'inscription");
    },
  });

  const formFields = useMemo(() => data?.form?.fields ?? [], [data]);

  if (isLoading) return <div className="p-8 text-center text-sm text-muted-foreground">Chargement...</div>;
  if (!data) return <div className="p-8 text-center text-sm text-muted-foreground">Evenement introuvable.</div>;

  const { event, form } = data;

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {event.bannerUrl && (
          <img src={event.bannerUrl} alt={event.titre} className="w-full rounded-2xl aspect-[21/9] object-cover" />
        )}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{event.titre}</h1>
          <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
        </div>
        <div className="flex items-center gap-3">
          {form ? (
            <Button onClick={() => setOpen(true)}>Inscrire</Button>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun formulaire d'inscription configure.</p>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form?.title ?? "Formulaire d'inscription"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom complet *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {formFields.map((field) => {
              const value = answers[field.label] ?? "";
              return (
                <div key={field.id} className="space-y-2">
                  <Label>
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      value={value}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [field.label]: e.target.value }))}
                    />
                  ) : (
                    <Input
                      type={field.type === "checkbox" ? "text" : field.type}
                      value={value}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [field.label]: e.target.value }))}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              );
            })}
            <Button
              onClick={() =>
                submitMutation.mutate({
                  eventId: event.id,
                  applicantName: name.trim(),
                  applicantEmail: email.trim(),
                  answers,
                })
              }
              disabled={submitMutation.isPending || !name.trim() || !email.trim()}
            >
              Envoyer l'inscription
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
