// Query key factory for the satellite feature.
// Mirrors the structure of features/weather/hooks/weatherKeys.js.
// Every useSatellite* hook uses these keys so cache invalidation
// (e.g. after a refresh) can target the exact right entries.
export const satelliteKeys = {
  all: ["satellite"],
  farm: (farmId) => [...satelliteKeys.all, farmId],

  layers: () => [...satelliteKeys.all, "layers"],

  current: (farmId, params = {}) => [...satelliteKeys.farm(farmId), "current", params],
  ndvi: (farmId, params = {}) => [...satelliteKeys.farm(farmId), "ndvi", params],
  health: (farmId, params = {}) => [...satelliteKeys.farm(farmId), "health", params],
  history: (farmId, params = {}) => [...satelliteKeys.farm(farmId), "history", params],
  timelapse: (farmId, layer) => [...satelliteKeys.farm(farmId), "timelapse", layer],
  image: (farmId, params = {}) => [...satelliteKeys.farm(farmId), "image", params],
  metadata: (farmId, params = {}) => [...satelliteKeys.farm(farmId), "metadata", params],
};
