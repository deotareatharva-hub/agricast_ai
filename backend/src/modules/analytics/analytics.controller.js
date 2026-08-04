import { validationResult } from "express-validator";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { analyticsService } from "./analytics.service.js";
import { analyticsSchema } from "./analytics.schema.js";

// Thin layer: validate input shape, call the service, shape the response
// via analytics.schema.js DTOs. No business logic and no direct DB access
// should ever live here - same convention as modules/reports/reports.controller.js
// and modules/ai/ai.controller.js.

function assertValid(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    throw ApiError.badRequest("Validation failed", result.array());
  }
}

export const analyticsController = {
  // GET /api/v1/analytics/dashboard/:farmId
  dashboard: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId } = req.params;
    const { data, meta } = await analyticsService.getDashboard(req.user.id, farmId);
    const dto = analyticsSchema.toDashboardDto(data, meta);
    return new ApiResponse(200, dto, "Dashboard analytics fetched successfully").send(res);
  }),

  // GET /api/v1/analytics/weather/:farmId?startDate=&endDate=&granularity=
  weather: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId } = req.params;
    const { startDate, endDate, granularity } = req.query;
    const { data, meta } = await analyticsService.getWeatherAnalytics(req.user.id, farmId, {
      startDate,
      endDate,
      granularity,
    });
    const dto = analyticsSchema.toWeatherAnalyticsDto(data, meta);
    return new ApiResponse(200, dto, "Weather analytics fetched successfully").send(res);
  }),

  // GET /api/v1/analytics/recommendations/:farmId?startDate=&endDate=&granularity=&limit=&offset=
  recommendations: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId } = req.params;
    const { startDate, endDate, granularity, limit, offset } = req.query;
    const { data, meta } = await analyticsService.getRecommendationAnalytics(
      req.user.id,
      farmId,
      { startDate, endDate, granularity, limit, offset }
    );
    const dto = analyticsSchema.toRecommendationAnalyticsDto(data, meta);
    return new ApiResponse(200, dto, "Recommendation analytics fetched successfully").send(res);
  }),

  // GET /api/v1/analytics/monthly/:farmId?month=YYYY-MM
  monthly: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId } = req.params;
    const { month } = req.query;
    const { data, meta } = await analyticsService.getMonthlySummary(req.user.id, farmId, {
      month,
    });
    const dto = analyticsSchema.toMonthlySummaryDto(data, meta);
    return new ApiResponse(200, dto, "Monthly summary fetched successfully").send(res);
  }),

  // GET /api/v1/analytics/weekly/:farmId?week=YYYY-Www
  weekly: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId } = req.params;
    const { week } = req.query;
    const { data, meta } = await analyticsService.getWeeklySummary(req.user.id, farmId, {
      week,
    });
    const dto = analyticsSchema.toWeeklySummaryDto(data, meta);
    return new ApiResponse(200, dto, "Weekly summary fetched successfully").send(res);
  }),

  // GET /api/v1/analytics/summary/:farmId?date=YYYY-MM-DD
  summary: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId } = req.params;
    const { date } = req.query;
    const { data, meta } = await analyticsService.getSummary(req.user.id, farmId, { date });
    const dto = analyticsSchema.toDailySummaryDto(data, meta);
    return new ApiResponse(200, dto, "Daily summary fetched successfully").send(res);
  }),
};
