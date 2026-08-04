import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  text,
  timestamp,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { farms } from "./farms.schema.js";
import { users } from "./users.schema.js";

// Satellite module. Every row in both tables hangs off a farm via
// `farm_id` and is deleted automatically (ON DELETE CASCADE) when the farm
// is removed - satellite data has no meaning without an owning farm, same
// convention as weather.schema.js.
//
// Two tables, two different jobs:
//   - satellite_cache:    one row per (farm, layer, paramsHash). Holds the
//                          last normalized Sentinel Hub response (image +
//                          metadata) so repeat requests for the same
//                          farm/layer/bbox/date-range within the TTL
//                          window don't re-hit Sentinel Hub.
//   - satellite_requests: append-only audit log of every satellite request
//                          (success or failure), used for debugging,
//                          rate-limit visibility, and future usage
//                          reporting. Never updated, only inserted.

export const SATELLITE_LAYERS = [
  "TRUE_COLOR",
  "FALSE_COLOR",
  "NDVI",
  "MOISTURE_INDEX",
  "EVI",
];

export const SATELLITE_REQUEST_STATUSES = ["success", "error"];

export const satelliteCache = pgTable(
  "satellite_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),

    // Which imagery layer this cached entry serves - see SATELLITE_LAYERS.
    layer: varchar("layer", { length: 30 }).notNull(),

    // sha256 of the normalized { bbox, dateRange, layer, width, height }
    // request params. A farm can have many cache rows per layer (one per
    // distinct bbox/date-range combination requested so far), so the
    // cache key is (farm_id, layer, params_hash), not just (farm_id,
    // layer) like weather_cache's (farm_id, forecast_type).
    paramsHash: varchar("params_hash", { length: 64 }).notNull(),

    // Bounding box sent to Sentinel Hub: [minLng, minLat, maxLng, maxLat].
    bbox: jsonb("bbox").notNull(),

    // { from, to } ISO date strings (YYYY-MM-DD) used for the scene search.
    dateRange: jsonb("date_range").notNull(),

    // Non-binary response info (size, scene count, etc.) - see
    // integrations/satellite/sentinelMapper.js for the exact shape.
    responseMetadata: jsonb("response_metadata").notNull(),

    // Base64-encoded image bytes. Nullable because metadata-only requests
    // (GET /metadata/:farmId) share this table's cache key logic but
    // never render an image.
    imageBase64: text("image_base64"),
    imageMimeType: varchar("image_mime_type", { length: 50 }),

    requestTime: timestamp("request_time", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Every cache lookup is "give me the row for this farm + layer +
    // exact request params".
    uniqueIndex("satellite_cache_farm_layer_params_unique").on(
      table.farmId,
      table.layer,
      table.paramsHash
    ),
    // Sweeping/checking expired rows.
    index("satellite_cache_expires_at_idx").on(table.expiresAt),
    check(
      "satellite_cache_layer_check",
      sql`${table.layer} IN ('TRUE_COLOR', 'FALSE_COLOR', 'NDVI', 'MOISTURE_INDEX', 'EVI')`
    ),
  ]
);

export const satelliteRequests = pgTable(
  "satellite_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    layer: varchar("layer", { length: 30 }).notNull(),
    bbox: jsonb("bbox").notNull(),
    dateRange: jsonb("date_range").notNull(),

    // success | error - see SATELLITE_REQUEST_STATUSES.
    status: varchar("status", { length: 20 }).notNull().default("success"),

    responseMetadata: jsonb("response_metadata"),
    errorMessage: text("error_message"),

    // When the request was made (renamed from the spec's "request_time" ->
    // matches satellite_cache's own requestTime column name for
    // consistency across both tables).
    requestTime: timestamp("request_time", { withTimezone: true })
      .notNull()
      .defaultNow(),

    // Present only when the request resulted in a cache write, so this
    // log entry can be cross-referenced with how long that cache entry
    // was expected to live. Null for metadata-only or failed requests.
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("satellite_requests_farm_id_idx").on(table.farmId),
    index("satellite_requests_user_id_idx").on(table.userId),
    index("satellite_requests_request_time_idx").on(table.requestTime),
    check(
      "satellite_requests_status_check",
      sql`${table.status} IN ('success', 'error')`
    ),
  ]
);
