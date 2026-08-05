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

function toHistoryDto(data, meta) {
  return {
    farmId: meta.farmId,
    layer: data.layer,
    bbox: data.bbox,
    dateRange: data.dateRange,
    sceneCount: data.sceneCount,
    scenes: data.scenes,
    // summarize cloud cover for quick dashboard display
    avgCloudCover:
      data.scenes.length > 0
        ? Math.round(
            data.scenes.reduce((s, sc) => s + (sc.cloudCoverPercent ?? 0), 0) / data.scenes.length
          )
        : null,
    latestCapture: data.scenes[0]?.capturedAt ?? null,
  };
}

function toLayersDto(layers) {
  return {
    count: layers.length,
    layers,
  };
}

/**
 * Combined current DTO:
 * image + metadata + health metrics in a single response.
 */
function toCurrentDto({ image, metadata, health, farmId, imageError, metadataError }) {
  return {
    farmId,
    image: image
      ? {
          layer: image.layer,
          mimeType: image.mimeType,
          imageBase64: image.imageBase64,
          sizeBytes: image.sizeBytes,
          dateRange: image.dateRange,
          bbox: image.bbox,
          cache: image.cache,
        }
      : null,
    // Populated only when the image fetch failed (provider error, missing
    // credentials, etc). Lets the frontend distinguish "provider failed"
    // from "no imagery exists yet" without changing the shape existing
    // consumers already rely on - both are additive/optional fields.
    imageError: imageError ?? null,
    metadata: metadata
      ? {
          sceneCount: metadata.sceneCount,
          scenes: metadata.scenes,
          latestCapture: metadata.scenes?.[0]?.capturedAt ?? null,
          avgCloudCover:
            metadata.scenes?.length > 0
              ? Math.round(
                  metadata.scenes.reduce((s, sc) => s + (sc.cloudCoverPercent ?? 0), 0) /
                    metadata.scenes.length
                )
              : null,
        }
      : null,
    metadataError: metadataError ?? null,
    health: health ?? null,
  };
}

/**
 * Health-only DTO: scores, grades, and crop assessment.
 */
function toHealthDto({ farmId, health, metadata }) {
  return {
    farmId,
    health,
    sceneCount: metadata?.sceneCount ?? 0,
    latestCapture: metadata?.scenes?.[0]?.capturedAt ?? null,
    avgCloudCover:
      metadata?.scenes?.length > 0
        ? Math.round(
            metadata.scenes.reduce((s, sc) => s + (sc.cloudCoverPercent ?? 0), 0) /
              metadata.scenes.length
          )
        : null,
  };
}

/**
 * Timelapse DTO: array of named frames.
 */
function toTimelapseDto({ farmId, frames }) {
  return {
    farmId,
    frameCount: frames.length,
    frames: frames.map((f) => ({
      label: f.label,
      period: f.period,
      dateRange: f.dateRange,
      layer: f.image?.layer ?? null,
      mimeType: f.image?.mimeType ?? null,
      imageBase64: f.image?.imageBase64 ?? null,
      sizeBytes: f.image?.sizeBytes ?? null,
    })),
  };
}

/**
 * Refresh confirmation DTO.
 */
function toRefreshDto({ farmId, invalidatedRows, refreshedAt }) {
  return {
    farmId,
    invalidatedRows,
    refreshedAt,
    message: `Cache cleared (${invalidatedRows} entries). New imagery will be fetched on next request.`,
  };
}

export const satelliteSchema = {
  toImageDto,
  toMetadataDto,
  toHistoryDto,
  toLayersDto,
  toCurrentDto,
  toHealthDto,
  toTimelapseDto,
  toRefreshDto,
};
