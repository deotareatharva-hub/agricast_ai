import { param, query, body } from "express-validator";
import { RECOMMENDATION_LANGUAGES } from "../../db/schema/recommendations.schema.js";

// express-validator chains for each AI endpoint - named `.validator.js`
// (not `.validation.js`) to match modules/satellite's precedent, since
// this module also uses the `.schema.js` name for response DTOs the same
// way satellite does.

export const farmIdParamValidation = [
  param("farmId").isUUID().withMessage("Invalid farm id"),
];

// POST /api/v1/ai/recommend body: farmId identifies the farm (crop comes
// from the farm record itself, per farms.schema.js - not re-supplied
// here). sensorSnapshot is optional free-form JSON since no sensor module
// exists yet (see ai.service.js); language defaults to English when
// omitted.
export const recommendValidation = [
  body("farmId").isUUID().withMessage("farmId is required and must be a valid UUID"),
  body("language")
    .optional()
    .isIn(RECOMMENDATION_LANGUAGES)
    .withMessage(`language must be one of ${RECOMMENDATION_LANGUAGES.join(", ")}`),
  body("sensorSnapshot")
    .optional()
    .isObject()
    .withMessage("sensorSnapshot must be a JSON object"),
];

// History supports simple pagination - defaults are applied in
// ai.service.js, these rules just guard against nonsensical input.
export const historyQueryValidation = [
  ...farmIdParamValidation,
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
