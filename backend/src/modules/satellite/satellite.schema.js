// Response DTOs for the satellite module. Deliberately separate from
// db/schema/satellite.schema.js (the Drizzle table definitions) - this
// file shapes what the FRONTEND receives, so internal columns (paramsHash,
// cache bookkeeping) never leak into the public API. Same convention as
// modules/weather/weather.schema.js.

function toImageDto(data, meta) {
  return {
    farmId: meta.farmId,
    layer: data.layer,
    bbox: data.bbox,
    dateRange: data.dateRange,
    mimeType: data.mimeType,
    imageBase64: data.imageBase64,
    sizeBytes: data.sizeBytes,
    cache: meta.cache,
  };
}

function toMetadataDto(data, meta) {
  return {
    farmId: meta.farmId,
    layer: data.layer,
    bbox: data.bbox,
    dateRange: data.dateRange,
    sceneCount: data.sceneCount,
    scenes: data.scenes,
  };
}

function toLayersDto(layers) {
  return {
    count: layers.length,
    layers,
  };
}

export const satelliteSchema = {
  toImageDto,
  toMetadataDto,
  toLayersDto,
};
