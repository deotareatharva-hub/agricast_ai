// Formatting helpers for satellite data display.
// Pure functions, no side-effects, easy to unit-test.

/**
 * Format a capture datetime string for display.
 * @param {string|null} capturedAt - ISO 8601 string
 * @returns {string}
 */
export function formatCaptureDate(capturedAt) {
  if (!capturedAt) return "—";
  try {
    return new Date(capturedAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return capturedAt;
  }
}

/**
 * Format a capture datetime with time portion.
 * @param {string|null} capturedAt
 * @returns {string}
 */
export function formatCaptureDateTime(capturedAt) {
  if (!capturedAt) return "—";
  try {
    return new Date(capturedAt).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return capturedAt;
  }
}

/**
 * Format cloud cover percentage for display.
 * @param {number|null} cloudCoverPercent
 * @returns {string}
 */
export function formatCloudCover(cloudCoverPercent) {
  if (cloudCoverPercent == null) return "—";
  return `${Math.round(cloudCoverPercent)}%`;
}

/**
 * Format image size in bytes to a human-readable string.
 * @param {number|null} bytes
 * @returns {string}
 */
export function formatImageSize(bytes) {
  if (bytes == null || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Format an NDVI value for display (3 decimal places, or "—").
 * @param {number|null} ndvi
 * @returns {string}
 */
export function formatNdvi(ndvi) {
  if (ndvi == null) return "—";
  return ndvi.toFixed(3);
}

/**
 * Format a health score (0-100 integer) for display.
 * @param {number|null} score
 * @returns {string}
 */
export function formatHealthScore(score) {
  if (score == null) return "—";
  return `${score}/100`;
}

/**
 * Return a relative time label for a timelapse frame.
 * @param {'week'|'month'|'season'|string} period
 * @returns {string}
 */
export function formatTimelapseLabel(period) {
  switch (period) {
    case "week":   return "Last 7 days";
    case "month":  return "Last 30 days";
    case "season": return "Last 90 days";
    default:       return period;
  }
}

/**
 * Build a data-URI from a base64 image string and MIME type.
 * @param {string|null} base64
 * @param {string} mimeType
 * @returns {string|null}
 */
export function buildImageSrc(base64, mimeType = "image/png") {
  if (!base64) return null;
  if (base64.startsWith("data:")) return base64;
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Return "X days ago" from an ISO date string.
 * @param {string|null} isoDate
 * @returns {string}
 */
export function daysAgo(isoDate) {
  if (!isoDate) return "—";
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}
