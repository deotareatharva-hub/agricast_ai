import { useTranslation } from "react-i18next";
import { Layers } from "lucide-react";

const LAYER_ICONS = {
  TRUE_COLOR: "🛰️",
  FALSE_COLOR: "🔴",
  NDVI: "🌿",
  MOISTURE_INDEX: "💧",
  EVI: "🌱",
};

export default function LayerSelector({ layers, selectedLayer, onLayerChange }) {
  const { t } = useTranslation();

  if (!layers || layers.length === 0) return null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Layers className="h-4 w-4 text-brand-600" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-neutral-900">{t("satellite.layerSelector.title")}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {layers.map((layer) => {
          const isActive = selectedLayer === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => onLayerChange(layer.id)}
              title={layer.description}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-brand-300 hover:bg-brand-50"
              }`}
            >
              <span aria-hidden="true">{LAYER_ICONS[layer.id] || "📡"}</span>
              {layer.label}
            </button>
          );
        })}
      </div>
      {selectedLayer && layers.find((l) => l.id === selectedLayer)?.description && (
        <p className="mt-2 text-xs text-neutral-500">
          {layers.find((l) => l.id === selectedLayer).description}
        </p>
      )}
    </div>
  );
}
