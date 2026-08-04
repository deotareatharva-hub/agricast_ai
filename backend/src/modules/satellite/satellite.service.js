import crypto from "crypto";
import { ApiError } from "../../utils/ApiError.js";
import { logger } from "../../utils/logger.js";
import { env } from "../../config/env.js";
import { farmRepository } from "../farms/farm.repository.js";
import { satelliteRepository } from "./satellite.repository.js";
import { sentinelClient, SUPPORTED_LAYERS } from "../../integrations/satellite/sentinel.js";
import { sentinelMapper } from "../../integrations/satellite/sentinelMapper.js";

// Business logic for the satellite module. Controllers never touch the
// repository, Sentinel Hub client, or mapper directly - same convention as
// modules/weather/weather.service.js. Every method takes the authenticated
// userId first so farm ownership is enforced here, in one place, before
// any satellite request is built or sent.

// Shared by every farm-scoped method: confirms the farm exists AND belongs
// to this user before we touch its coordinates. Reuses farmRepository (the
// farms module's own repository) so ownership stays a single source of
// truth, same as weather.service.js does.
async function getOwnedFarmOrThrow(userId, farmId) {
  const farm = await farmRepository.findByIdForUser(farmId, userId);
  if (!farm) {
    throw ApiError.notFound("Farm not found");
  }
  return farm;
}

function assertLayerSupported(layer) {
  if (!SUPPORTED_LAYERS.includes(layer)) {
    throw ApiError.badRequest(
      `Unsupported layer. Supported layers: ${SUPPORTED_LAYERS.join(", ")}`
    );
  }
}

// Sentinel Hub expects a bbox as [minLng, minLat, maxLng, maxLat]. Farms
// only store a single lat/lng point (db/schema/farms.schema.js has no
// polygon column), so a small square bounding box is derived around that
// point using a configurable buffer - this satisfies the "Farm Latitude,
// Farm Longitude, Bounding Box" requirement without a schema change to the
// farms module (which this task must not rewrite).
const METERS_PER_DEGREE_LAT = 111320;

function computeBoundingBox(latitude, longitude, bufferMeters) {
  const latDelta = bufferMeters / METERS_PER_DEGREE_LAT;
  const lngDelta =
    bufferMeters / (METERS_PER_DEGREE_LAT * Math.cos((latitude * Math.PI) / 180));

  return [
    Number((longitude - lngDelta).toFixed(6)),
    Number((latitude - latDelta).toFixed(6)),
    Number((longitude + lngDelta).toFixed(6)),
    Number((latitude + latDelta).toFixed(6)),
  ];
}

// Defaults to the last `defaultRangeDays` days ending today when the
// caller doesn't supply an explicit range - same "sane default" pattern as
// weather.service.js's getHistory.
function resolveDateRange({ startDate, endDate }) {
  const toDate = endDate ? new Date(endDate) : new Date();
  const fromDate = startDate
    ? new Date(startDate)
    : new Date(toDate.getTime() - env.satellite.defaultRangeDays * 24 * 60 * 60 * 1000);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw ApiError.badRequest("Invalid date range");
  }
  if (fromDate > toDate) {
    throw ApiError.badRequest("startDate must be before endDate");
  }

  const toIsoDate = (d) => d.toISOString().slice(0, 10);
  return { from: toIsoDate(fromDate), to: toIsoDate(toDate) };
}

function hashParams(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function isCacheFresh(row) {
  return Boolean(row) && new Date(row.expiresAt).getTime() > Date.now();
}

function computeExpiresAt() {
  return new Date(Date.now() + env.satellite.cacheTtlSeconds * 1000);
}

// Every satellite request (cache hit or miss, success or failure) is
// logged to satellite_requests for audit/debugging visibility - logging
// itself is best-effort and never allowed to fail (or mask) the actual
// request, same convention as weather.service.js's history-save handling.
async function withRequestLog({ farmId, userId, layer, bbox, dateRange }, work) {
  try {
    const { data, meta, logMetadata, cacheExpiresAt } = await work();
    await satelliteRepository
      .logRequest({
        farmId,
        userId,
        layer,
        bbox,
        dateRange,
        status: "success",
        responseMetadata: logMetadata ?? null,
        expiresAt: cacheExpiresAt ?? null,
      })
      .catch((err) =>
        logger.warn("Satellite request log (success) failed", {
          farmId,
          message: err.message,
        })
      );
    return { data, meta };
  } catch (error) {
    await satelliteRepository
      .logRequest({
        farmId,
        userId,
        layer,
        bbox,
        dateRange,
        status: "error",
        errorMessage: error.message,
      })
      .catch((err) =>
        logger.warn("Satellite request log (error) failed", {
          farmId,
          message: err.message,
        })
      );
    throw error;
  }
}

export const satelliteService = {
  // Static, no DB/network call - just documents which evalscripts
  // sentinel.js currently supports.
  getLayers: () => ({ data: sentinelMapper.mapLayers(SUPPORTED_LAYERS) }),

  getImage: async (userId, farmId, { layer, startDate, endDate }) => {
    assertLayerSupported(layer);
    const farm = await getOwnedFarmOrThrow(userId, farmId);

    const bbox = computeBoundingBox(farm.latitude, farm.longitude, env.satellite.bboxBufferMeters);
    const dateRange = resolveDateRange({ startDate, endDate });
    const { width, height } = env.satellite.imageSize;
    const paramsHash = hashParams({ bbox, dateRange, layer, width, height });

    const cached = await satelliteRepository.findCache(farm.id, layer, paramsHash);
    if (isCacheFresh(cached)) {
      return {
        data: {
          layer,
          bbox,
          dateRange,
          mimeType: cached.imageMimeType,
          imageBase64: cached.imageBase64,
          sizeBytes: cached.responseMetadata?.sizeBytes ?? null,
        },
        meta: { farmId, cache: { hit: true, fetchedAt: cached.requestTime } },
      };
    }

    return withRequestLog({ farmId: farm.id, userId, layer, bbox, dateRange }, async () => {
      let raw;
      try {
        raw = await sentinelClient.fetchImage({ bbox, dateRange, layer, width, height });
      } catch (error) {
        logger.error("Sentinel Hub image fetch failed", {
          farmId: farm.id,
          layer,
          message: error.message,
        });
        throw error.isOperational
          ? error
          : ApiError.internal("Satellite imagery is temporarily unavailable. Please try again shortly.");
      }

      const mapped = sentinelMapper.mapImage(raw, { layer, bbox, dateRange });
      const responseMetadata = { sizeBytes: mapped.sizeBytes };
      const cacheExpiresAt = computeExpiresAt();

      await satelliteRepository.upsertCache({
        farmId: farm.id,
        layer,
        paramsHash,
        bbox,
        dateRange,
        responseMetadata,
        imageBase64: mapped.imageBase64,
        imageMimeType: mapped.mimeType,
        expiresAt: cacheExpiresAt,
      });

      return {
        data: mapped,
        meta: { farmId, cache: { hit: false, fetchedAt: new Date() } },
        logMetadata: responseMetadata,
        cacheExpiresAt,
      };
    });
  },

  getMetadata: async (userId, farmId, { layer, startDate, endDate }) => {
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
          : ApiError.internal("Satellite metadata is temporarily unavailable. Please try again shortly.");
      }

      const mapped = sentinelMapper.mapMetadata(raw, { layer, bbox, dateRange });
      return {
        data: mapped,
        meta: { farmId },
        logMetadata: { sceneCount: mapped.sceneCount },
      };
    });
  },
};
