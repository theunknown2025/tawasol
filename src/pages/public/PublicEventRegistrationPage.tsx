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
import { formatEventDateRange, formatFrDate } from "@/lib/eventDates";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import { ShareResourceMenu } from "@/components/public/ShareResourceMenu";
import { buildEventShareUrl } from "@/lib/shareLinks";
import { User, CalendarRange, CalendarClock } from "lucide-react";

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
      toast.success("Inscription envoyée");
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
  const shareUrl = slug ? buildEventShareUrl(slug) : "";

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
        <div className="p-8 text-center text-sm text-muted-foreground">Événement introuvable.</div>
      </PublicShell>
    );
  }

  const { event, form } = data;
  const description = event.description?.trim() ?? "";
  const dureeLabel = formatEventDateRange(event.eventDateStart, event.eventDateEnd);
  const deadlineLabel = event.deadlineInscription
    ? formatFrDate(event.deadlineInscription)
    : null;

  return (
    <PublicShell>
      <div className="relative left-1/2 w-screen max-w-[100vw] shrink-0 -translate-x-1/2 border-b border-border bg-muted">
        {event.bannerUrl ? (
          <img
            src={event.bannerUrl}
            alt=""
            className="block aspect-[21/9] max-h-[min(42vh,560px)] min-h-[200px] w-full object-cover"
          />
        ) : (
          <div
            className="aspect-[21/9] max-h-[min(42vh,560px)] min-h-[220px] w-full bg-gradient-to-br from-slate-800 via-slate-900 to-black"
            aria-hidden
          />
        )}
        <div
          className={
            event.bannerUrl
              ? "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30"
              : "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/35 to-black/20"
          }
          aria-hidden
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 py-10 text-center md:py-14">
          <h1 className="max-w-4xl text-balance text-2xl font-bold tracking-tight text-white drop-shadow-md md:text-4xl lg:text-5xl">
            {event.titre}
          </h1>
          <div className="mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-white/95 md:text-base">
            <div className="flex items-start gap-2.5 text-left">
              <User className="mt-0.5 h-5 w-5 shrink-0 text-white/90" aria-hidden />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/65">
                  Organisateur
                </p>
                <p className="font-medium leading-snug">{event.authorName}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-left">
              <CalendarRange className="mt-0.5 h-5 w-5 shrink-0 text-white/90" aria-hidden />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/65">Durée</p>
                <p className="font-medium leading-snug">
                  {dureeLabel === "—" ? "Non précisée" : dureeLabel}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-left">
              <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-white/90" aria-hidden />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/65">
                  Inscription
                </p>
                <p className="font-medium leading-snug">
                  {deadlineLabel ? `Avant le ${deadlineLabel}` : "Non précisée"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-8 md:py-10">
        <PublicBreadcrumbs
          items={[
            { label: "Accueil", to: "/" },
            { label: "Événements", to: "/events" },
            { label: event.titre },
          ]}
        />

        {description ? (
          <p className="max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground md:text-base">
            {description}
          </p>
        ) : null}

        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {form ? (
              <Button onClick={() => setOpen(true)}>S’inscrire</Button>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun formulaire d’inscription configuré.</p>
            )}
          </div>
          {shareUrl ? (
            <ShareResourceMenu
              title={event.titre}
              description={description || undefined}
              url={shareUrl}
              variant="outline"
              size="default"
              className="shrink-0"
            />
          ) : null}
        </div>
      </main>

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
    </PublicShell>
  );
}
