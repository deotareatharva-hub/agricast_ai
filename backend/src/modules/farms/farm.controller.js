import { validationResult } from "express-validator";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { farmService } from "./farm.service.js";

// Thin layer: validate input shape, call the service, shape the response.
// No business logic and no direct DB access should ever live here - same
// convention as modules/auth/auth.controller.js.

function assertValid(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    throw ApiError.badRequest("Validation failed", result.array());
  }
}

// Only pass through known farm fields, and drop any that weren't present
// on the request so a PUT with a subset of fields doesn't overwrite the
// rest with `undefined`.
function pickFarmPayload(body) {
  const fields = [
    "farmName",
    "crop",
    "area",
    "areaUnit",
    "latitude",
    "longitude",
    "village",
    "district",
    "state",
    "country",
  ];
  const payload = {};
  for (const field of fields) {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  }
  return payload;
}

export const farmController = {
  create: asyncHandler(async (req, res) => {
    assertValid(req);
    const data = await farmService.createFarm(req.user.id, pickFarmPayload(req.body));
    return new ApiResponse(201, data, "Farm created successfully").send(res);
  }),

  list: asyncHandler(async (req, res) => {
    assertValid(req);
    const { search, crop } = req.query;
    const data = await farmService.listFarms(req.user.id, { search, crop });
    return new ApiResponse(200, data, "Farms fetched successfully").send(res);
  }),

  getById: asyncHandler(async (req, res) => {
    assertValid(req);
    const data = await farmService.getFarm(req.user.id, req.params.id);
    return new ApiResponse(200, data, "Farm fetched successfully").send(res);
  }),

  update: asyncHandler(async (req, res) => {
    assertValid(req);
    const data = await farmService.updateFarm(
      req.user.id,
      req.params.id,
      pickFarmPayload(req.body)
    );
    return new ApiResponse(200, data, "Farm updated successfully").send(res);
  }),

  remove: asyncHandler(async (req, res) => {
    assertValid(req);
    const data = await farmService.deleteFarm(req.user.id, req.params.id);
    return new ApiResponse(200, data, "Farm deleted successfully").send(res);
  }),
};
