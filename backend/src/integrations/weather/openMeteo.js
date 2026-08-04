import axios from "axios";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

// Thin client around the Open-Meteo forecast API. This is the ONLY file in
// the codebase that knows Open-Meteo's URL/query-param shape - the rest of
// the app (service, controller, frontend) only ever sees the normalized
// DTOs produced by weatherMapper.js. Nothing outside this integrations/
// folder should import axios directly for weather data.
//
// Open-Meteo requires no API key, but we still keep the base URL and
// timeout configurable via env so it can be swapped/mocked in tests.

// Open-Meteo splits forecast (current/hourly/daily, rolling window) and
// historical (arbitrary past date range) data across two different hosts.
const FORECAST_BASE_URL = env.weather.forecastUrl;
const ARCHIVE_BASE_URL = env.weather.archiveUrl;

const REQUEST_TIMEOUT_MS = Number(process.env.OPEN_METEO_TIMEOUT_MS) || 8000;
const MAX_RETRIES = Number(process.env.OPEN_METEO_MAX_RETRIES) || 2;
const RETRY_DELAY_MS = Number(process.env.OPEN_METEO_RETRY_DELAY_MS) || 500;

const forecastClient = axios.create({ baseURL: FORECAST_BASE_URL, timeout: REQUEST_TIMEOUT_MS });
const archiveClient = axios.create({ baseURL: ARCHIVE_BASE_URL, timeout: REQUEST_TIMEOUT_MS });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retries only on transient failures: network errors, timeouts, and 5xx
// responses. A 4xx (bad lat/lng, malformed params) is a caller bug, not a
// transient condition, so it fails fast instead of retrying.
function isTransientError(error) {
  if (error.code === "ECONNABORTED") return true; // axios timeout
  if (!error.response) return true; // network-level failure, DNS, etc.
  return error.response.status >= 500;
}

async function requestWithRetry(client, params, attempt = 0) {
  try {
    const response = await client.get("", { params });
    return response.data;
  } catch (error) {
    const canRetry = attempt < MAX_RETRIES && isTransientError(error);

    logger.warn("Open-Meteo request failed", {
      attempt,
      willRetry: canRetry,
      status: error.response?.status,
      message: error.message,
    });

    if (!canRetry) {
      throw error;
    }

    await sleep(RETRY_DELAY_MS * (attempt + 1)); // simple linear backoff
    return requestWithRetry(client, params, attempt + 1);
  }
}

const CURRENT_FIELDS = [
  "temperature_2m",
  "relative_humidity_2m",
  "surface_pressure",
  "wind_speed_10m",
  "wind_direction_10m",
  "weather_code",
  "uv_index",
].join(",");

const HOURLY_FIELDS = [
  "temperature_2m",
  "relative_humidity_2m",
  "precipitation_probability",
  "surface_pressure",
  "wind_speed_10m",
  "wind_direction_10m",
  "uv_index",
  "weather_code",
].join(",");

const DAILY_FIELDS = [
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_probability_max",
  "wind_speed_10m_max",
  "wind_direction_10m_dominant",
  "uv_index_max",
  "weather_code",
].join(",");

export const openMeteoClient = {
  // Current conditions + next 24h hourly + 7-day daily in a single call
  // where possible - Open-Meteo allows requesting current, hourly, and
  // daily blocks together, which keeps API usage (and cache churn) low.
  fetchForecast: async (latitude, longitude) => {
    return requestWithRetry(forecastClient, {
      latitude,
      longitude,
      current: CURRENT_FIELDS,
      hourly: HOURLY_FIELDS,
      daily: DAILY_FIELDS,
      forecast_days: 7,
      forecast_hours: 24,
      timezone: "auto",
    });
  },

  // Past weather, used for the /history endpoint when a caller asks for a
  // date range not already covered by our own weather_history table.
  fetchHistory: async (latitude, longitude, startDate, endDate) => {
    return requestWithRetry(archiveClient, {
      latitude,
      longitude,
      hourly: HOURLY_FIELDS,
      start_date: startDate, // YYYY-MM-DD
      end_date: endDate, // YYYY-MM-DD
      timezone: "auto",
    });
  },
};
