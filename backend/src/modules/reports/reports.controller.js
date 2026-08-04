import { validationResult } from "express-validator";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { reportsService } from "./reports.service.js";
import { reportsSchema } from "./reports.schema.js";

// Thin layer: validate input shape, call the service, shape the response
// via reports.schema.js DTOs. No business logic and no direct DB or
// filesystem access should ever live here - same convention as
// modules/ai/ai.controller.js and modules/weather/weather.controller.js.

function assertValid(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    throw ApiError.badRequest("Validation failed", result.array());
  }
}

const CONTENT_TYPES = {
  pdf: "application/pdf",
  csv: "text/csv",
  json: "application/json",
};

export const reportsController = {
  // POST /api/v1/reports/generate
  generate: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId, reportType, fileType, forceRegenerate } = req.body;
    const { data, reused } = await reportsService.generate(req.user.id, {
      farmId,
      reportType,
      fileType,
      forceRegenerate,
    });
    const dto = reportsSchema.toReportDto(data);
    const message = reused
      ? "An identical report already exists; returning the existing file."
      : "Report generated successfully";
    return new ApiResponse(201, dto, message).send(res);
  }),

  // GET /api/v1/reports?farmId=&reportType=&limit=&offset=
  list: asyncHandler(async (req, res) => {
    assertValid(req);
    const { farmId, reportType, limit, offset } = req.query;
    const { data, meta } = await reportsService.list(req.user.id, {
      farmId,
      reportType,
      limit,
      offset,
    });
    const dto = reportsSchema.toListDto(data, meta);
    return new ApiResponse(200, dto, "Reports fetched successfully").send(res);
  }),

  // GET /api/v1/reports/:id
  getById: asyncHandler(async (req, res) => {
    assertValid(req);
    const { id } = req.params;
    const { data } = await reportsService.getById(req.user.id, id);
    const dto = reportsSchema.toReportDetailDto(data);
    return new ApiResponse(200, dto, "Report fetched successfully").send(res);
  }),

  // GET /api/v1/reports/:id/download
  // Not in the original four-endpoint list, but required to make
  // `downloadUrl` in reports.schema.js resolve to something real - static-
  // serving the storage directory directly would bypass per-user
  // ownership checks (see SECURITY: "Ownership validation"), so the file
  // is streamed through an authenticated, ownership-checked route instead.
  download: asyncHandler(async (req, res) => {
    assertValid(req);
    const { id } = req.params;
    const { absolutePath, fileType, reportType, reportId } = await reportsService.getDownloadTarget(
      req.user.id,
      id
    );
    const filename = `agricast-${reportType}-report-${reportId}.${fileType}`;
    res.setHeader("Content-Type", CONTENT_TYPES[fileType] || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.sendFile(absolutePath);
  }),

  // DELETE /api/v1/reports/:id
  delete: asyncHandler(async (req, res) => {
    assertValid(req);
    const { id } = req.params;
    const data = await reportsService.delete(req.user.id, id);
    return new ApiResponse(200, data, "Report deleted successfully").send(res);
  }),
};
