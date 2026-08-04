import { validationResult } from "express-validator";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { satelliteService } from "./satellite.service.js";
import { satelliteSchema } from "./satellite.schema.js";

// Thin layer: validate input shape, call the service, shape the response
// via satellite.schema.js DTOs. No business logic and no direct DB or
// Sentinel Hub access should ever live here - same convention as
// modules/weather/weather.controller.js.

function assertValid(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    throw ApiError.badRequest("Validation failed", result.array());
  }
}

const DEFAULT_LAYER = "TRUE_COLOR";

export const satelliteController = {
  getLayers: asyncHandler(async (req, res) => {
    const { data } = satelliteService.getLayers();
    return new ApiResponse(200, satelliteSchema.toLayersDto(data), "Supported satellite layers fetched successfully").send(res);
  }),

  getImage: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId } = req.params;
    const layer = (req.query.layer || DEFAULT_LAYER).toUpperCase();
    const { startDate, endDate } = req.query;

    const { data, meta } = await satelliteService.getImage(req.user.id, farmId, {
      layer,
      startDate,
      endDate,
    });
    const dto = satelliteSchema.toImageDto(data, meta);
    return new ApiResponse(200, dto, "Satellite imagery fetched successfully").send(res);
  }),

  getMetadata: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId } = req.params;
    const layer = (req.query.layer || DEFAULT_LAYER).toUpperCase();
    const { startDate, endDate } = req.query;

    const { data, meta } = await satelliteService.getMetadata(req.user.id, farmId, {
      layer,
      startDate,
      endDate,
    });
    const dto = satelliteSchema.toMetadataDto(data, meta);
    return new ApiResponse(200, dto, "Satellite metadata fetched successfully").send(res);
  }),
};
