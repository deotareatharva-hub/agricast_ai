export const satelliteKeys = {
  all: ["satellite"],
  layers: () => [...satelliteKeys.all, "layers"],
  image: (farmId, params) => [...satelliteKeys.all, "image", farmId, params],
  metadata: (farmId, params) => [...satelliteKeys.all, "metadata", farmId, params],
};
