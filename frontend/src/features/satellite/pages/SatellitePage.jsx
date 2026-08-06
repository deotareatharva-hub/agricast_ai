import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useSatelliteLayers } from "../hooks/useSatelliteLayers";
import { useSatelliteImage } from "../hooks/useSatelliteImage";
import { useSatelliteMetadata } from "../hooks/useSatelliteMetadata";
import FarmBoundaryMap from "../components/FarmBoundaryMap";
import LayerSelector from "../components/LayerSelector";
import SatelliteImageViewer from "../components/SatelliteImageViewer";
import SceneList from "../components/SceneList";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";

export default function SatellitePage() {
  const { farm } = useOutletContext();
  const [layer, setLayer] = useState("NDVI");

  const layersQuery = useSatelliteLayers();
  const imageQuery = useSatelliteImage(farm.id, { layer });
  const metadataQuery = useSatelliteMetadata(farm.id, { layer });

  return (
    <div className="space-y-6">
      <FarmBoundaryMap latitude={farm.latitude} longitude={farm.longitude} />

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Layer
        </h2>
        {layersQuery.isLoading ? (
          <p className="text-sm text-neutral-500">Loading layers…</p>
        ) : (
          <LayerSelector layers={layersQuery.data} value={layer} onChange={setLayer} />
        )}
      </div>

      {imageQuery.isLoading && <Loading label="Fetching satellite imagery…" />}

      {imageQuery.isError && (
        <ErrorState
          message={
            imageQuery.error?.message ||
            "Could not load satellite imagery. Sentinel Hub may be temporarily unavailable."
          }
          onRetry={() => imageQuery.refetch()}
        />
      )}

      {imageQuery.data && <SatelliteImageViewer image={imageQuery.data} />}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Available scenes
        </h2>
        {metadataQuery.isLoading ? (
          <p className="text-sm text-neutral-500">Loading scenes…</p>
        ) : metadataQuery.isError ? (
          <p className="text-sm text-neutral-500">Scene metadata unavailable.</p>
        ) : (
          <SceneList metadata={metadataQuery.data} />
        )}
      </div>
    </div>
  );
}
