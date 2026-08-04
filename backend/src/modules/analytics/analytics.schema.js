// Response DTOs for the analytics module. Deliberately separate from
// db/schema/analytics.schema.js (the Drizzle table definition) - this file
// shapes what the FRONTEND receives, same separation of concerns as
// modules/reports/reports.schema.js and modules/ai/ai.schema.js.
//
// Postgres aggregate functions (avg/sum/min/max over `numeric` columns)
// come back from node-pg as strings, not numbers - every numeric field
// passes through toNumber() so the frontend always receives real JSON
// numbers, rounded to a sane precision, never "12.400000000000000000" or
// null-shaped surprises.

function toNumber(value, decimals = 2) {
  if (value === null || value === undefined) return null;
  const num = typeof value === "number" ? value : parseFloat(value);
  if (Number.isNaN(num)) return null;
  return Math.round(num * 10 ** decimals) / 10 ** decimals;
}

function toIsoOrNull(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toWeatherSummaryDto(summary) {
  if (!summary) return null;
  return {
    recordCount: Number(summary.recordCount) || 0,
    temperature: {
      avg: toNumber(summary.avgTemperature),
      min: toNumber(summary.minTemperature),
      max: toNumber(summary.maxTemperature),
    },
    humidity: {
      avg: toNumber(summary.avgHumidity),
      min: toNumber(summary.minHumidity),
      max: toNumber(summary.maxHumidity),
    },
    wind: {
      avgSpeed: toNumber(summary.avgWindSpeed),
      maxSpeed: toNumber(summary.maxWindSpeed),
    },
    rain: {
      avgProbability: toNumber(summary.avgRainProbability),
      totalProbability: toNumber(summary.totalRainProbability),
    },
    firstRecordedAt: toIsoOrNull(summary.firstRecordedAt),
    lastRecordedAt: toIsoOrNull(summary.lastRecordedAt),
  };
}

function toWeatherTrendPointDto(row) {
  return {
    period: toIsoOrNull(row.period),
    recordCount: Number(row.recordCount) || 0,
    temperature: {
      avg: toNumber(row.avgTemperature),
      min: toNumber(row.minTemperature),
      max: toNumber(row.maxTemperature),
    },
    avgHumidity: toNumber(row.avgHumidity),
    wind: {
      avgSpeed: toNumber(row.avgWindSpeed),
      maxSpeed: toNumber(row.maxWindSpeed),
    },
    rain: {
      avgProbability: toNumber(row.avgRainProbability),
      totalProbability: toNumber(row.totalRainProbability),
    },
  };
}

function toWeatherDistributionDto(rows) {
  return rows.map((row) => ({
    weatherCode: row.weatherCode,
    occurrences: Number(row.occurrences) || 0,
  }));
}

function toWeatherBlockDto(block) {
  if (!block) return null;
  return {
    summary: toWeatherSummaryDto(block.summary),
    trends: (block.trends || []).map(toWeatherTrendPointDto),
    distribution: toWeatherDistributionDto(block.distribution || []),
  };
}

function toRecommendationSummaryDto(summary) {
  if (!summary) return null;
  return {
    totalCount: Number(summary.totalCount) || 0,
    confidence: {
      avg: toNumber(summary.avgConfidence),
      min: toNumber(summary.minConfidence),
      max: toNumber(summary.maxConfidence),
    },
    firstGeneratedAt: toIsoOrNull(summary.firstGeneratedAt),
    lastGeneratedAt: toIsoOrNull(summary.lastGeneratedAt),
  };
}

function toConfidenceTrendPointDto(row) {
  return {
    period: toIsoOrNull(row.period),
    recommendationCount: Number(row.recommendationCount) || 0,
    avgConfidence: toNumber(row.avgConfidence),
  };
}

function toLanguageDistributionDto(rows) {
  return rows.map((row) => ({
    language: row.language,
    occurrences: Number(row.occurrences) || 0,
  }));
}

function toRecommendationHistoryItemDto(row) {
  return {
    id: row.id,
    summary: row.parsedResponse?.summary ?? null,
    confidence: toNumber(row.confidence),
    language: row.language,
    createdAt: toIsoOrNull(row.createdAt),
  };
}

function toRecommendationBlockDto(block) {
  if (!block) return null;
  return {
    summary: toRecommendationSummaryDto(block.summary),
    confidenceTrend: (block.confidenceTrend || []).map(toConfidenceTrendPointDto),
    languageDistribution: toLanguageDistributionDto(block.languageDistribution || []),
  };
}

function toFarmStatisticsDto(farm) {
  if (!farm) return null;
  return {
    farmId: farm.farmId,
    farmName: farm.farmName,
    crop: farm.crop,
    area: farm.area,
    areaUnit: farm.areaUnit,
    location: {
      village: farm.village,
      district: farm.district,
      state: farm.state,
      country: farm.country,
    },
    daysActive: farm.daysActive,
    reportCount: farm.reportCount,
  };
}

function toDashboardDto(data, meta) {
  return {
    farm: toFarmStatisticsDto(data.farm),
    crop: data.crop || null,
    weather: toWeatherBlockDto(data.weather),
    recentRecommendations: (data.recentRecommendations || []).map(
      toRecommendationHistoryItemDto
    ),
    rangeDays: data.rangeDays,
    cached: meta.cached,
    computedAt: toIsoOrNull(meta.computedAt),
  };
}

function toWeatherAnalyticsDto(data, meta) {
  return {
    ...toWeatherBlockDto(data),
    granularity: meta.granularity,
    range: meta.range,
    cached: meta.cached,
    computedAt: toIsoOrNull(meta.computedAt),
  };
}

function toRecommendationAnalyticsDto(data, meta) {
  return {
    ...toRecommendationBlockDto(data),
    history: (data.history || []).map(toRecommendationHistoryItemDto),
    granularity: meta.granularity,
    range: meta.range,
    cached: meta.cached,
    computedAt: toIsoOrNull(meta.computedAt),
  };
}

function toMonthlySummaryDto(data, meta) {
  return {
    month: data.month,
    weather: toWeatherBlockDto(data.weather),
    recommendations: toRecommendationBlockDto(data.recommendations),
    cached: meta.cached,
    computedAt: toIsoOrNull(meta.computedAt),
  };
}

function toWeeklySummaryDto(data, meta) {
  return {
    week: data.week,
    weather: toWeatherBlockDto(data.weather),
    recommendations: toRecommendationBlockDto(data.recommendations),
    cached: meta.cached,
    computedAt: toIsoOrNull(meta.computedAt),
  };
}

function toDailySummaryDto(data, meta) {
  return {
    date: data.date,
    farm: toFarmStatisticsDto(data.farm),
    weather: toWeatherBlockDto(data.weather),
    latestRecommendations: (data.latestRecommendations || []).map(
      toRecommendationHistoryItemDto
    ),
    cached: meta.cached,
    computedAt: toIsoOrNull(meta.computedAt),
  };
}

export const analyticsSchema = {
  toDashboardDto,
  toWeatherAnalyticsDto,
  toRecommendationAnalyticsDto,
  toMonthlySummaryDto,
  toWeeklySummaryDto,
  toDailySummaryDto,
};
