import { validationResult } from "express-validator";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { aiService } from "./ai.service.js";
import { aiSchema } from "./ai.schema.js";

// Thin layer: validate input shape, call the service, shape the response
// via ai.schema.js DTOs. No business logic and no direct DB or Grok
// access should ever live here - same convention as
// modules/weather/weather.controller.js and
// modules/satellite/satellite.controller.js.

function assertValid(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    throw ApiError.badRequest("Validation failed", result.array());
  }
}

export const aiController = {
  recommend: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId, sensorSnapshot, language } = req.body;
    const { data } = await aiService.recommend(req.user.id, {
      farmId,
      sensorSnapshot,
      language,
    });
    const dto = aiSchema.toRecommendationDto(data);
    return new ApiResponse(201, dto, "AI recommendation generated successfully").send(res);
  }),

  getHistory: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId } = req.params;
    const { limit, offset } = req.query;
    const { data, meta } = await aiService.getHistory(req.user.id, farmId, { limit, offset });
    const dto = aiSchema.toHistoryDto(data, meta);
    return new ApiResponse(200, dto, "Recommendation history fetched successfully").send(res);
  }),

  getLatest: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId } = req.params;
    const { data, meta } = await aiService.getLatest(req.user.id, farmId);
    const dto = aiSchema.toLatestDto(data, meta);
    return new ApiResponse(200, dto, "Latest recommendation fetched successfully").send(res);
  }),
};
