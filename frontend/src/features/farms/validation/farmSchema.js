// React Hook Form validation rules for the farm create/edit form. Mirrors
// the express-validator rules in backend/src/modules/farms/farm.validation.js
// so client and server stay in sync. Kept as plain RHF rule objects (no
// resolver library like zod/yup is installed in this project) to match the
// existing pattern in pages/RegisterPage.jsx.

export const AREA_UNITS = ["acres", "hectares"];

export function getFarmValidationRules(t) {
  return {
    farmName: {
      required: t("validation.required"),
      minLength: { value: 3, message: t("validation.minLength", { count: 3 }) },
      maxLength: { value: 100, message: t("validation.maxLength", { count: 100 }) },
    },
    crop: {
      required: t("validation.required"),
      maxLength: { value: 100, message: t("validation.maxLength", { count: 100 }) },
    },
    area: {
      required: t("validation.required"),
      valueAsNumber: true,
      validate: (value) =>
        (!Number.isNaN(value) && value > 0) || t("validation.positiveNumber"),
    },
    latitude: {
      required: t("validation.required"),
      valueAsNumber: true,
      min: { value: -90, message: t("validation.latitudeRange") },
      max: { value: 90, message: t("validation.latitudeRange") },
    },
    longitude: {
      required: t("validation.required"),
      valueAsNumber: true,
      min: { value: -180, message: t("validation.longitudeRange") },
      max: { value: 180, message: t("validation.longitudeRange") },
    },
    village: {
      required: t("validation.required"),
      maxLength: { value: 150, message: t("validation.maxLength", { count: 150 }) },
    },
    district: {
      required: t("validation.required"),
      maxLength: { value: 150, message: t("validation.maxLength", { count: 150 }) },
    },
    state: {
      required: t("validation.required"),
      maxLength: { value: 150, message: t("validation.maxLength", { count: 150 }) },
    },
    country: {
      required: t("validation.required"),
      maxLength: { value: 150, message: t("validation.maxLength", { count: 150 }) },
    },
  };
}
