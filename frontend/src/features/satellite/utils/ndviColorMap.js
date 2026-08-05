// NDVI colour mapping utilities for the satellite visualisation layer.
// Mirrors the backend imageProcessor.js colour ramp so the frontend
// legend always matches the actual image colours.

/** Vegetation classes with display properties. */
export const NDVI_CLASSES = [
  {
    level: "water",
    label: "Water Body",
    labelKey: "satellite.legend.water",
    range: [-1, 0],
    color: "#1E64C8",       // blue
    bgClass: "bg-blue-500",
    textClass: "text-blue-700",
  },
  {
    level: "bare",
    label: "Bare Soil / Urban",
    labelKey: "satellite.legend.bare",
    range: [0, 0.2],
    color: "#8C8C82",       // grey
    bgClass: "bg-neutral-400",
    textClass: "text-neutral-600",
  },
  {
    level: "sparse",
    label: "Sparse Vegetation",
    labelKey: "satellite.legend.sparse",
    range: [0.2, 0.4],
    color: "#B4DC50",       // yellow-green
    bgClass: "bg-lime-400",
    textClass: "text-lime-700",
  },
  {
    level: "moderate",
    label: "Moderate Vegetation",
    labelKey: "satellite.legend.moderate",
    range: [0.4, 0.6],
    color: "#64BE32",       // medium green
    bgClass: "bg-green-500",
    textClass: "text-green-700",
  },
  {
    level: "healthy",
    label: "Healthy Vegetation",
    labelKey: "satellite.legend.healthy",
    range: [0.6, 0.8],
    color: "#329628",       // dark green
    bgClass: "bg-green-700",
    textClass: "text-green-800",
  },
  {
    level: "lush",
    label: "Dense / Lush Vegetation",
    labelKey: "satellite.legend.lush",
    range: [0.8, 1],
    color: "#14640A",       // very dark green
    bgClass: "bg-green-900",
    textClass: "text-green-900",
  },
];

/**
 * Return the NDVI class object for a given NDVI value.
 * @param {number|null} ndvi
 * @returns {typeof NDVI_CLASSES[0] | null}
 */
export function getNdviClass(ndvi) {
  if (ndvi == null) return null;
  return (
    NDVI_CLASSES.find(
      (c) => ndvi >= c.range[0] && ndvi < c.range[1]
    ) ?? NDVI_CLASSES[NDVI_CLASSES.length - 1]
  );
}

/**
 * Return a hex colour string for an NDVI value.
 * @param {number|null} ndvi
 * @returns {string}
 */
export function ndviToColor(ndvi) {
  const cls = getNdviClass(ndvi);
  return cls?.color ?? "#8C8C82";
}

/**
 * Return the health score grade colour for display.
 * @param {'A'|'B'|'C'|'D'|'F'|string} grade
 * @returns {string} Tailwind text class
 */
export function gradeToColorClass(grade) {
  switch (grade) {
    case "A": return "text-green-600";
    case "B": return "text-lime-600";
    case "C": return "text-yellow-600";
    case "D": return "text-orange-600";
    case "F": return "text-red-600";
    default:  return "text-neutral-500";
  }
}

/**
 * Return the health score grade background colour.
 * @param {'A'|'B'|'C'|'D'|'F'|string} grade
 * @returns {string} Tailwind bg + text class pair
 */
export function gradeToBackground(grade) {
  switch (grade) {
    case "A": return "bg-green-50 text-green-700 border-green-200";
    case "B": return "bg-lime-50 text-lime-700 border-lime-200";
    case "C": return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "D": return "bg-orange-50 text-orange-700 border-orange-200";
    case "F": return "bg-red-50 text-red-700 border-red-200";
    default:  return "bg-neutral-50 text-neutral-600 border-neutral-200";
  }
}

/**
 * Return cloud cover severity class.
 * @param {number|null} cloudCoverPercent
 */
export function cloudCoverToClass(cloudCoverPercent) {
  if (cloudCoverPercent == null) return "text-neutral-400";
  if (cloudCoverPercent < 20)   return "text-green-600";
  if (cloudCoverPercent < 50)   return "text-yellow-600";
  return "text-red-500";
}
