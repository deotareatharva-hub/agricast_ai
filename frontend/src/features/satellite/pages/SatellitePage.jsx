import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin } from "lucide-react";

import { useFarm } from "../../farms/hooks/useFarm";
import { useFarms } from "../../farms/hooks/useFarms";
import { useSatelliteCurrent } from "../hooks/useSatelliteCurrent";
import { useSatelliteLayers } from "../hooks/useSatelliteLayers";
import { useSatelliteNdvi } from "../hooks/useSatelliteNdvi";
import { useSatelliteTimelapse } from "../hooks/useSatelliteTimelapse";
import { useRefreshSatellite } from "../hooks/useRefreshSatellite";

import SatelliteHero from "../components/SatelliteHero";
import SatelliteMap from "../components/SatelliteMap";
import LayerSelector from "../components/LayerSelector";
import SatelliteStatistics from "../components/SatelliteStatistics";
import NDVICard from "../components/NDVICard";
import HealthScoreCard from "../components/HealthScoreCard";
import VegetationHealthCard from "../components/VegetationHealthCard";
import CloudCoverageCard from "../components/CloudCoverageCard";
import SatelliteLegend from "../components/SatelliteLegend";
import FarmBoundaryOverlay from "../components/FarmBoundaryOverlay";
import SatelliteTimeline from "../components/SatelliteTimeline";
import SatelliteHistory from "../components/SatelliteHistory";
import ImageComparisonSlider from "../components/ImageComparisonSlider";
import SatelliteLoading from "../components/SatelliteLoading";
import SatelliteError from "../components/SatelliteError";
import EmptySatelliteState from "../components/EmptySatelliteState";

const TABS = [
  { key: "overview", labelKey: "satellite.tabs.overview" },
  { key: "map", labelKey: "satellite.tabs.map" },
  { key: "analysis", labelKey: "satellite.tabs.analysis" },
  { key: "timeline", labelKey: "satellite.tabs.timeline" },
  { key: "history", labelKey: "satellite.tabs.history" },
];

export default function SatellitePage() {
  const { t } = useTranslation();
  const { farmId } = useParams();

  const [selectedLayer, setSelectedLayer] = useState("TRUE_COLOR");
  const [activeTab, setActiveTab] = useState("overview");

  // Farm selection (same UX pattern as WeatherPage)
  const { data: farms = [], isLoading: farmsLoading } = useFarms();
  const activeFarmId = farmId || (farms.length > 0 ? farms[0].id : null);

  const { data: farm, isLoading: farmLoading } = useFarm(activeFarmId);

  // Satellite data
  const current = useSatelliteCurrent(activeFarmId, { layer: selectedLayer });
  const ndvi = useSatelliteNdvi(activeFarmId);
  const timelapse = useSatelliteTimelapse(activeFarmId, selectedLayer);
  const layers = useSatelliteLayers();
  const refresh = useRefreshSatellite(activeFarmId);

  const isLoading = current.isLoading || farmLoading;
  const isError = current.isError;

  const handleRefresh = () => {
    refresh.mutate();
  };

  // No farms yet
  if (!farmsLoading && farms.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <EmptySatelliteState
          title={t("satellite.empty.noFarmsTitle")}
          description={t("satellite.empty.noFarmsDescription")}
          action={
            <Link
              to="/dashboard/farms/new"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition"
            >
              {t("satellite.empty.addFarm")}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      {/* Back link (farm-scoped entry) */}
      {farmId && (
        <Link
          to="/dashboard/farms"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-brand-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("farms.backToList")}
        </Link>
      )}

      {/* Farm selector (standalone /dashboard/satellite entry) */}
      {!farmId && farms.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-sm font-medium text-neutral-600">
            <MapPin className="h-4 w-4 text-brand-600" aria-hidden="true" />
            {t("satellite.selectFarm")}:
          </span>
          {farms.map((f) => (
            <Link
              key={f.id}
              to={`/dashboard/farms/${f.id}/satellite`}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition"
            >
              {f.farmName}
            </Link>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && <SatelliteLoading />}

      {/* Error */}
      {!isLoading && isError && (
        <SatelliteError
          message={current.error?.message}
          onRetry={() => current.refetch()}
        />
      )}

      {/* Main content */}
      {!isLoading && !isError && (
        <>
          {/* Hero */}
          <SatelliteHero
            current={current.data}
            farmName={farm?.farmName}
            onRefresh={handleRefresh}
            isRefreshing={refresh.isPending}
          />

          {/* Statistics row */}
          <SatelliteStatistics current={current.data} />

          {/* Layer selector */}
          <LayerSelector
            layers={layers.data?.layers}
            selectedLayer={selectedLayer}
            onLayerChange={setSelectedLayer}
          />

          {/* Tab navigation */}
          <div className="flex gap-1 border-b border-neutral-200">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-brand-700"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {t(tab.labelKey)}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="sat-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab panels */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="grid gap-4 lg:grid-cols-3"
            >
              <div className="lg:col-span-2 space-y-4">
                {/* True color image preview */}
                {current.data?.image ? (
                  <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                    <div className="border-b border-neutral-100 px-5 py-4">
                      <p className="text-sm font-semibold text-neutral-900">{t("satellite.overview.currentImage")}</p>
                      <p className="text-xs text-neutral-500">{t("satellite.overview.imageSubtitle", { layer: selectedLayer })}</p>
                    </div>
                    <div className="p-4">
                      <img
                        src={`data:${current.data.image.mimeType};base64,${current.data.image.imageBase64}`}
                        alt={t("satellite.overview.imageAlt", { layer: selectedLayer })}
                        className="w-full rounded-xl object-cover h-64"
                      />
                    </div>
                  </div>
                ) : (
                  <EmptySatelliteState
                    title={t("satellite.overview.noImageTitle")}
                    description={
                      current.data?.imageError || t("satellite.overview.noImageDescription")
                    }
                  />
                )}

                <VegetationHealthCard health={current.data?.health} />
              </div>

              <div className="space-y-4">
                <HealthScoreCard health={current.data?.health} />
                <CloudCoverageCard metadata={current.data?.metadata} />
                <SatelliteLegend selectedLayer={selectedLayer} />
                <FarmBoundaryOverlay
                  bbox={current.data?.image?.bbox}
                  dateRange={current.data?.image?.dateRange}
                />
              </div>
            </motion.div>
          )}

          {activeTab === "map" && (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <SatelliteMap
                image={current.data?.image}
                farm={farm}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <SatelliteLegend selectedLayer={selectedLayer} />
                <FarmBoundaryOverlay
                  bbox={current.data?.image?.bbox}
                  dateRange={current.data?.image?.dateRange}
                />
              </div>
            </motion.div>
          )}

          {activeTab === "analysis" && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="grid gap-4 lg:grid-cols-2"
            >
              <NDVICard ndviImage={ndvi.data} />
              <HealthScoreCard health={current.data?.health} />
              <VegetationHealthCard health={current.data?.health} className="lg:col-span-2" />
              <CloudCoverageCard metadata={current.data?.metadata} />
              <SatelliteLegend selectedLayer="NDVI" />
            </motion.div>
          )}

          {activeTab === "timeline" && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <SatelliteTimeline timelapse={timelapse.data} />
              {timelapse.data?.frames?.length >= 2 && (
                <ImageComparisonSlider
                  beforeFrame={timelapse.data.frames[timelapse.data.frames.length - 1]}
                  afterFrame={timelapse.data.frames[0]}
                />
              )}
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <SatelliteHistory farmId={activeFarmId} />
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
