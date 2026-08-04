import { param, query } from "express-validator";

// express-validator chains for each analytics endpoint - same naming
// convention as modules/reports/reports.validator.js and
// modules/ai/ai.validator.js.

export const GRANULARITIES = ["day", "week", "month"];

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const WEEK_PATTERN = /^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/;

export const farmIdParamValidation = [
  param("farmId").isUUID().withMessage("farmId must be a valid UUID"),
];

// GET /api/v1/analytics/dashboard/:farmId
export const dashboardValidation = [...farmIdParamValidation];

// GET /api/v1/analytics/weather/:farmId?startDate=&endDate=&granularity=
export const weatherAnalyticsValidation = [
  ...farmIdParamValidation,
  query("startDate").optional().isISO8601().withMessage("startDate must be a valid ISO 8601 date"),
  query("endDate").optional().isISO8601().withMessage("endDate must be a valid ISO 8601 date"),
  query("granularity")
    .optional()
    .isIn(GRANULARITIES)
    .withMessage(`granularity must be one of ${GRANULARITIES.join(", ")}`),
];

// GET /api/v1/analytics/recommendations/:farmId?startDate=&endDate=&granularity=&limit=&offset=
export const recommendationAnalyticsValidation = [
  ...farmIdParamValidation,
  query("startDate").optional().isISO8601().withMessage("startDate must be a valid ISO 8601 date"),
  query("endDate").optional().isISO8601().withMessage("endDate must be a valid ISO 8601 date"),
  query("granularity")
    .optional()
    .isIn(GRANULARITIES)
    .withMessage(`granularity must be one of ${GRANULARITIES.join(", ")}`),
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

// GET /api/v1/analytics/monthly/:farmId?month=YYYY-MM
export const monthlyValidation = [
  ...farmIdParamValidation,
  query("month")
    .optional()
    .matches(MONTH_PATTERN)
    .withMessage("month must be in YYYY-MM format"),
];

// GET /api/v1/analytics/weekly/:farmId?week=YYYY-Www
export const weeklyValidation = [
  ...farmIdParamValidation,
  query("week")
    .optional()
    .matches(WEEK_PATTERN)
    .withMessage("week must be in YYYY-Www (ISO week) format"),
];

// GET /api/v1/analytics/summary/:farmId?date=YYYY-MM-DD
export const summaryValidation = [
  ...farmIdParamValidation,
  query("date").optional().isISO8601().withMessage("date must be a valid ISO 8601 date"),
];
