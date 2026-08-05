import crypto from "crypto";
import { ApiError } from "../../utils/ApiError.js";
import { logger } from "../../utils/logger.js";
import { env } from "../../config/env.js";
import { farmRepository } from "../farms/farm.repository.js";
import { satelliteRepository } from "./satellite.repository.js";
import { sentinelClient, SUPPORTED_LAYERS } from "../../integrations/satellite/sentinel.js";
import { sentinelMapper } from "../../integrations/satellite/sentinelMapper.js";
import { cacheService } from "./cache.service.js";
import { computeHealthScore, assessCropHealth } from "./indexCalculator.js";

// Business logic for the satellite module. Controllers never touch the
// repository, Sentinel Hub client, or mapper directly - same convention as
// modules/weather/weather.service.js. Every method takes the authenticated
// userId first and resolves farm ownership before any external call.

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function assertLayerSupported(layer) {
  if (!SUPPORTED_LAYERS.includes(layer)) {
    throw ApiError.badRequest(
      `Unsupported layer "${layer}". Supported: ${SUPPORTED_LAYERS.join(", ")}`
    );
  }
}

async function getOwnedFarmOrThrow(userId, farmId) {
  const farm = await farmRepository.findByIdForUser(farmId, userId);
  if (!farm) {
    throw ApiError.notFound(
      `Farm ${farmId} not found or does not belong to the current user.`
    );
  }
  return farm;
}

/**
 * Convert (lat, lon) to a bounding box [west, south, east, north].
 * bufferMeters controls how far out the box extends around the centre point.
 */
function computeBoundingBox(lat, lon, bufferMeters = 5000) {
  const EARTH_RADIUS_M = 6_371_000;
  const latDelta = (bufferMeters / EARTH_RADIUS_M) * (180 / Math.PI);
  const lonDelta =
    (bufferMeters / (EARTH_RADIUS_M * Math.cos((lat * Math.PI) / 180))) *
    (180 / Math.PI);
  return [lon - lonDelta, lat - latDelta, lon + lonDelta, lat + latDelta];
}

/**
 * Resolve a {from, to} date range.
 * Defaults to the last 30 days when no dates are supplied.
 */
function resolveDateRange({ startDate, endDate } = {}) {
  const to = endDate || new Date().toISOString().slice(0, 10);
  const from =
    startDate ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { from, to };
}

function hashParams(layer, bbox, dateRange) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify({ layer, bbox, dateRange }))
    .digest("hex")
    .slice(0, 16);
}

/**
 * Wrap a Sentinel Hub call with request logging.
 * Always writes to satellite_requests, even on failure.
 */
async function withRequestLog({ farmId, userId, layer, bbox, dateRange }, fn) {
  let status = "success";
  let errorMessage = null;
  let result;
  let logMetadata = {};
  let cacheExpiresAt = null;

  try {
    const inner = await fn();
    result = inner;
    logMetadata = inner.logMetadata ?? {};
    cacheExpiresAt = inner.cacheExpiresAt ?? null;
  } catch (err) {
    status = "error";
    errorMessage = err.message;
    throw err;
  } finally {
    satelliteRepository
      .logRequest({
        farmId,
        userId,
        layer,
        bbox,
        dateRange,
        status,
        responseMetadata: logMetadata,
        errorMessage,
        expiresAt: cacheExpiresAt,
      })
      .catch((logErr) => {
        logger.warn("Failed to log satellite request", {
          farmId,
          message: logErr.message,
        });
      });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Service methods
// ---------------------------------------------------------------------------

export const satelliteService = {
  /**
   * Return the static list of supported layers.
   * No DB or Sentinel Hub access required.
   */
  getLayers() {
    const layers = sentinelMapper.mapLayers(SUPPORTED_LAYERS);
    return { data: layers };
  },

  /**
   * Fetch a satellite image for the given farm, layer, and date range.
   * Results are cached in satellite_cache.
   */
  async getImage(userId, farmId, { layer, startDate, endDate }) {
    assertLayerSupported(layer);
    const farm = await getOwnedFarmOrThrow(userId, farmId);

    const bbox = computeBoundingBox(farm.latitude, farm.longitude, env.satellite.bboxBufferMeters);
    const dateRange = resolveDateRange({ startDate, endDate });
    const paramsHash = hashParams(layer, bbox, dateRange);

    // Check cache first
    const cached = await satelliteRepository.findCache(farm.id, layer, paramsHash);
    if (cached && cacheService.isFresh(cached)) {
      logger.info("Satellite cache hit", { farmId: farm.id, layer });
      const mapped = {
        layer: cached.layer,
        bbox: cached.bbox,
        dateRange: cached.dateRange,
        mimeType: cached.imageMimeType,
        imageBase64: cached.imageBase64,
        sizeBytes: cached.imageBase64
          ? Buffer.from(cached.imageBase64, "base64").length
          : 0,
      };
      return {
        data: mapped,
        meta: {
          farmId: farm.id,
          cache: { hit: true, expiresAt: cached.expiresAt },
        },
      };
    }

    return withRequestLog({ farmId: farm.id, userId, layer, bbox, dateRange }, async () => {
      let raw;
      try {
        // BUGFIX: width/height were never passed here, so every Process API
        // request omitted them. Sentinel Hub's Process API requires either
        // output.width+output.height OR output.resx+output.resy - without
        // one of those pairs it returns 400 Bad Request, which made every
        // single satellite image fetch fail regardless of credentials.
        raw = await sentinelClient.fetchImage({
          bbox,
          dateRange,
          layer,
          width: env.satellite.imageSize.width,
          height: env.satellite.imageSize.height,
        });
      } catch (error) {
        logger.error("Sentinel Hub image fetch failed", {
          farmId: farm.id,
          layer,
          message: error.message,
        });
        throw error.isOperational
          ? error
          : ApiError.internal(
              "Satellite imagery is temporarily unavailable. Please try again shortly."
            );
      }

      const mapped = sentinelMapper.mapImage(raw, { layer, bbox, dateRange });
      const cacheExpiresAt = cacheService.expiresAt();

      await satelliteRepository.upsertCache({
        farmId: farm.id,
        layer,
        paramsHash,
        bbox,
        dateRange,
        responseMetadata: { sizeBytes: mapped.sizeBytes },
        imageBase64: mapped.imageBase64,
        imageMimeType: mapped.mimeType,
        expiresAt: cacheExpiresAt,
      });

      return {
        data: mapped,
        meta: { farmId: farm.id, cache: { hit: false, fetchedAt: new Date() } },
        logMetadata: { sizeBytes: mapped.sizeBytes },
        cacheExpiresAt,
      };
    });
  },

  /**
   * Fetch scene catalog metadata (dates, cloud cover) for a date range.
   */
  async getMetadata(userId, farmId, { layer, startDate, endDate }) {
    assertLayerSupported(layer);
    const farm = await getOwnedFarmOrThrow(userId, farmId);

    const bbox = computeBoundingBox(farm.latitude, farm.longitude, env.satellite.bboxBufferMeters);
    const dateRange = resolveDateRange({ startDate, endDate });

    return withRequestLog({ farmId: farm.id, userId, layer, bbox, dateRange }, async () => {
      let raw;
      try {
        raw = await sentinelClient.fetchMetadata({ bbox, dateRange });
      } catch (error) {
        logger.error("Sentinel Hub metadata fetch failed", {
          farmId: farm.id,
          layer,
          message: error.message,
        });
        throw error.isOperational
          ? error
          : ApiError.internal(
              "Satellite metadata is temporarily unavailable. Please try again shortly."
            );
      }

      const mapped = sentinelMapper.mapMetadata(raw, { layer, bbox, dateRange });
      return {
        data: mapped,
        meta: { farmId: farm.id },
        logMetadata: { sceneCount: mapped.sceneCount },
      };
    });
  },

  /**
   * getCurrent: combined image + metadata + health metrics.
   * The primary endpoint for the SatellitePage dashboard.
   */
  async getCurrent(userId, farmId, { layer, startDate, endDate }) {
    assertLayerSupported(layer);

    // Fetch image and metadata concurrently
    const [imageResult, metadataResult] = await Promise.allSettled([
      this.getImage(userId, farmId, { layer, startDate, endDate }),
      this.getMetadata(userId, farmId, {
        layer,
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        endDate,
      }),
    ]);

    // BUGFIX: previously both branches of Promise.allSettled were collapsed
    // straight to `null` on failure with no further signal - the endpoint
    // always resolved with HTTP 200/success:true, so the frontend's
    // isError flag was never set and every card silently rendered its
    // empty ("—") state as if there just happened to be no data, even when
    // Sentinel Hub was completely unreachable or misconfigured. We now:
    //   1. Log the real reason for each failure (was previously discarded).
    //   2. If BOTH image and metadata failed, throw a real error so the
    //      controller returns a non-200 response with a meaningful message
    //      and the frontend shows SatelliteError (with retry) instead of a
    //      false "loaded but empty" dashboard.
    //   3. If only one side failed, still return the data we do have, but
    //      keep the failure reason on hand for logging/observability.
    if (imageResult.status === "rejected") {
      logger.error("getCurrent: image fetch failed", {
        farmId,
        layer,
        message: imageResult.reason?.message,
      });
    }
    if (metadataResult.status === "rejected") {
      logger.error("getCurrent: metadata fetch failed", {
        farmId,
        layer,
        message: metadataResult.reason?.message,
      });
    }

    if (imageResult.status === "rejected" && metadataResult.status === "rejected") {
      const reason = imageResult.reason;
      throw reason?.isOperational
        ? reason
        : ApiError.internal(
            "Satellite imagery is temporarily unavailable. Please try again shortly."
          );
    }

    const image =
      imageResult.status === "fulfilled" ? imageResult.value.data : null;
    const metadata =
      metadataResult.status === "fulfilled" ? metadataResult.value.data : null;
    const imageError =
      imageResult.status === "rejected"
        ? imageResult.reason?.message || "Satellite image unavailable"
        : null;
    const metadataError =
      metadataResult.status === "rejected"
        ? metadataResult.reason?.message || "Satellite metadata unavailable"
        : null;

    // Compute health score from metadata
    const health = metadata
      ? computeHealthScore({
          sceneCount: metadata.sceneCount,
          scenes: metadata.scenes,
        })
      : null;

    // Compute crop assessment
    const assessment =
      metadata
        ? assessCropHealth({
            cloudCoverPercent: metadata.scenes?.[0]?.cloudCoverPercent ?? null,
          })
        : null;

    return {
      farmId,
      image,
      metadata,
      health: health
        ? { ...health, assessment }
        : null,
      imageError,
      metadataError,
    };
  },

  /**
   * getHealthMetrics: scores and crop assessment without a full image payload.
   */
  async getHealthMetrics(userId, farmId, { startDate, endDate }) {
    const { data: metadata, meta } = await this.getMetadata(userId, farmId, {
      layer: "TRUE_COLOR",
      startDate,
      endDate,
    });

    const health = computeHealthScore({
      sceneCount: metadata.sceneCount,
      scenes: metadata.scenes,
    });

    const assessment = assessCropHealth({
      cloudCoverPercent: metadata.scenes?.[0]?.cloudCoverPercent ?? null,
    });

    return {
      farmId: meta.farmId,
      health: { ...health, assessment },
      metadata,
    };
  },

  /**
   * getTimelapse: fetch images for preset time windows.
   * Returns labeled frames for before/after or animation use.
   */
  async getTimelapse(userId, farmId, { layer }) {
    assertLayerSupported(layer);

    const now = new Date();
    const fmt = (d) => d.toISOString().slice(0, 10);

    const periods = [
      {
        label: "Last Week",
        period: "week",
        dateRange: {
          from: fmt(new Date(now - 7 * 24 * 60 * 60 * 1000)),
          to: fmt(now),
        },
      },
      {
        label: "Last Month",
        period: "month",
        dateRange: {
          from: fmt(new Date(now - 30 * 24 * 60 * 60 * 1000)),
          to: fmt(now),
        },
      },
      {
        label: "Last Season",
        period: "season",
        dateRange: {
          from: fmt(new Date(now - 90 * 24 * 60 * 60 * 1000)),
          to: fmt(now),
        },
      },
    ];

    const frames = await Promise.all(
      periods.map(async (period) => {
        try {
          const { data } = await this.getImage(userId, farmId, {
            layer,
            startDate: period.dateRange.from,
            endDate: period.dateRange.to,
          });
          return { ...period, image: data };
        } catch {
          return { ...period, image: null };
        }
      })
    );

    return { farmId, frames };
  },

  /**
   * refreshFarm: invalidate all cached entries for a farm.
   */
  async refreshFarm(userId, farmId) {
    // Verify ownership first
    await getOwnedFarmOrThrow(userId, farmId);

    const invalidatedRows = await cacheService.invalidateFarm(farmId);
    return {
      farmId,
      invalidatedRows,
      refreshedAt: new Date().toISOString(),
    };
  },
};
