import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Calendar, ChevronDown } from "lucide-react";
import { useSatelliteHistory } from "../hooks/useSatelliteHistory";
import { formatCaptureDateTime, formatCloudCover } from "../utils/satelliteFormatters";
import { cloudCoverToClass } from "../utils/ndviColorMap";
import SatelliteLoading from "./SatelliteLoading";

const DATE_PRESETS = [
  { labelKey: "satellite.history.last7", days: 7 },
  { labelKey: "satellite.history.last30", days: 30 },
  { labelKey: "satellite.history.last90", days: 90 },
];

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

export default function SatelliteHistory({ farmId }) {
  const { t } = useTranslation();
  const [preset, setPreset] = useState(DATE_PRESETS[1]);

  const endDate = fmt(new Date());
  const startDate = fmt(new Date(Date.now() - preset.days * 24 * 60 * 60 * 1000));

  const { data, isLoading, isError, refetch } = useSatelliteHistory(farmId, {
    startDate,
    endDate,
  });

  const scenes = data?.scenes ?? [];

  return (
    <div className="space-y-4">
      {/* Preset picker */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-neutral-700">{t("satellite.history.range")}:</span>
        <div className="flex gap-1">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.days}
              onClick={() => setPreset(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                preset.days === p.days
                  ? "bg-brand-600 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-brand-50 hover:text-brand-700"
              }`}
            >
              {t(p.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading && <SatelliteLoading rows={5} />}

      {isError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {t("satellite.history.error")}
        </div>
      )}

      {!isLoading && !isError && scenes.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 py-10 text-center text-sm text-neutral-400">
          {t("satellite.history.empty")}
        </div>
      )}

      {!isLoading && !isError && scenes.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {/* Summary row */}
          <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {t("satellite.history.scenesFound", { count: scenes.length })} — {startDate} → {endDate}
              </span>
            </div>
            <span className="text-xs text-neutral-400">{t("satellite.history.newestFirst")}</span>
          </div>

          {/* Scene rows */}
          <div className="divide-y divide-neutral-100">
            {scenes.map((scene, i) => (
              <motion.div
                key={scene.sceneId || i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between px-5 py-3 text-sm hover:bg-neutral-50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-brand-400 shrink-0" />
                  <div>
                    <p className="font-medium text-neutral-800">
                      {formatCaptureDateTime(scene.capturedAt)}
                    </p>
                    <p className="text-xs text-neutral-400">{scene.sceneId ?? "—"}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${cloudCoverToClass(scene.cloudCoverPercent)}`}>
                  <ChevronDown className="h-3 w-3 rotate-[-90deg]" aria-hidden="true" />
                  {formatCloudCover(scene.cloudCoverPercent)} {t("satellite.fields.cloudCover")}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
