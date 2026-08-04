import { param, query, body } from "express-validator";
import { REPORT_TYPES, REPORT_FILE_TYPES } from "../../db/schema/reports.schema.js";

// express-validator chains for each reports endpoint - same naming
// convention as modules/ai/ai.validator.js and modules/satellite's
// (.validator.js, not .validation.js), since this module also uses
// .schema.js for response DTOs the same way ai/satellite do.

export const idParamValidation = [param("id").isUUID().withMessage("Invalid report id")];

// POST /api/v1/reports/generate
export const generateReportValidation = [
  body("farmId").isUUID().withMessage("farmId is required and must be a valid UUID"),
  body("reportType")
    .isIn(REPORT_TYPES)
    .withMessage(`reportType must be one of ${REPORT_TYPES.join(", ")}`),
  body("fileType")
    .isIn(REPORT_FILE_TYPES)
    .withMessage(`fileType must be one of ${REPORT_FILE_TYPES.join(", ")}`),
  // When true, bypasses the "identical report already exists" dedup check
  // and always generates a fresh file - see reports.service.js.
  body("forceRegenerate")
    .optional()
    .isBoolean()
    .withMessage("forceRegenerate must be a boolean")
    .toBoolean(),
];

// GET /api/v1/reports?farmId=&reportType=&limit=&offset=
export const listReportsValidation = [
  query("farmId").optional().isUUID().withMessage("farmId must be a valid UUID"),
  query("reportType")
    .optional()
    .isIn(REPORT_TYPES)
    .withMessage(`reportType must be one of ${REPORT_TYPES.join(", ")}`),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be an integer between 1 and 100")
    .toInt(),
  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("offset must be a non-negative integer")
    .toInt(),
];
