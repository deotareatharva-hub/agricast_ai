import { body, param, query } from "express-validator";

// express-validator chains for each farm endpoint. Kept separate from the
// route file so validation rules are easy to find, test, and reuse - same
// convention as modules/auth/auth.validation.js.

const AREA_UNITS = ["acres", "hectares"];

const farmNameRule = (optional) => {
  const rule = body("farmName");
  if (optional) rule.optional();
  return rule
    .trim()
    .notEmpty()
    .withMessage("Farm name is required")
    .bail()
    .isLength({ min: 3, max: 100 })
    .withMessage("Farm name must be between 3 and 100 characters");
};

const cropRule = (optional) => {
  const rule = body("crop");
  if (optional) rule.optional();
  return rule
    .trim()
    .notEmpty()
    .withMessage("Crop is required")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Crop must be at most 100 characters");
};

const areaRule = (optional) => {
  const rule = body("area");
  if (optional) rule.optional();
  return rule
    .notEmpty()
    .withMessage("Area is required")
    .bail()
    .isFloat({ gt: 0 })
    .withMessage("Area must be a positive number")
    .toFloat();
};

const areaUnitRule = () =>
  body("areaUnit")
    .optional()
    .trim()
    .isIn(AREA_UNITS)
    .withMessage(`Area unit must be one of: ${AREA_UNITS.join(", ")}`);

const latitudeRule = (optional) => {
  const rule = body("latitude");
  if (optional) rule.optional();
  return rule
    .notEmpty()
    .withMessage("Latitude is required")
    .bail()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90")
    .toFloat();
};

const longitudeRule = (optional) => {
  const rule = body("longitude");
  if (optional) rule.optional();
  return rule
    .notEmpty()
    .withMessage("Longitude is required")
    .bail()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180")
    .toFloat();
};

const locationTextRule = (field, label, optional) => {
  const rule = body(field);
  if (optional) rule.optional();
  return rule
    .trim()
    .notEmpty()
    .withMessage(`${label} is required`)
    .bail()
    .isLength({ max: 150 })
    .withMessage(`${label} must be at most 150 characters`);
};

export const createFarmValidation = [
  farmNameRule(false),
  cropRule(false),
  areaRule(false),
  areaUnitRule(),
  latitudeRule(false),
  longitudeRule(false),
  locationTextRule("village", "Village", false),
  locationTextRule("district", "District", false),
  locationTextRule("state", "State", false),
  locationTextRule("country", "Country", false),
];

export const updateFarmValidation = [
  farmNameRule(true),
  cropRule(true),
  areaRule(true),
  areaUnitRule(),
  latitudeRule(true),
  longitudeRule(true),
  locationTextRule("village", "Village", true),
  locationTextRule("district", "District", true),
  locationTextRule("state", "State", true),
  locationTextRule("country", "Country", true),
];

export const idParamValidation = [
  param("id").isUUID().withMessage("Invalid farm id"),
];

export const listQueryValidation = [
  query("search").optional().trim().isLength({ max: 100 }),
  query("crop").optional().trim().isLength({ max: 100 }),
];
