import crypto from "crypto";
import { ApiError } from "../../utils/ApiError.js";
import { logger } from "../../utils/logger.js";
import { farmRepository } from "../farms/farm.repository.js";
import { analyticsRepository } from "./analytics.repository.js";

// Business logic for the analytics module. Controllers never touch the
// repository directly - same convention as every other module's service.
// Every method takes the authenticated userId first so farm ownership is
// enforced here, in one place, before any aggregate query runs - same
// "ownership at the service boundary" pattern reports.service.js and
// ai.service.js use.

// --- cache TTLs (seconds) -------------------------------------------------------
// Deliberately different per analytics type, same reasoning as
// env.weather.cacheTtlSeconds: a dashboard is checked often and should
// feel near-live, while a monthly summary barely changes within a day.
const CACHE_TTL_SECONDS = {
  dashboard: 15 * 60, // 15 min
  weather: 30 * 60, // 30 min
  recommendations: 30 * 60, // 30 min
  monthly: 6 * 60 * 60, // 6 hours
  weekly: 60 * 60, // 1 hour
  summary: 15 * 60, // 15 min
};

const DEFAULT_TREND_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// --- ownership -------------------------------------------------------

async function getOwnedFarmOrThrow(userId, farmId) {
  const farm = await farmRepository.findByIdForUser(farmId, userId);
  if (!farm) {
    throw ApiError.notFound("Farm not found");
  }
  return farm;
}

// --- cache-or-compute -------------------------------------------------------

// Deterministic key from the analytics type plus every parameter that
// changes the result, so e.g. weather:day:2026-07-01:2026-08-01 and
// weather:week:2026-07-01:2026-08-01 never collide. Hashed to keep the
// stored cache_key short and immune to formatting differences, same
// dedup-key idea as reports.service.js's contentHash.
function buildCacheKey(type, params) {
  const raw = `${type}:${JSON.stringify(params)}`;
  const hash = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
  return `${type}:${hash}`;
}

async function getFromCacheOrCompute(farmId, type, params, computeFn) {
  const cacheKey = buildCacheKey(type, params);

  try {
    const cached = await analyticsRepository.findCache(farmId, cacheKey);
    if (cached && new Date(cached.expiresAt) > new Date()) {
      return { data: cached.payload, cached: true, computedAt: cached.computedAt };
    }
  } catch (error) {
    // A cache read failure should never break analytics - fall through to
    // a fresh computation instead. See ERROR HANDLING: "Graceful fallback".
    logger.warn("Analytics cache read failed, computing fresh", {
      farmId,
      type,
      message: error.message,
    });
  }

  const payload = await computeFn();
  const ttlSeconds = CACHE_TTL_SECONDS[type] || CACHE_TTL_SECONDS.summary;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  try {
    await analyticsRepository.upsertCache(farmId, cacheKey, payload, expiresAt);
  } catch (error) {
    // Caching is a performance optimization, not a correctness
    // requirement - a failed write still returns the freshly computed
    // result to the caller.
    logger.warn("Analytics cache write failed", {
      farmId,
      type,
      message: error.message,
    });
  }

  return { data: payload, cached: false, computedAt: new Date() };
}

// --- date-range helpers -------------------------------------------------------

function resolveTrendRange({ startDate, endDate }) {
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - DEFAULT_TREND_DAYS * MS_PER_DAY);
  return { startDate: start, endDate: end };
}

// "YYYY-MM" -> first/last instant of that calendar month (UTC).
function resolveMonthRange(month) {
  const [yearStr, monthStr] = (month || defaultMonth()).split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));
  return { startDate: start, endDate: end, label: `${yearStr}-${monthStr}` };
}

function defaultMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

// "YYYY-Www" (ISO week) -> Monday 00:00 through the following Monday 00:00.
function resolveWeekRange(week) {
  const value = week || defaultIsoWeek();
  const [yearStr, weekStr] = value.split("-W");
  const year = Number(yearStr);
  const weekNumber = Number(weekStr);

  // ISO week 1 is the week containing the first Thursday of the year.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4.getTime() - (jan4Day - 1) * MS_PER_DAY);
  const start = new Date(week1Monday.getTime() + (weekNumber - 1) * 7 * MS_PER_DAY);
  const end = new Date(start.getTime() + 7 * MS_PER_DAY);

  return { startDate: start, endDate: end, label: value };
}

function defaultIsoWeek() {
  const now = new Date();
  const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((target - yearStart) / MS_PER_DAY + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function resolveDayRange(date) {
  const value = date ? new Date(date) : new Date();
  const start = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  const end = new Date(start.getTime() + MS_PER_DAY);
  return { startDate: start, endDate: end, label: start.toISOString().slice(0, 10) };
}

// --- shared aggregate builders -------------------------------------------------------

async function buildWeatherBlock(farmId, { startDate, endDate, granularity = "day" }) {
  const [summary, trends, distribution] = await Promise.all([
    analyticsRepository.getWeatherSummary(farmId, { startDate, endDate }),
    analyticsRepository.getWeatherTrends(farmId, { startDate, endDate, granularity }),
    analyticsRepository.getWeatherDistribution(farmId, { startDate, endDate }),
  ]);
  return { summary, trends, distribution };
}

async function buildRecommendationBlock(farmId, { startDate, endDate, granularity = "week" }) {
  const [summary, confidenceTrend, languageDistribution] = await Promise.all([
    analyticsRepository.getRecommendationSummary(farmId, { startDate, endDate }),
    analyticsRepository.getRecommendationConfidenceTrend(farmId, {
      startDate,
      endDate,
      granularity,
    }),
    analyticsRepository.getRecommendationLanguageDistribution(farmId),
  ]);
  return { summary, confidenceTrend, languageDistribution };
}

async function buildFarmStatistics(farm) {
  const reportCount = await analyticsRepository.countReportsForFarm(farm.id);
  const daysActive = Math.max(
    1,
    Math.floor((Date.now() - new Date(farm.createdAt).getTime()) / MS_PER_DAY)
  );
  return {
    farmId: farm.id,
    farmName: farm.farmName,
    crop: farm.crop,
    area: farm.area,
    areaUnit: farm.areaUnit,
    village: farm.village,
    district: farm.district,
    state: farm.state,
    country: farm.country,
    daysActive,
    reportCount,
  };
}

export const analyticsService = {
  // GET /api/v1/analytics/dashboard/:farmId
  getDashboard: async (userId, farmId) => {
    const farm = await getOwnedFarmOrThrow(userId, farmId);
    const range = resolveTrendRange({});

    const { data, cached, computedAt } = await getFromCacheOrCompute(
      farmId,
      "dashboard",
      { range: "default" },
      async () => {
        const [farmStatistics, weather, recommendationHistory, cropStatistics] =
          await Promise.all([
            buildFarmStatistics(farm),
            buildWeatherBlock(farmId, { ...range, granularity: "day" }),
            analyticsRepository.getRecommendationHistory(farmId, { limit: 5, offset: 0 }),
            buildCropStatistics(farm),
          ]);

        return {
          farm: farmStatistics,
          crop: cropStatistics,
          weather,
          recentRecommendations: recommendationHistory,
          rangeDays: DEFAULT_TREND_DAYS,
        };
      }
    );

    return { data, meta: { cached, computedAt } };
  },

  // GET /api/v1/analytics/weather/:farmId
  getWeatherAnalytics: async (userId, farmId, { startDate, endDate, granularity }) => {
    await getOwnedFarmOrThrow(userId, farmId);
    const range = resolveTrendRange({ startDate, endDate });
    const effectiveGranularity = granularity || "day";

    const { data, cached, computedAt } = await getFromCacheOrCompute(
      farmId,
      "weather",
      { ...serializeRange(range), granularity: effectiveGranularity },
      () => buildWeatherBlock(farmId, { ...range, granularity: effectiveGranularity })
    );

    return {
      data,
      meta: { cached, computedAt, granularity: effectiveGranularity, range: serializeRange(range) },
    };
  },

  // GET /api/v1/analytics/recommendations/:farmId
  getRecommendationAnalytics: async (
    userId,
    farmId,
    { startDate, endDate, granularity, limit, offset }
  ) => {
    await getOwnedFarmOrThrow(userId, farmId);
    const range = resolveTrendRange({ startDate, endDate });
    const effectiveGranularity = granularity || "week";

    const { data, cached, computedAt } = await getFromCacheOrCompute(
      farmId,
      "recommendations",
      { ...serializeRange(range), granularity: effectiveGranularity },
      () => buildRecommendationBlock(farmId, { ...range, granularity: effectiveGranularity })
    );

    // History is intentionally NOT cached (it's a cheap, already-indexed
    // lookup and callers expect it live) while the aggregate block above
    // is cached - same split reports.service.js makes between the cheap
    // findAllForUser list and the expensive report generation itself.
    const history = await analyticsRepository.getRecommendationHistory(farmId, {
      limit: limit || 20,
      offset: offset || 0,
    });

    return {
      data: { ...data, history },
      meta: { cached, computedAt, granularity: effectiveGranularity, range: serializeRange(range) },
    };
  },

  // GET /api/v1/analytics/monthly/:farmId
  getMonthlySummary: async (userId, farmId, { month }) => {
    await getOwnedFarmOrThrow(userId, farmId);
    const range = resolveMonthRange(month);

    const { data, cached, computedAt } = await getFromCacheOrCompute(
      farmId,
      "monthly",
      { month: range.label },
      async () => {
        const [weather, recommendations] = await Promise.all([
          buildWeatherBlock(farmId, { ...range, granularity: "day" }),
          buildRecommendationBlock(farmId, { ...range, granularity: "week" }),
        ]);
        return { month: range.label, weather, recommendations };
      }
    );

    return { data, meta: { cached, computedAt } };
  },

  // GET /api/v1/analytics/weekly/:farmId
  getWeeklySummary: async (userId, farmId, { week }) => {
    await getOwnedFarmOrThrow(userId, farmId);
    const range = resolveWeekRange(week);

    const { data, cached, computedAt } = await getFromCacheOrCompute(
      farmId,
      "weekly",
      { week: range.label },
      async () => {
        const [weather, recommendations] = await Promise.all([
          buildWeatherBlock(farmId, { ...range, granularity: "day" }),
          buildRecommendationBlock(farmId, { ...range, granularity: "day" }),
        ]);
        return { week: range.label, weather, recommendations };
      }
    );

    return { data, meta: { cached, computedAt } };
  },

  // GET /api/v1/analytics/summary/:farmId
  // Daily summary - "today" unless a specific date is requested.
  getSummary: async (userId, farmId, { date }) => {
    const farm = await getOwnedFarmOrThrow(userId, farmId);
    const range = resolveDayRange(date);

    const { data, cached, computedAt } = await getFromCacheOrCompute(
      farmId,
      "summary",
      { date: range.label },
      async () => {
        const [weather, recommendationHistory, farmStatistics] = await Promise.all([
          buildWeatherBlock(farmId, { ...range, granularity: "day" }),
          analyticsRepository.getRecommendationHistory(farmId, { limit: 3, offset: 0 }),
          buildFarmStatistics(farm),
        ]);
        return {
          date: range.label,
          farm: farmStatistics,
          weather,
          latestRecommendations: recommendationHistory,
        };
      }
    );

    return { data, meta: { cached, computedAt } };
  },
};

function serializeRange({ startDate, endDate }) {
  return {
    startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
    endDate: endDate instanceof Date ? endDate.toISOString() : endDate,
  };
}

// Crop statistics is deliberately minimal today - farms currently store a
// single crop string with no crop-cycle history (see db/schema/farms.schema.js).
// This groundwork lets the dashboard show a "Crop" card now without an API
// contract change once a future crop-cycle module adds real history - see
// AnalyticsGuide.md "Future Extensions".
async function buildCropStatistics(farm) {
  return {
    crop: farm.crop,
    area: farm.area,
    areaUnit: farm.areaUnit,
  };
}
