import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Vite doesn't resolve Leaflet's default marker image paths automatically -
// this is the standard fix, done once per bundle load.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [20.5937, 78.9629]; // Geographic center of India
const DEFAULT_ZOOM = 5;
const SELECTED_ZOOM = 13;

function ClickHandler({ onChange }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      onChange(lat, lng);
    },
  });
  return null;
}

// Click anywhere on the map, or drag the marker once placed, to set
// latitude/longitude. Uses OpenStreetMap tiles via React Leaflet.
export default function LocationPicker({ latitude, longitude, onChange }) {
  const { t } = useTranslation();
  const hasPosition = typeof latitude === "number" && typeof longitude === "number" && !Number.isNaN(latitude) && !Number.isNaN(longitude);
  const position = hasPosition ? [latitude, longitude] : null;

  const center = useMemo(() => position || DEFAULT_CENTER, [position]);

  return (
    <div className="overflow-hidden rounded-md border border-neutral-300">
      <MapContainer
        center={center}
        zoom={hasPosition ? SELECTED_ZOOM : DEFAULT_ZOOM}
        scrollWheelZoom={false}
        style={{ height: "280px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        {position && (
          <Marker
            position={position}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const { lat, lng } = event.target.getLatLng();
                onChange(lat, lng);
              },
            }}
          />
        )}
      </MapContainer>
      <p className="border-t border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
        {t("farms.mapHint")}
      </p>
    </div>
  );
}
