import L from "leaflet";
import { useMemo } from "react";
import { Marker, Tooltip } from "react-leaflet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { BarometreCooperative } from "./barometreCooperativesApi";
import { ACTIVITY_PIN_SIZE, buildActivityPinHtml } from "./barometreActivityIcons";

const PIN_ICON_W = ACTIVITY_PIN_SIZE.width;
const PIN_ICON_H = ACTIVITY_PIN_SIZE.height;

function createCooperativePlaceDivIcon(activite: string) {
  return L.divIcon({
    className: "barometre-coop-place-icon",
    html: buildActivityPinHtml(activite),
    iconSize: [PIN_ICON_W, PIN_ICON_H],
    iconAnchor: [PIN_ICON_W / 2, PIN_ICON_H],
    tooltipAnchor: [0, -PIN_ICON_H + 4],
  });
}

function presidentGenreLabel(g: BarometreCooperative["presidentGenre"]): string {
  if (g === "male") return "Male";
  if (g === "female") return "Female";
  return "—";
}

type Props = {
  coop: BarometreCooperative;
  latitude: number;
  longitude: number;
};

export default function CooperativePlaceMarker({ coop, latitude, longitude }: Props) {
  /** Leaflet must not share one DivIcon across markers — shared icons break position on zoom. */
  const icon = useMemo(() => createCooperativePlaceDivIcon(coop.activite), [coop.activite]);

  const phones = coop.phones.length > 0 ? coop.phones : coop.tel ? [coop.tel] : [];

  const hasPresident =
    Boolean(coop.presidentGenre) ||
    Boolean(coop.presidentNomComplet.trim()) ||
    Boolean(coop.presidentEmail.trim()) ||
    Boolean(coop.presidentTel.trim());

  return (
    <Marker position={[latitude, longitude]} icon={icon} zIndexOffset={650}>
      <Tooltip
        direction="top"
        offset={[0, -PIN_ICON_H + 8]}
        opacity={1}
        sticky
        interactive
        className="!rounded-lg !border !border-border !bg-popover !px-0 !py-0 !text-popover-foreground !shadow-lg"
      >
        <div className="w-[min(90vw,260px)] text-left">
          {!coop.isPublished ? (
            <p className="border-b border-border bg-amber-500/10 px-3 py-1.5 text-[10px] font-medium text-amber-900 dark:text-amber-200">
              Brouillon (visible admin uniquement)
            </p>
          ) : null}
          <Accordion type="multiple" defaultValue={["cooperative", ...(hasPresident ? ["president"] : [])]} className="px-0">
            <AccordionItem value="cooperative" className="border-b border-border px-3">
              <AccordionTrigger className="py-2 text-xs font-medium hover:no-underline">
                Coopérative
              </AccordionTrigger>
              <AccordionContent className="max-h-[min(50vh,240px)] overflow-y-auto pb-3 pt-0">
                <p className="text-sm font-semibold leading-tight text-foreground">{coop.nom}</p>
                {coop.activite ? (
                  <p className="mt-1 text-xs text-muted-foreground">{coop.activite}</p>
                ) : null}
                {coop.description ? (
                  <div className="mt-3 border-t border-border pt-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Description
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                      {coop.description}
                    </p>
                  </div>
                ) : null}
                {phones.length > 0 ? (
                  <div className="mt-2 space-y-1 text-xs">
                    {phones.map((phone, i) => (
                      <p key={`${phone}-${i}`}>
                        <span className="text-muted-foreground">
                          {phones.length > 1 ? `Tél. ${i + 1} ` : "Tél. "}
                        </span>
                        {phone}
                      </p>
                    ))}
                  </div>
                ) : null}
                {coop.email ? (
                  <p className="mt-1 break-all text-xs">
                    <span className="text-muted-foreground">Email </span>
                    <a className="text-primary underline" href={`mailto:${coop.email}`}>
                      {coop.email}
                    </a>
                  </p>
                ) : null}
                {coop.adresse ? (
                  <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{coop.adresse}</p>
                ) : null}
                {coop.links.length > 0 ? (
                  <ul className="mt-2 list-inside list-disc text-xs">
                    {coop.links.map((l, i) => (
                      <li key={i}>
                        <a href={l.url} target="_blank" rel="noreferrer" className="text-primary underline break-all">
                          {l.label || l.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {coop.imageUrl ? (
                  <img
                    src={coop.imageUrl}
                    alt=""
                    className="mt-3 max-h-28 w-full rounded-md border border-border object-contain"
                  />
                ) : null}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="president" className="border-b-0 px-3">
              <AccordionTrigger className="py-2 text-xs font-medium hover:no-underline">
                Président(e)
              </AccordionTrigger>
              <AccordionContent className="pb-3 pt-0">
                {hasPresident ? (
                  <div className="space-y-2 text-xs">
                    <p>
                      <span className="text-muted-foreground">Genre </span>
                      <span className="font-medium">{presidentGenreLabel(coop.presidentGenre)}</span>
                    </p>
                    {coop.presidentNomComplet ? (
                      <p>
                        <span className="text-muted-foreground">Nom complet </span>
                        <span className="font-medium text-foreground">{coop.presidentNomComplet}</span>
                      </p>
                    ) : null}
                    {coop.presidentEmail ? (
                      <p className="break-all">
                        <span className="text-muted-foreground">Email </span>
                        <a className="text-primary underline" href={`mailto:${coop.presidentEmail}`}>
                          {coop.presidentEmail}
                        </a>
                      </p>
                    ) : null}
                    {coop.presidentTel ? (
                      <p>
                        <span className="text-muted-foreground">Tél. </span>
                        {coop.presidentTel}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Non renseigné.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </Tooltip>
    </Marker>
  );
}
