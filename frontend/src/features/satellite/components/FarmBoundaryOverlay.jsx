// FarmBoundaryOverlay renders bounding box metadata as a readable card.
// The actual map overlay is handled inside SatelliteMap (Leaflet imageOverlay).
// This component shows the bbox coordinates and date range used for the request.

import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";

export default function FarmBoundaryOverlay({ bbox, dateRange, className = "" }) {
  const { t } = useTranslation();

  if (!bbox) return null;

  const [west, south, east, north] = bbox;

  return (
    <div className={`overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-brand-600" aria-hidden="true" />
        <h4 className="text-sm font-semibold text-neutral-900">{t("satellite.boundary.title")}</h4>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-neutral-50 px-3 py-2">
          <p className="text-neutral-400">{t("satellite.boundary.north")}</p>
          <p className="font-mono font-medium text-neutral-800">{north?.toFixed(5)}</p>
        </div>
        <div className="rounded-lg bg-neutral-50 px-3 py-2">
          <p className="text-neutral-400">{t("satellite.boundary.south")}</p>
          <p className="font-mono font-medium text-neutral-800">{south?.toFixed(5)}</p>
        </div>
        <div className="rounded-lg bg-neutral-50 px-3 py-2">
          <p className="text-neutral-400">{t("satellite.boundary.east")}</p>
          <p className="font-mono font-medium text-neutral-800">{east?.toFixed(5)}</p>
        </div>
        <div className="rounded-lg bg-neutral-50 px-3 py-2">
          <p className="text-neutral-400">{t("satellite.boundary.west")}</p>
          <p className="font-mono font-medium text-neutral-800">{west?.toFixed(5)}</p>
        </div>
      </div>

      {dateRange && (
        <div className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs">
          <p className="text-brand-600 font-medium">{t("satellite.boundary.dateRange")}</p>
          <p className="text-brand-700 font-mono">{dateRange.from} → {dateRange.to}</p>
        </div>
      )}
    </div>
  );
}
