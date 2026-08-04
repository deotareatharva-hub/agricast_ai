import "dotenv/config";

// Single source of truth for environment configuration. Every other module
// imports `env` from here instead of touching `process.env` directly, so
// misconfiguration fails fast and loudly at boot instead of silently later.

const required = ["DATABASE_URL", "JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    // eslint-disable-next-line no-console
    console.error(`[FATAL] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT) || 5000,
  apiPrefix: process.env.API_PREFIX || "/api/v1",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  databaseUrl: process.env.DATABASE_URL,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,

  // Weather module (Open-Meteo). Cache TTLs are deliberately different per
  // forecast type: current conditions go stale fast, daily outlooks barely
  // change within an hour.
  weather: {
    forecastUrl: process.env.OPEN_METEO_FORECAST_URL || "https://api.open-meteo.com/v1/forecast",
    archiveUrl: process.env.OPEN_METEO_ARCHIVE_URL || "https://archive-api.open-meteo.com/v1/archive",
    cacheTtlSeconds: {
      current: Number(process.env.WEATHER_CACHE_TTL_CURRENT) || 15 * 60, // 15 min
      hourly: Number(process.env.WEATHER_CACHE_TTL_HOURLY) || 60 * 60, // 1 hour
      daily: Number(process.env.WEATHER_CACHE_TTL_DAILY) || 3 * 60 * 60, // 3 hours
    },
  },

  // Satellite module (Sentinel Hub). Credentials are deliberately NOT in
  // the `required` list above - a server that hasn't been given Sentinel
  // Hub credentials yet should still boot and serve every other module;
  // integrations/satellite/tokenManager.js throws a clear ApiError only
  // when the satellite endpoints are actually used without them.
  satellite: {
    sentinel: {
      oauthUrl:
        process.env.SENTINEL_OAUTH_URL ||
        "https://services.sentinel-hub.com/oauth/token",
      processUrl:
        process.env.SENTINEL_PROCESS_URL ||
        "https://services.sentinel-hub.com/api/v1/process",
      catalogUrl:
        process.env.SENTINEL_CATALOG_URL ||
        "https://services.sentinel-hub.com/api/v1/catalog/1.0.0/search",
      clientId: process.env.SENTINEL_CLIENT_ID || "",
      clientSecret: process.env.SENTINEL_CLIENT_SECRET || "",
      timeoutMs: Number(process.env.SENTINEL_TIMEOUT_MS) || 15000,
      maxRetries: Number(process.env.SENTINEL_MAX_RETRIES) || 2,
      retryDelayMs: Number(process.env.SENTINEL_RETRY_DELAY_MS) || 700,
    },
    // Farms only store a lat/lng point (see db/schema/farms.schema.js), so
    // the satellite module derives a small square bounding box around
    // that point using this buffer rather than a stored farm polygon.
    bboxBufferMeters: Number(process.env.SATELLITE_BBOX_BUFFER_METERS) || 500,
    imageSize: {
      width: Number(process.env.SATELLITE_IMAGE_WIDTH) || 512,
      height: Number(process.env.SATELLITE_IMAGE_HEIGHT) || 512,
    },
    // Satellite imagery refreshes every few days at best (Sentinel-2
    // revisit time), so this TTL is deliberately much longer than
    // weather's - no point re-hitting Sentinel Hub hourly.
    cacheTtlSeconds: Number(process.env.SATELLITE_CACHE_TTL_SECONDS) || 6 * 60 * 60, // 6 hours
    defaultRangeDays: Number(process.env.SATELLITE_DEFAULT_RANGE_DAYS) || 10,
  },

  // AI Recommendation module (Grok API). Like Sentinel Hub credentials,
  // GROK_API_KEY is deliberately NOT in the `required` list above - a
  // server without it should still boot and serve every other module;
  // integrations/ai/grok.js throws a clear ApiError only when
  // POST /api/v1/ai/recommend is actually called without a key.
  ai: {
    grok: {
      apiUrl: process.env.GROK_API_URL || "https://api.x.ai/v1/chat/completions",
      apiKey: process.env.GROK_API_KEY || "",
      model: process.env.GROK_MODEL || "grok-4-fast",
      timeoutMs: Number(process.env.GROK_TIMEOUT_MS) || 20000,
      maxRetries: Number(process.env.GROK_MAX_RETRIES) || 2,
      retryDelayMs: Number(process.env.GROK_RETRY_DELAY_MS) || 800,
    },
  },
};
