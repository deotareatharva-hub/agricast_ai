/**
 * imageProcessor.js
 *
 * Reusable utilities for satellite image data:
 *   - Base64 encoding / decoding
 *   - MIME type detection
 *   - Image size validation
 *   - Color-map application (for index layers)
 *   - Normalization helpers
 *
 * Nothing in this file talks to the database, Sentinel Hub, or Express.
 * Pure functions only - easy to unit-test in isolation.
 */

// ---------------------------------------------------------------------------
// Base64 helpers
// ---------------------------------------------------------------------------

/**
 * Convert a raw image Buffer to a data-URI string suitable for <img src>.
 * @param {Buffer} buffer
 * @param {string} mimeType - e.g. "image/png"
 * @returns {string}
 */
export function bufferToDataUri(buffer, mimeType) {
  const b64 = Buffer.isBuffer(buffer)
    ? buffer.toString("base64")
    : Buffer.from(buffer).toString("base64");
  return `data:${mimeType};base64,${b64}`;
}

/**
 * Encode a Buffer to a plain base64 string (no data-URI prefix).
 * @param {Buffer} buffer
 * @returns {string}
 */
export function bufferToBase64(buffer) {
  return Buffer.isBuffer(buffer)
    ? buffer.toString("base64")
    : Buffer.from(buffer).toString("base64");
}

/**
 * Decode a base64 string back into a Buffer.
 * @param {string} base64
 * @returns {Buffer}
 */
export function base64ToBuffer(base64) {
  return Buffer.from(base64, "base64");
}

// ---------------------------------------------------------------------------
// MIME / format helpers
// ---------------------------------------------------------------------------

const MIME_EXTENSIONS = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/tiff": "tif",
  "image/geotiff": "tif",
};

/**
 * Return the file extension for a given MIME type.
 * @param {string} mimeType
 * @returns {string}
 */
export function mimeToExtension(mimeType) {
  return MIME_EXTENSIONS[mimeType] ?? "bin";
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/** Maximum allowed image size in bytes (20 MB). */
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

/**
 * Throw a descriptive error when the image buffer is too large to cache safely.
 * @param {Buffer} buffer
 * @param {number} [limit=MAX_IMAGE_BYTES]
 */
export function assertImageSize(buffer, limit = MAX_IMAGE_BYTES) {
  const bytes = Buffer.isBuffer(buffer) ? buffer.length : Buffer.from(buffer).length;
  if (bytes > limit) {
    throw new Error(
      `Image size (${bytes} bytes) exceeds the ${limit}-byte limit. ` +
        "Reduce the requested resolution or clip the bounding box."
    );
  }
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

/**
 * Clamp a floating-point value to the [-1, 1] range used by spectral indices.
 * @param {number} value
 * @returns {number}
 */
export function clampIndex(value) {
  return Math.max(-1, Math.min(1, value));
}

/**
 * Map a spectral index value in [-1, 1] to the [0, 255] byte range.
 * Useful when building color-mapped images from raw index data.
 * @param {number} indexValue - Value in [-1, 1]
 * @returns {number} Integer in [0, 255]
 */
export function indexToByte(indexValue) {
  return Math.round(((clampIndex(indexValue) + 1) / 2) * 255);
}

// ---------------------------------------------------------------------------
// NDVI color mapping
// ---------------------------------------------------------------------------

/**
 * Return an RGB triplet for an NDVI value using the standard agricultural
 * color ramp:
 *   < 0      → blue  (water / bare soil)
 *   0–0.2    → grey  (urban / bare soil)
 *   0.2–0.4  → yellow (sparse vegetation)
 *   0.4–0.6  → light green (moderate vegetation)
 *   0.6–1.0  → dark green (dense/healthy vegetation)
 *
 * @param {number} ndvi - Value in [-1, 1]
 * @returns {{ r: number, g: number, b: number }}
 */
export function ndviToRgb(ndvi) {
  if (ndvi < 0) return { r: 30, g: 100, b: 200 };        // water
  if (ndvi < 0.1) return { r: 140, g: 140, b: 130 };     // bare soil / urban
  if (ndvi < 0.2) return { r: 210, g: 200, b: 120 };     // sparse dry
  if (ndvi < 0.4) return { r: 180, g: 220, b: 80 };      // sparse green
  if (ndvi < 0.6) return { r: 100, g: 190, b: 50 };      // moderate vegetation
  if (ndvi < 0.8) return { r: 50, g: 150, b: 30 };       // healthy vegetation
  return { r: 20, g: 100, b: 10 };                       // very dense / lush
}

/**
 * Categorize an NDVI value into a human-readable vegetation class.
 * @param {number|null} ndvi
 * @returns {{ label: string, level: 'water'|'bare'|'sparse'|'moderate'|'healthy'|'lush'|'unknown' }}
 */
export function classifyNdvi(ndvi) {
  if (ndvi == null) return { label: "Unknown", level: "unknown" };
  if (ndvi < 0)    return { label: "Water / No Vegetation", level: "water" };
  if (ndvi < 0.2)  return { label: "Bare Soil / Urban", level: "bare" };
  if (ndvi < 0.4)  return { label: "Sparse Vegetation", level: "sparse" };
  if (ndvi < 0.6)  return { label: "Moderate Vegetation", level: "moderate" };
  if (ndvi < 0.8)  return { label: "Healthy Vegetation", level: "healthy" };
  return { label: "Dense / Lush Vegetation", level: "lush" };
}
