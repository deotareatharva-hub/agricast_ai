import { useState } from "react";

export default function SatelliteImageViewer({ image }) {
  const [fullscreen, setFullscreen] = useState(false);

  if (!image) return null;

  const src = `data:${image.mimeType};base64,${image.imageBase64}`;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-neutral-500">
          {image.dateRange?.from} → {image.dateRange?.to}
          {image.cache && (
            <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-brand-700">
              {image.cache.hit ? "Cached" : "Fresh"}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="focus-ring rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Fullscreen
        </button>
      </div>

      <img
        src={src}
        alt={`${image.layer} satellite imagery`}
        className="mt-3 w-full rounded-lg border border-neutral-200 object-cover"
      />

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setFullscreen(false)}
        >
          <img
            src={src}
            alt={`${image.layer} satellite imagery, fullscreen`}
            className="max-h-full max-w-full rounded-lg"
          />
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="focus-ring absolute right-6 top-6 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-neutral-900"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
