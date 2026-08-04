import { ApiError } from "../../utils/ApiError.js";
import { logger } from "../../utils/logger.js";
import { env } from "../../config/env.js";
import { farmRepository } from "../farms/farm.repository.js";
import { weatherRepository } from "./weather.repository.js";
import { openMeteoClient } from "../../integrations/weather/openMeteo.js";
import { weatherMapper } from "../../integrations/weather/weatherMapper.js";

// Business logic for the weather module. Controllers never touch the
// repository, Open-Meteo client, or mapper directly - same convention as
// modules/farms/farm.service.js. Every method takes the authenticated
// userId first so farm ownership is enforced here, in one place, before
// any weather data is read or fetched.

// Shared by every farm-scoped weather method: confirms the farm exists AND
// belongs to this user before we do anything with its coordinates. Reuses
// farmRepository (the farms module's own repository) rather than querying
// `farms` directly, so the ownership rule lives in exactly one place.
async function getOwnedFarmOrThrow(userId, farmId) {
  const farm = await farmRepository.findByIdForUser(farmId, userId);
  if (!farm) {
    throw ApiError.notFound("Farm not found");
  }
  return farm;
}

function isCacheFresh(cacheRow) {
  return Boolean(cacheRow) && new Date(cacheRow.expiresAt).getTime() > Date.now();
}

function expiresAt(forecastType) {
  const ttlSeconds = env.weather.cacheTtlSeconds[forecastType];
  return new Date(Date.now() + ttlSeconds * 1000);
}

// Fetches a fresh forecast from Open-Meteo, normalizes it, caches the
// current/hourly/daily blocks individually (each with its own TTL), and
// persists hourly + daily readings into weather_history as a side effect.
// Returns the three normalized blocks so callers can pick what they need
// without re-fetching.
async function fetchAndCacheForecast(farm) {
  let raw;
  try {
    raw = await openMeteoClient.fetchForecast(farm.latitude, farm.longitude);
  } catch (error) {
    logger.error("Open-Meteo forecast fetch failed", {
      farmId: farm.id,
      message: error.message,
    });
    throw ApiError.internal(
      "Weather provider is temporarily unavailable. Please try again shortly."
    );
  }

  const current = weatherMapper.mapCurrent(raw);
  const hourly = weatherMapper.mapHourly(raw);
  const daily = weatherMapper.mapDaily(raw);

  await Promise.all([
    current
      ? weatherRepository.upsertCache(farm.id, "current", current, expiresAt("current"))
      : null,
    weatherRepository.upsertCache(farm.id, "hourly", hourly, expiresAt("hourly")),
    weatherRepository.upsertCache(farm.id, "daily", daily, expiresAt("daily")),
  ]);

  // Best-effort history save - a failure here shouldn't fail the request,
  // the caller already has the data they asked for.
  try {
    await weatherRepository.bulkUpsertHistory(farm.id, [...hourly, ...daily]);
  } catch (error) {
    logger.warn("Weather history save failed", { farmId: farm.id, message: error.message });
  }

  return { current, hourly, daily };
}

// Cache-first read for a single forecast block. On a miss (or stale entry)
// it fetches+caches all three blocks together (one Open-Meteo call serves
// current/hourly/daily at once), then returns just the block asked for.
async function getForecastBlock(farm, forecastType) {
  const cached = await weatherRepository.findCache(farm.id, forecastType);
  if (isCacheFresh(cached)) {
    return { data: cached.payload, cacheHit: true, fetchedAt: cached.fetchedAt };
  }

  const fresh = await fetchAndCacheForecast(farm);
  return { data: fresh[forecastType], cacheHit: false, fetchedAt: new Date() };
}

export const weatherService = {
  getCurrent: async (userId, farmId) => {
    const farm = await getOwnedFarmOrThrow(userId, farmId);
    const { data, cacheHit, fetchedAt } = await getForecastBlock(farm, "current");
    if (!data) {
      throw ApiError.internal("Current weather is temporarily unavailable for this farm.");
    }
    return { data, meta: { farmId, cache: { hit: cacheHit, fetchedAt } } };
  },

  getHourly: async (userId, farmId) => {
    const farm = await getOwnedFarmOrThrow(userId, farmId);
    const { data, cacheHit, fetchedAt } = await getForecastBlock(farm, "hourly");
    return { data, meta: { farmId, cache: { hit: cacheHit, fetchedAt } } };
  },

  getDaily: async (userId, farmId) => {
    const farm = await getOwnedFarmOrThrow(userId, farmId);
    const { data, cacheHit, fetchedAt } = await getForecastBlock(farm, "daily");
    return { data, meta: { farmId, cache: { hit: cacheHit, fetchedAt } } };
  },

  // History reads from our own weather_history table first (populated as a
  // side effect of every forecast fetch). If the requested range predates
  // anything we've stored, it falls back to Open-Meteo's archive API and
  // backfills the table so the next request for that range is a DB read.
  getHistory: async (userId, farmId, { startDate, endDate }) => {
    const farm = await getOwnedFarmOrThrow(userId, farmId);

    const rangeEnd = endDate || new Date();
    const rangeStart = startDate || new Date(rangeEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    let rows = await weatherRepository.findHistory(farm.id, {
      startDate: rangeStart,
      endDate: rangeEnd,
    });

    if (rows.length === 0) {
      const toDateStr = (d) => d.toISOString().slice(0, 10);
      let raw;
      try {
        raw = await openMeteoClient.fetchHistory(
          farm.latitude,
          farm.longitude,
          toDateStr(rangeStart),
          toDateStr(rangeEnd)
        );
      } catch (error) {
        logger.error("Open-Meteo history fetch failed", {
          farmId: farm.id,
          message: error.message,
        });
        throw ApiError.internal(
          "Weather history is temporarily unavailable. Please try again shortly."
        );
      }

      const mapped = weatherMapper.mapHistory(raw);
      try {
        await weatherRepository.bulkUpsertHistory(farm.id, mapped);
      } catch (error) {
        logger.warn("Weather history backfill save failed", {
          farmId: farm.id,
          message: error.message,
        });
      }
      rows = await weatherRepository.findHistory(farm.id, {
        startDate: rangeStart,
        endDate: rangeEnd,
      });
    }

    return { data: rows, meta: { farmId } };
  },
};
