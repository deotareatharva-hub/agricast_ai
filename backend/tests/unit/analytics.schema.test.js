import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { analyticsSchema } from "../../src/modules/analytics/analytics.schema.js";

// These tests exercise the pure/deterministic DTO-shaping functions of the
// analytics module - no database or server required. Same "pure building
// blocks first" approach as tests/unit/reports.generators.test.js.

describe("analytics.schema DTOs", () => {
  test("toWeatherAnalyticsDto converts Postgres numeric strings to numbers", () => {
    const raw = {
      summary: {
        recordCount: "5",
        avgTemperature: "27.456789",
        minTemperature: "20.00",
        maxTemperature: "32.10",
        avgHumidity: "60.5",
        minHumidity: "50",
        maxHumidity: "70",
        avgWindSpeed: "6.2",
        maxWindSpeed: "9",
        avgRainProbability: "15.333333",
        totalRainProbability: "150",
        firstRecordedAt: "2026-07-01T00:00:00.000Z",
        lastRecordedAt: "2026-08-01T00:00:00.000Z",
      },
      trends: [
        {
          period: "2026-08-01T00:00:00.000Z",
          recordCount: "2",
          avgTemperature: "28.1",
          minTemperature: "27",
          maxTemperature: "29",
          avgHumidity: "55",
          avgWindSpeed: "5",
          maxWindSpeed: "7",
          avgRainProbability: "10",
          totalRainProbability: "20",
        },
      ],
      distribution: [{ weatherCode: 0, occurrences: "3" }],
    };

    const dto = analyticsSchema.toWeatherAnalyticsDto(raw, {
      granularity: "day",
      range: { startDate: "2026-07-01", endDate: "2026-08-01" },
      cached: false,
      computedAt: new Date("2026-08-01T00:00:00.000Z"),
    });

    assert.equal(typeof dto.summary.temperature.avg, "number");
    assert.equal(dto.summary.temperature.avg, 27.46);
    assert.equal(dto.summary.recordCount, 5);
    assert.equal(dto.trends[0].temperature.avg, 28.1);
    assert.equal(dto.distribution[0].occurrences, 3);
    assert.equal(dto.cached, false);
  });

  test("toWeatherAnalyticsDto handles a farm with no weather history (all nulls)", () => {
    const raw = {
      summary: {
        recordCount: "0",
        avgTemperature: null,
        minTemperature: null,
        maxTemperature: null,
        avgHumidity: null,
        minHumidity: null,
        maxHumidity: null,
        avgWindSpeed: null,
        maxWindSpeed: null,
        avgRainProbability: null,
        totalRainProbability: null,
        firstRecordedAt: null,
        lastRecordedAt: null,
      },
      trends: [],
      distribution: [],
    };

    const dto = analyticsSchema.toWeatherAnalyticsDto(raw, {
      granularity: "day",
      range: { startDate: "2026-07-01", endDate: "2026-08-01" },
      cached: false,
      computedAt: new Date(),
    });

    assert.equal(dto.summary.recordCount, 0);
    assert.equal(dto.summary.temperature.avg, null);
    assert.deepEqual(dto.trends, []);
    assert.deepEqual(dto.distribution, []);
  });

  test("toRecommendationAnalyticsDto shapes history and confidence stats", () => {
    const raw = {
      summary: {
        totalCount: "3",
        avgConfidence: "82.6666",
        minConfidence: "75",
        maxConfidence: "90",
        firstGeneratedAt: "2026-07-01T00:00:00.000Z",
        lastGeneratedAt: "2026-08-01T00:00:00.000Z",
      },
      confidenceTrend: [
        { period: "2026-08-01T00:00:00.000Z", recommendationCount: "3", avgConfidence: "82.6666" },
      ],
      languageDistribution: [{ language: "en", occurrences: "3" }],
      history: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          parsedResponse: { summary: "Irrigate soon" },
          confidence: "85",
          language: "en",
          createdAt: "2026-08-01T00:00:00.000Z",
        },
      ],
    };

    const dto = analyticsSchema.toRecommendationAnalyticsDto(raw, {
      granularity: "week",
      range: { startDate: "2026-07-01", endDate: "2026-08-01" },
      cached: true,
      computedAt: new Date(),
    });

    assert.equal(dto.summary.confidence.avg, 82.67);
    assert.equal(dto.history[0].summary, "Irrigate soon");
    assert.equal(dto.history[0].confidence, 85);
    assert.equal(dto.cached, true);
  });

  test("toDashboardDto composes farm, weather, and recommendation blocks", () => {
    const data = {
      farm: {
        farmId: "11111111-1111-4111-8111-111111111111",
        farmName: "Green Valley",
        crop: "Wheat",
        area: 5,
        areaUnit: "acres",
        village: "V",
        district: "D",
        state: "Maharashtra",
        country: "India",
        daysActive: 42,
        reportCount: 2,
      },
      crop: { crop: "Wheat", area: 5, areaUnit: "acres" },
      weather: { summary: null, trends: [], distribution: [] },
      recentRecommendations: [],
      rangeDays: 30,
    };

    const dto = analyticsSchema.toDashboardDto(data, {
      cached: false,
      computedAt: new Date("2026-08-01T00:00:00.000Z"),
    });

    assert.equal(dto.farm.farmId, data.farm.farmId);
    assert.equal(dto.farm.location.district, "D");
    assert.equal(dto.rangeDays, 30);
    assert.equal(dto.cached, false);
    assert.equal(dto.computedAt, "2026-08-01T00:00:00.000Z");
  });
});
