import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { useSatelliteLayers } from "../hooks/useSatelliteLayers";
import { useSatelliteImage } from "../hooks/useSatelliteImage";
import { useSatelliteMetadata } from "../hooks/useSatelliteMetadata";
import FarmBoundaryMap from "../components/FarmBoundaryMap";
import LayerSelector from "../components/LayerSelector";
import SatelliteImageViewer from "../components/SatelliteImageViewer";
import SceneList from "../components/SceneList";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";

function Section({ title, children }) {
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-400">{title}</h2>
      {children}
    </motion.section>
  );
}

export default function SatellitePage() {
  const { farm } = useOutletContext();
  const [layer, setLayer] = useState("NDVI");

  const layersQuery = useSatelliteLayers();
  const imageQuery = useSatelliteImage(farm.id, { layer });
  const metadataQuery = useSatelliteMetadata(farm.id, { layer });

  return (
    <div className="space-y-8">
      <Section title="Farm location">
        <FarmBoundaryMap latitude={farm.latitude} longitude={farm.longitude} />
      </Section>

      <Section title="Layer">
        {layersQuery.isLoading ? (
          <p className="text-sm text-neutral-400">Loading layers…</p>
        ) : (
          <LayerSelector layers={layersQuery.data} value={layer} onChange={setLayer} />
        )}
      </Section>

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

      {imageQuery.data && (
        <Section title="Imagery">
          <SatelliteImageViewer image={imageQuery.data} />
        </Section>
      )}

      <Section title="Available scenes">
        {metadataQuery.isLoading ? (
          <p className="text-sm text-neutral-400">Loading scenes…</p>
        ) : metadataQuery.isError ? (
          <p className="text-sm text-neutral-400">Scene metadata unavailable.</p>
        ) : (
          <SceneList metadata={metadataQuery.data} />
        )}
      </Section>
    </div>
  );
}
