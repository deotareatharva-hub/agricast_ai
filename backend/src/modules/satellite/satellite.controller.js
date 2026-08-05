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
  // -------------------------------------------------------------------------
  // Discovery
  // -------------------------------------------------------------------------

  getLayers: asyncHandler(async (req, res) => {
    const { data } = satelliteService.getLayers();
    return new ApiResponse(200, satelliteSchema.toLayersDto(data), "Supported satellite layers fetched successfully").send(res);
  }),

  // -------------------------------------------------------------------------
  // Current / snapshot
  // -------------------------------------------------------------------------

  /**
   * GET /current/:farmId
   * Combined response: TRUE_COLOR image + scene metadata + health metrics.
   * This is the primary endpoint consumed by the SatellitePage dashboard.
   */
  getCurrent: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId } = req.params;
    const layer = (req.query.layer || DEFAULT_LAYER).toUpperCase();
    const { startDate, endDate } = req.query;

    const result = await satelliteService.getCurrent(req.user.id, farmId, {
      layer,
      startDate,
      endDate,
    });

    const dto = satelliteSchema.toCurrentDto(result);
    return new ApiResponse(200, dto, "Current satellite data fetched successfully").send(res);
  }),

  /**
   * GET /ndvi/:farmId
   * Shorthand for fetching the NDVI layer image specifically.
   */
  getNdvi: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId } = req.params;
    const { startDate, endDate } = req.query;

    const { data, meta } = await satelliteService.getImage(req.user.id, farmId, {
      layer: "NDVI",
      startDate,
      endDate,
    });

    const dto = satelliteSchema.toImageDto(data, meta);
    return new ApiResponse(200, dto, "NDVI imagery fetched successfully").send(res);
  }),

  /**
   * GET /health/:farmId
   * Returns computed vegetation health score and crop assessment (no image).
   */
  getHealth: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId } = req.params;
    const { startDate, endDate } = req.query;

    const result = await satelliteService.getHealthMetrics(req.user.id, farmId, {
      startDate,
      endDate,
    });

    const dto = satelliteSchema.toHealthDto(result);
    return new ApiResponse(200, dto, "Vegetation health metrics fetched successfully").send(res);
  }),

  // -------------------------------------------------------------------------
  // Historical / timeline
  // -------------------------------------------------------------------------

  /**
   * GET /history/:farmId
   * Returns a list of scenes (dates, cloud cover) for the requested date range.
   */
  getHistory: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId } = req.params;
    const layer = (req.query.layer || DEFAULT_LAYER).toUpperCase();
    const { startDate, endDate } = req.query;

    const { data, meta } = await satelliteService.getMetadata(req.user.id, farmId, {
      layer,
      startDate,
      endDate,
    });

    const dto = satelliteSchema.toHistoryDto(data, meta);
    return new ApiResponse(200, dto, "Satellite history fetched successfully").send(res);
  }),

  /**
   * GET /timelapse/:farmId
   * Returns image frames for multiple preset periods (last week, month, season).
   */
  getTimelapse: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId } = req.params;
    const layer = (req.query.layer || DEFAULT_LAYER).toUpperCase();

    const result = await satelliteService.getTimelapse(req.user.id, farmId, { layer });
    const dto = satelliteSchema.toTimelapseDto(result);
    return new ApiResponse(200, dto, "Timelapse data fetched successfully").send(res);
  }),

  // -------------------------------------------------------------------------
  // Legacy low-level endpoints (kept for backward compatibility)
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  /**
   * POST /refresh/:farmId
   * Clears all cached satellite data for a farm and triggers a fresh fetch
   * of the current TRUE_COLOR image.
   */
  refreshCache: asyncHandler(async (req, res) => {
    const { farmId } = req.params;

    const result = await satelliteService.refreshFarm(req.user.id, farmId);
    const dto = satelliteSchema.toRefreshDto(result);
    return new ApiResponse(200, dto, "Satellite cache refreshed successfully").send(res);
  }),
};
