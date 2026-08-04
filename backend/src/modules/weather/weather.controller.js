import { validationResult } from "express-validator";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { weatherService } from "./weather.service.js";
import { weatherSchema } from "./weather.schema.js";

// Thin layer: validate input shape, call the service, shape the response
// via weather.schema.js DTOs. No business logic and no direct DB or
// Open-Meteo access should ever live here - same convention as
// modules/farms/farm.controller.js.

function assertValid(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    throw ApiError.badRequest("Validation failed", result.array());
  }
}

export const weatherController = {
  getCurrent: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId } = req.params;
    const { data, meta } = await weatherService.getCurrent(req.user.id, farmId);
    const dto = weatherSchema.toCurrentDto(data, meta);
    return new ApiResponse(200, dto, "Current weather fetched successfully").send(res);
  }),

  getHourly: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId } = req.params;
    const { data, meta } = await weatherService.getHourly(req.user.id, farmId);
    const dto = weatherSchema.toHourlyDto(data, meta);
    return new ApiResponse(200, dto, "Hourly forecast fetched successfully").send(res);
  }),

  getDaily: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId } = req.params;
    const { data, meta } = await weatherService.getDaily(req.user.id, farmId);
    const dto = weatherSchema.toDailyDto(data, meta);
    return new ApiResponse(200, dto, "7-day forecast fetched successfully").send(res);
  }),

  getHistory: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId } = req.params;
    const { startDate, endDate } = req.query;
    const { data, meta } = await weatherService.getHistory(req.user.id, farmId, {
      startDate,
      endDate,
    });
    const dto = weatherSchema.toHistoryDto(data, meta);
    return new ApiResponse(200, dto, "Weather history fetched successfully").send(res);
  }),
};
