import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildGoogleMapsEmbedSrc, parseLatLngFromGoogleMapsUrl } from "@/lib/googleMapsCoords";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CONTACTER_NOUS_CONTENT,
  type ContacterNousContent,
} from "../types";

function telHref(phone: string): string | null {
  const t = phone.replace(/[^\d+]/g, "").trim();
  if (!t) return null;
  return `tel:${t}`;
}

function whatsappHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

function mailtoHref(email: string): string | null {
  const t = email.trim();
  if (!t) return null;
  return `mailto:${encodeURIComponent(t)}`;
}

type ContacterNousSectionProps = {
  content?: ContacterNousContent;
  className?: string;
};

export function ContacterNousSection({
  content = DEFAULT_CONTACTER_NOUS_CONTENT,
  className,
}: ContacterNousSectionProps) {
  const address = content.address.trim();
  const phone = content.phone.trim();
  const whatsapp = content.whatsapp.trim();
  const email = content.email.trim();
  const mapsUrl = content.googleMapsUrl.trim();
  const lat = content.latitude;
  const lng = content.longitude;

  const parsedFromUrl =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)
      ? null
      : parseLatLngFromGoogleMapsUrl(mapsUrl);
  const effectiveLat = lat ?? parsedFromUrl?.lat ?? null;
  const effectiveLng = lng ?? parsedFromUrl?.lng ?? null;

  const embedSrc = buildGoogleMapsEmbedSrc(mapsUrl, effectiveLat, effectiveLng);

  const hasAnyContact =
    address.length > 0 ||
    phone.length > 0 ||
    whatsapp.length > 0 ||
    email.length > 0 ||
    mapsUrl.length > 0;

  return (
    <div className={cn("mx-auto max-w-6xl px-4 py-8 md:py-10 lg:px-8", className)}>
      {!hasAnyContact ? (
        <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Aucune information de contact pour l’instant. Complétez la section depuis l’éditeur « Contacter
          nous ».
        </p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-10">
          <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">Coordonnées</h3>
            <ul className="space-y-5 text-sm">
              {address ? (
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Adresse
                    </p>
                    <p className="mt-1 whitespace-pre-line text-foreground">{address}</p>
                  </div>
                </li>
              ) : null}
              {phone ? (
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Téléphone
                    </p>
                    {telHref(phone) ? (
                      <a
                        href={telHref(phone)!}
                        className="mt-1 block font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {phone}
                      </a>
                    ) : (
                      <p className="mt-1 text-foreground">{phone}</p>
                    )}
                  </div>
                </li>
              ) : null}
              {whatsapp ? (
                <li className="flex gap-3">
                  <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      WhatsApp
                    </p>
                    {whatsappHref(whatsapp) ? (
                      <a
                        href={whatsappHref(whatsapp)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {whatsapp}
                      </a>
                    ) : (
                      <p className="mt-1 text-foreground">{whatsapp}</p>
                    )}
                  </div>
                </li>
              ) : null}
              {email ? (
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      E-mail
                    </p>
                    {mailtoHref(email) ? (
                      <a
                        href={mailtoHref(email)!}
                        className="mt-1 block font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {email}
                      </a>
                    ) : (
                      <p className="mt-1 text-foreground">{email}</p>
                    )}
                  </div>
                </li>
              ) : null}
              {mapsUrl ? (
                <li className="flex flex-col gap-2 pt-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Google Maps
                  </p>
                  <Button variant="outline" size="sm" className="w-fit" asChild>
                    <a href={mapsUrl.startsWith("http") ? mapsUrl : `https://${mapsUrl}`} target="_blank" rel="noopener noreferrer">
                      Ouvrir dans Google Maps
                    </a>
                  </Button>
                </li>
              ) : null}
            </ul>
          </div>

          <div className="flex min-h-[16rem] flex-col overflow-hidden rounded-2xl border border-border bg-muted/30 shadow-sm ring-1 ring-border/40">
            {embedSrc ? (
              <iframe
                title="Carte Google Maps"
                src={embedSrc}
                className="h-full min-h-[16rem] w-full flex-1 border-0 lg:min-h-[20rem]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
                <p>
                  Collez un lien Google Maps qui contient des coordonnées (souvent visible dans l’URL
                  après <code className="rounded bg-muted px-1 py-0.5 text-xs">@</code> lat,lng), ou un
                  lien « intégrer la carte », puis utilisez « Extraire les coordonnées » dans
                  l’éditeur.
                </p>
                {mapsUrl ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={mapsUrl.startsWith("http") ? mapsUrl : `https://${mapsUrl}`} target="_blank" rel="noopener noreferrer">
                      Ouvrir le lien fourni
                    </a>
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
