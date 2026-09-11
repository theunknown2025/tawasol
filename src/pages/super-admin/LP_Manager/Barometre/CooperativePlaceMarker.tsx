import L from "leaflet";
import { useMemo } from "react";
import { Marker } from "react-leaflet";
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
  });
}

type Props = {
  coop: BarometreCooperative;
  latitude: number;
  longitude: number;
  onHover?: (coop: BarometreCooperative) => void;
  onSelect?: (coop: BarometreCooperative) => void;
};

export default function CooperativePlaceMarker({
  coop,
  latitude,
  longitude,
  onHover,
  onSelect,
}: Props) {
  /** Leaflet must not share one DivIcon across markers — shared icons break position on zoom. */
  const icon = useMemo(() => createCooperativePlaceDivIcon(coop.activite), [coop.activite]);

  return (
    <Marker
      position={[latitude, longitude]}
      icon={icon}
      zIndexOffset={650}
      eventHandlers={{
        mouseover: () => {
          onHover?.(coop);
        },
        click: () => {
          onSelect?.(coop);
        },
      }}
    />
  );
}
