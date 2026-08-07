import { Cloud } from "lucide-react";

export default function SceneList({ metadata }) {
  if (!metadata?.scenes?.length) {
    return <p className="text-sm text-neutral-400">No scenes found for this date range.</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-900/[0.06] bg-white shadow-[var(--shadow-soft-sm)]">
      <div className="divide-y divide-neutral-900/[0.05]">
        {metadata.scenes.map((scene) => (
          <div key={scene.sceneId} className="flex items-center justify-between px-4 py-3 text-sm transition hover:bg-neutral-900/[0.02]">
            <span className="font-medium text-neutral-700">
              {new Date(scene.capturedAt).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Cloud className="h-3.5 w-3.5" aria-hidden="true" />
              {scene.cloudCoverPercent}% cloud cover
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
