import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  text,
  numeric,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { farms } from "./farms.schema.js";

// AI Recommendation module. Every row hangs off a farm via `farm_id` and is
// deleted automatically (ON DELETE CASCADE) when the farm is removed - same
// convention as weather_history / satellite_cache. This table is
// deliberately append-only (see ai.repository.js: no update/delete methods
// are exposed) so that a farm's recommendation history is a durable audit
// trail future analytics can rely on, per the "never overwrite history"
// business rule.
//
// weatherSnapshot / satelliteSnapshot / sensorSnapshot capture the EXACT
// inputs the prompt was built from at generation time. Weather and
// satellite data are cached/refreshed independently (see weather_cache,
// satellite_cache) and will drift over time, so a recommendation would
// otherwise become unexplainable after the fact - storing the snapshot
// inline makes every past recommendation fully reproducible.
//
// rawResponse keeps the untouched Grok API output (debugging / re-parsing
// if responseParser.js's contract ever changes); parsedResponse is the
// validated, strict-JSON structure the API actually serves to clients -
// same separation of "provider truth" vs "app DTO" as satellite_cache's
// responseMetadata vs the mapped DTO returned to callers.

export const RECOMMENDATION_LANGUAGES = ["en", "hi", "mr"];

export const recommendations = pgTable(
  "recommendations",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),

    // Inputs the prompt was built from - see integrations/ai/promptBuilder.js.
    weatherSnapshot: jsonb("weather_snapshot").notNull(),
    satelliteSnapshot: jsonb("satellite_snapshot"),
    sensorSnapshot: jsonb("sensor_snapshot"),

    // The exact prompt sent to Grok (system + developer + user prompt,
    // concatenated) - kept for reproducibility and prompt-engineering
    // iteration, not just debugging.
    prompt: text("prompt").notNull(),

    // Untouched provider response body (string) vs. the validated,
    // strict-JSON structure served to the frontend. See
    // integrations/ai/responseParser.js for how one becomes the other.
    rawResponse: text("raw_response").notNull(),
    parsedResponse: jsonb("parsed_response").notNull(),

    language: varchar("language", { length: 5 }).notNull().default("en"),

    // Overall confidence score (0-100) surfaced by recommendationValidator.js.
    // Stored as its own column (not just nested in parsed_response) so it
    // can be indexed/filtered for analytics without unpacking JSON.
    confidence: numeric("confidence", { precision: 5, scale: 2, mode: "number" }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // GET /api/v1/ai/history/:farmId and /latest/:farmId both filter on
    // farm_id and order by created_at - same pattern as
    // satellite_requests_farm_id_idx / _request_time_idx.
    index("recommendations_farm_id_idx").on(table.farmId),
    index("recommendations_created_at_idx").on(table.createdAt),
    check(
      "recommendations_language_check",
      sql`${table.language} IN ('en', 'hi', 'mr')`
    ),
    check(
      "recommendations_confidence_check",
      sql`${table.confidence} >= 0 AND ${table.confidence} <= 100`
    ),
  ]
);
