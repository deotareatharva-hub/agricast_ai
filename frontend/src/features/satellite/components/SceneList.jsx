export default function SceneList({ metadata }) {
  if (!metadata?.scenes?.length) {
    return <p className="text-sm text-neutral-500">No scenes found for this date range.</p>;
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <div className="divide-y divide-neutral-100">
        {metadata.scenes.map((scene) => (
          <div key={scene.sceneId} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-neutral-700">
              {new Date(scene.capturedAt).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
            <span className="text-xs text-neutral-500">
              {scene.cloudCoverPercent}% cloud cover
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
