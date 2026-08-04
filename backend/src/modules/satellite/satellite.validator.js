import { param, query } from "express-validator";
import { SUPPORTED_LAYERS } from "../../integrations/satellite/sentinel.js";

// express-validator chains for each satellite endpoint - same convention
// as modules/weather/weather.validation.js. Named `.validator.js` per this
// task's spec (weather uses `.validation.js` - both are the same idea,
// kept as each module's own file already named it).

export const farmIdParamValidation = [
  param("farmId").isUUID().withMessage("Invalid farm id"),
];

// `layer` is optional here - the controller defaults it to TRUE_COLOR when
// absent - but if supplied it must be one of the layers sentinel.js
// actually implements.
export const layerQueryValidation = [
  query("layer")
    .optional()
    .trim()
    .toUpperCase()
    .isIn(SUPPORTED_LAYERS)
    .withMessage(`layer must be one of: ${SUPPORTED_LAYERS.join(", ")}`),
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("startDate must be a valid date (YYYY-MM-DD)"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("endDate must be a valid date (YYYY-MM-DD)"),
];

export const imageQueryValidation = [...farmIdParamValidation, ...layerQueryValidation];
export const metadataQueryValidation = [...farmIdParamValidation, ...layerQueryValidation];
