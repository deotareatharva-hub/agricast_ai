import { and, eq, gte, lte, sql, desc, count, avg, min, max, sum } from "drizzle-orm";
import { db } from "../../config/db.js";
import {
  weatherHistory,
  recommendations,
  reports,
  farms,
  analyticsCache,
} from "../../db/schema/index.js";

// Only layer allowed to talk to Drizzle/the database for the analytics
// module - same convention as every other module's repository (see
// modules/weather/weather.repository.js, modules/ai/ai.repository.js).
// No business logic and no farm-ownership checks live here (that's
// analytics.service.js's job, via farmRepository) - every method here
// trusts the farmId it's given belongs to the caller. Every query is
// parameterized through Drizzle's query builder; the only raw `sql`
// fragments used are date_trunc() unit literals, and those are always
// picked from a small server-side allowlist (see GRANULARITY_UNITS
// below), never interpolated from unvalidated request input.

// date_trunc() takes its unit as a literal, not a bind parameter, so it
// can't be passed through Drizzle's normal parameter binding. Restricting
// the value to this allowlist (checked in analytics.validator.js AND
// re-checked here as defense in depth) keeps every query fully safe from
// injection while still allowing day/week/month grouping.
const GRANULARITY_UNITS = { day: "day", week: "week", month: "month" };

function truncUnit(granularity) {
  const unit = GRANULARITY_UNITS[granularity];
  if (!unit) {
    throw new Error(`Unsupported granularity: ${granularity}`);
  }
  return unit;
}

export const analyticsRepository = {
  // --- analytics_cache -------------------------------------------------------

  findCache: async (farmId, cacheKey) => {
    const rows = await db
      .select()
      .from(analyticsCache)
      .where(
        and(eq(analyticsCache.farmId, farmId), eq(analyticsCache.cacheKey, cacheKey))
      );
    return rows[0] || null;
  },

  // Upsert on (farmId, cacheKey) - a farm has at most one cached row per
  // key at any time, same pattern as weather_cache's upsertCache.
  upsertCache: async (farmId, cacheKey, payload, expiresAt) => {
    const rows = await db
      .insert(analyticsCache)
      .values({ farmId, cacheKey, payload, expiresAt })
      .onConflictDoUpdate({
        target: [analyticsCache.farmId, analyticsCache.cacheKey],
        set: { payload, expiresAt, computedAt: new Date(), updatedAt: new Date() },
      })
      .returning();
    return rows[0];
  },

  // --- farm -------------------------------------------------------

  findFarmById: async (farmId) => {
    const rows = await db.select().from(farms).where(eq(farms.id, farmId));
    return rows[0] || null;
  },

  // --- weather_history aggregates -------------------------------------------------------

  // Single-row aggregate (avg/min/max/sum) across the whole date range -
  // the base for "Weather Summary" and the dashboard's headline numbers.
  getWeatherSummary: async (farmId, { startDate, endDate } = {}) => {
    const conditions = [eq(weatherHistory.farmId, farmId)];
    if (startDate) conditions.push(gte(weatherHistory.recordedAt, startDate));
    if (endDate) conditions.push(lte(weatherHistory.recordedAt, endDate));

    const rows = await db
      .select({
        recordCount: count(weatherHistory.id),
        avgTemperature: avg(weatherHistory.temperature),
        minTemperature: min(weatherHistory.temperature),
        maxTemperature: max(weatherHistory.temperature),
        avgHumidity: avg(weatherHistory.humidity),
        minHumidity: min(weatherHistory.humidity),
        maxHumidity: max(weatherHistory.humidity),
        avgWindSpeed: avg(weatherHistory.windSpeed),
        maxWindSpeed: max(weatherHistory.windSpeed),
        avgRainProbability: avg(weatherHistory.rainProbability),
        totalRainProbability: sum(weatherHistory.rainProbability),
        firstRecordedAt: min(weatherHistory.recordedAt),
        lastRecordedAt: max(weatherHistory.recordedAt),
      })
      .from(weatherHistory)
      .where(and(...conditions));

    return rows[0] || null;
  },

  // Grouped trend rows (one row per day/week/month) - the base for
  // Temperature/Rainfall/Humidity/Wind Trends. `granularity` is always
  // pre-validated (analytics.validator.js) and re-checked (truncUnit)
  // before being used to build the date_trunc() expression.
  getWeatherTrends: async (farmId, { startDate, endDate, granularity }) => {
    const unit = truncUnit(granularity);
    const conditions = [eq(weatherHistory.farmId, farmId)];
    if (startDate) conditions.push(gte(weatherHistory.recordedAt, startDate));
    if (endDate) conditions.push(lte(weatherHistory.recordedAt, endDate));

    const period = sql`date_trunc(${unit}, ${weatherHistory.recordedAt})`.as("period");

    return db
      .select({
        period,
        recordCount: count(weatherHistory.id),
        avgTemperature: avg(weatherHistory.temperature),
        minTemperature: min(weatherHistory.temperature),
        maxTemperature: max(weatherHistory.temperature),
        avgHumidity: avg(weatherHistory.humidity),
        avgWindSpeed: avg(weatherHistory.windSpeed),
        maxWindSpeed: max(weatherHistory.windSpeed),
        avgRainProbability: avg(weatherHistory.rainProbability),
        totalRainProbability: sum(weatherHistory.rainProbability),
      })
      .from(weatherHistory)
      .where(and(...conditions))
      .groupBy(period)
      .orderBy(period);
  },

  // Frequency of each Open-Meteo weather_code in range - the base for
  // "Weather Distribution" (e.g. "12 clear days, 5 rainy days").
  getWeatherDistribution: async (farmId, { startDate, endDate } = {}) => {
    const conditions = [eq(weatherHistory.farmId, farmId)];
    if (startDate) conditions.push(gte(weatherHistory.recordedAt, startDate));
    if (endDate) conditions.push(lte(weatherHistory.recordedAt, endDate));

    return db
      .select({
        weatherCode: weatherHistory.weatherCode,
        occurrences: count(weatherHistory.id),
      })
      .from(weatherHistory)
      .where(and(...conditions))
      .groupBy(weatherHistory.weatherCode)
      .orderBy(desc(count(weatherHistory.id)));
  },

  // --- recommendations aggregates -------------------------------------------------------

  getRecommendationHistory: async (farmId, { limit, offset } = {}) => {
    return db
      .select({
        id: recommendations.id,
        parsedResponse: recommendations.parsedResponse,
        language: recommendations.language,
        confidence: recommendations.confidence,
        createdAt: recommendations.createdAt,
      })
      .from(recommendations)
      .where(eq(recommendations.farmId, farmId))
      .orderBy(desc(recommendations.createdAt))
      .limit(limit || 20)
      .offset(offset || 0);
  },

  getRecommendationSummary: async (farmId, { startDate, endDate } = {}) => {
    const conditions = [eq(recommendations.farmId, farmId)];
    if (startDate) conditions.push(gte(recommendations.createdAt, startDate));
    if (endDate) conditions.push(lte(recommendations.createdAt, endDate));

    const rows = await db
      .select({
        totalCount: count(recommendations.id),
        avgConfidence: avg(recommendations.confidence),
        minConfidence: min(recommendations.confidence),
        maxConfidence: max(recommendations.confidence),
        firstGeneratedAt: min(recommendations.createdAt),
        lastGeneratedAt: max(recommendations.createdAt),
      })
      .from(recommendations)
      .where(and(...conditions));

    return rows[0] || null;
  },

  // Confidence trend over time, grouped by granularity - preparation for
  // "Recommendation Accuracy" once a future module records actual outcomes
  // (see AnalyticsGuide.md "Future Extensions"); for now this tracks how
  // the AI's own stated confidence moves over time as a proxy signal.
  getRecommendationConfidenceTrend: async (farmId, { startDate, endDate, granularity }) => {
    const unit = truncUnit(granularity);
    const conditions = [eq(recommendations.farmId, farmId)];
    if (startDate) conditions.push(gte(recommendations.createdAt, startDate));
    if (endDate) conditions.push(lte(recommendations.createdAt, endDate));

    const period = sql`date_trunc(${unit}, ${recommendations.createdAt})`.as("period");

    return db
      .select({
        period,
        recommendationCount: count(recommendations.id),
        avgConfidence: avg(recommendations.confidence),
      })
      .from(recommendations)
      .where(and(...conditions))
      .groupBy(period)
      .orderBy(period);
  },

  getRecommendationLanguageDistribution: async (farmId) => {
    return db
      .select({
        language: recommendations.language,
        occurrences: count(recommendations.id),
      })
      .from(recommendations)
      .where(eq(recommendations.farmId, farmId))
      .groupBy(recommendations.language)
      .orderBy(desc(count(recommendations.id)));
  },

  // --- reports (used for lightweight farm activity stats only - never a
  // substitute for the reports module itself) -------------------------------------------------------

  countReportsForFarm: async (farmId) => {
    const rows = await db
      .select({ totalCount: count(reports.id) })
      .from(reports)
      .where(eq(reports.farmId, farmId));
    return rows[0]?.totalCount ?? 0;
  },
};
