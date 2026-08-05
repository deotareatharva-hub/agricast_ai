import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { NDVI_CLASSES } from "../utils/ndviColorMap";

export default function SatelliteLegend({ selectedLayer = "NDVI", className = "" }) {
  const { t } = useTranslation();

  // Only show the NDVI ramp when the NDVI layer is active
  if (selectedLayer !== "NDVI") {
    return (
      <div className={`flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-500 ${className}`}>
        <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{t("satellite.legend.trueColorNote")}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 shadow-sm ${className}`}
    >
      <div className="mb-3 flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
        <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
          {t("satellite.legend.ndviTitle")}
        </h4>
      </div>

      {/* Color ramp bar */}
      <div
        className="h-3 w-full rounded-full mb-2"
        style={{
          background:
            "linear-gradient(to right, #1E64C8, #8C8C82, #B4DC50, #64BE32, #329628, #14640A)",
        }}
      />

      <div className="flex justify-between text-xs text-neutral-400 mb-3">
        <span>–1</span>
        <span>0</span>
        <span>+1</span>
      </div>

      {/* Class list */}
      <div className="space-y-1.5">
        {NDVI_CLASSES.map((cls) => (
          <div key={cls.level} className="flex items-center gap-2 text-xs">
            <div
              className="h-3 w-8 shrink-0 rounded-sm"
              style={{ backgroundColor: cls.color }}
            />
            <span className="text-neutral-500">
              {t(cls.labelKey, { defaultValue: cls.label })}
            </span>
            <span className="ml-auto text-neutral-400">
              {cls.range[0].toFixed(1)} to {cls.range[1].toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
