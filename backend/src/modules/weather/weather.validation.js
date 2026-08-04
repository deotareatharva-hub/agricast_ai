import { param, query } from "express-validator";

// express-validator chains for each weather endpoint - same convention as
// modules/farms/farm.validation.js. Named `.validation.js` (not
// `.validator.js`) to match that existing precedent in the codebase.

export const farmIdParamValidation = [
  param("farmId").isUUID().withMessage("Invalid farm id"),
];

// History accepts an optional date range via query params. Both are
// optional independently - the service defaults to "last 7 days" when
// neither is supplied.
export const historyQueryValidation = [
  ...farmIdParamValidation,
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("startDate must be a valid date (YYYY-MM-DD)")
    .toDate(),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("endDate must be a valid date (YYYY-MM-DD)")
    .toDate(),
];
