import axios from "axios";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { tokenManager } from "./tokenManager.js";

// Thin client around the Sentinel Hub Process API (imagery) and Catalog API
// (scene metadata). This is the ONLY file in the codebase that knows
// Sentinel Hub's request/response shape, evalscripts included - the rest
// of the app (service, controller, frontend) only ever sees the normalized
// DTOs produced by sentinelMapper.js. Nothing outside this integrations/
// folder should import axios directly for satellite data, and nothing
// outside this file + tokenManager.js should ever see a Sentinel Hub
// credential or bearer token.

const REQUEST_TIMEOUT_MS = env.satellite.sentinel.timeoutMs;
const MAX_RETRIES = env.satellite.sentinel.maxRetries;
const RETRY_DELAY_MS = env.satellite.sentinel.retryDelayMs;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retries only on transient failures: network errors, timeouts, and 5xx
// responses - same convention as integrations/weather/openMeteo.js. A 401
// is handled separately (token refresh, see callSentinel below) and a
// non-401 4xx (bad bbox, malformed evalscript) is a caller bug, not a
// transient condition, so it fails fast instead of retrying.
function isTransientError(error) {
  if (error.code === "ECONNABORTED") return true; // axios timeout
  if (!error.response) return true; // network-level failure, DNS, etc.
  if (error.response.status === 401) return false;
  return error.response.status >= 500;
}

async function requestWithRetry(requestFn, attempt = 0) {
  try {
    return await requestFn();
  } catch (error) {
    const canRetry = attempt < MAX_RETRIES && isTransientError(error);

    logger.warn("Sentinel Hub request failed", {
      attempt,
      willRetry: canRetry,
      status: error.response?.status,
      message: error.message,
    });

    if (!canRetry) {
      throw error;
    }

    await sleep(RETRY_DELAY_MS * (attempt + 1)); // simple linear backoff
    return requestWithRetry(requestFn, attempt + 1);
  }
}

// Wraps a Sentinel Hub call with token acquisition + a single automatic
// retry-with-fresh-token if Sentinel Hub itself rejects the current token
// (401) - separate from requestWithRetry's transient-failure retries.
async function callSentinel(buildRequest) {
  const token = await tokenManager.getToken();
  try {
    return await requestWithRetry(() => buildRequest(token));
  } catch (error) {
    if (error.response?.status === 401) {
      logger.warn("Sentinel Hub rejected the current token, refreshing and retrying once");
      tokenManager.invalidate();
      const freshToken = await tokenManager.getToken();
      return requestWithRetry(() => buildRequest(freshToken));
    }
    throw error;
  }
}

// Evalscripts per supported layer. Sentinel-2 L2A band math only - kept
// here since it's Sentinel-specific implementation detail, not something
// the rest of the app should know about. NDVI/MOISTURE_INDEX/EVI are
// single-band FLOAT32 outputs (raw index values); TRUE_COLOR/FALSE_COLOR
// are 3-band visual composites.
const EVALSCRIPTS = {
  TRUE_COLOR: `//VERSION=3
function setup() {
  return { input: ["B04", "B03", "B02"], output: { bands: 3 } };
}
function evaluatePixel(s) {
  return [s.B04 * 2.5, s.B03 * 2.5, s.B02 * 2.5];
}`,

  FALSE_COLOR: `//VERSION=3
function setup() {
  return { input: ["B08", "B04", "B03"], output: { bands: 3 } };
}
function evaluatePixel(s) {
  return [s.B08 * 2.5, s.B04 * 2.5, s.B03 * 2.5];
}`,

  // Normalized Difference Vegetation Index - vegetation health/density.
  NDVI: `//VERSION=3
function setup() {
  return { input: ["B08", "B04"], output: { bands: 1, sampleType: "FLOAT32" } };
}
function evaluatePixel(s) {
  return [(s.B08 - s.B04) / (s.B08 + s.B04)];
}`,

  // Normalized Difference Moisture Index - canopy/soil moisture proxy.
  MOISTURE_INDEX: `//VERSION=3
function setup() {
  return { input: ["B8A", "B11"], output: { bands: 1, sampleType: "FLOAT32" } };
}
function evaluatePixel(s) {
  return [(s.B8A - s.B11) / (s.B8A + s.B11)];
}`,

  // Enhanced Vegetation Index - like NDVI but corrects for canopy/soil
  // background and atmospheric effects, more sensitive in dense canopy.
  EVI: `//VERSION=3
function setup() {
  return { input: ["B08", "B04", "B02"], output: { bands: 1, sampleType: "FLOAT32" } };
}
function evaluatePixel(s) {
  return [2.5 * (s.B08 - s.B04) / (s.B08 + 6 * s.B04 - 7.5 * s.B02 + 1)];
}`,
};

export const SUPPORTED_LAYERS = Object.keys(EVALSCRIPTS);

export const sentinelClient = {
  // POST /process - returns raw image bytes for the given bbox/date
  // range/layer. bbox is [minLng, minLat, maxLng, maxLat]; dateRange is
  // { from, to } as YYYY-MM-DD strings.
  fetchImage: async ({ bbox, dateRange, layer, width, height }) => {
    const evalscript = EVALSCRIPTS[layer];

    const requestBody = {
      input: {
        bounds: { bbox },
        data: [
          {
            type: "sentinel-2-l2a",
            dataFilter: {
              timeRange: {
                from: `${dateRange.from}T00:00:00Z`,
                to: `${dateRange.to}T23:59:59Z`,
              },
              maxCloudCoverage: 40,
            },
          },
        ],
      },
      output: {
        width,
        height,
        responses: [{ identifier: "default", format: { type: "image/png" } }],
      },
      evalscript,
    };

    const response = await callSentinel((token) =>
      axios.post(env.satellite.sentinel.processUrl, requestBody, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        timeout: REQUEST_TIMEOUT_MS,
        responseType: "arraybuffer",
      })
    );

    return {
      imageBuffer: response.data,
      contentType: response.headers["content-type"] || "image/png",
    };
  },

  // POST catalog search - scene metadata only (capture dates, cloud
  // cover) for a bbox/date range, no image rendering involved.
  fetchMetadata: async ({ bbox, dateRange }) => {
    const requestBody = {
      collections: ["sentinel-2-l2a"],
      bbox,
      datetime: `${dateRange.from}T00:00:00Z/${dateRange.to}T23:59:59Z`,
      limit: 20,
    };

    const response = await callSentinel((token) =>
      axios.post(env.satellite.sentinel.catalogUrl, requestBody, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        timeout: REQUEST_TIMEOUT_MS,
      })
    );

    return response.data;
  },
};
