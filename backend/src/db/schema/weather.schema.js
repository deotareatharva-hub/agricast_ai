import {
  pgTable,
  uuid,
  varchar,
  integer,
  numeric,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { farms } from "./farms.schema.js";

// Weather module (Sprint 2). Every row in both tables hangs off a farm via
// `farm_id` and is deleted automatically (ON DELETE CASCADE) when the farm
// is removed - weather data has no meaning without an owning farm.
//
// Two tables, two different jobs:
//   - weather_cache:   short-lived, one row per (farm, forecastType). Holds
//                       the last normalized Open-Meteo response so repeat
//                       requests within the TTL window don't hit the API.
//   - weather_history: append-only log of individual weather readings per
//                       farm, used for trend queries ("show me the last
//                       30 days for this farm"). Never overwritten, only
//                       inserted/upserted per (farm, recordedAt).

export const FORECAST_TYPES = ["current", "hourly", "daily"];

export const weatherCache = pgTable(
  "weather_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),

    // Which endpoint this cached payload serves: current | hourly | daily.
    forecastType: varchar("forecast_type", { length: 20 }).notNull(),

    // Normalized DTO shape (see integrations/weather/weatherMapper.js),
    // not the raw Open-Meteo response - the service layer never has to
    // re-map on a cache hit.
    payload: jsonb("payload").notNull(),

    fetchedAt: timestamp("fetched_at", { withTimezone: true })
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
    // Every cache lookup is "give me the row for this farm + type".
    uniqueIndex("weather_cache_farm_id_forecast_type_unique").on(
      table.farmId,
      table.forecastType
    ),
    // Sweeping/checking expired rows.
    index("weather_cache_expires_at_idx").on(table.expiresAt),
    check(
      "weather_cache_forecast_type_check",
      sql`${table.forecastType} IN ('current', 'hourly', 'daily')`
    ),
  ]
);

export const weatherHistory = pgTable(
  "weather_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),

    // The timestamp the reading applies to (not when we saved it).
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),

    temperature: numeric("temperature", { precision: 5, scale: 2, mode: "number" }),
    humidity: numeric("humidity", { precision: 5, scale: 2, mode: "number" }),
    windSpeed: numeric("wind_speed", { precision: 6, scale: 2, mode: "number" }),
    windDirection: numeric("wind_direction", {
      precision: 5,
      scale: 1,
      mode: "number",
    }),
    pressure: numeric("pressure", { precision: 7, scale: 2, mode: "number" }),
    rainProbability: numeric("rain_probability", {
      precision: 5,
      scale: 2,
      mode: "number",
    }),
    uvIndex: numeric("uv_index", { precision: 4, scale: 1, mode: "number" }),
    weatherCode: integer("weather_code"),

    // Where the reading came from. Kept as a plain column (rather than an
    // enum) so a future provider can be added without a migration.
    source: varchar("source", { length: 30 }).notNull().default("open-meteo"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("weather_history_farm_id_idx").on(table.farmId),
    index("weather_history_recorded_at_idx").on(table.recordedAt),
    // One reading per farm per timestamp - repeated fetches upsert instead
    // of duplicating rows.
    uniqueIndex("weather_history_farm_id_recorded_at_unique").on(
      table.farmId,
      table.recordedAt
    ),
    check(
      "weather_history_humidity_check",
      sql`${table.humidity} IS NULL OR (${table.humidity} >= 0 AND ${table.humidity} <= 100)`
    ),
    check(
      "weather_history_rain_probability_check",
      sql`${table.rainProbability} IS NULL OR (${table.rainProbability} >= 0 AND ${table.rainProbability} <= 100)`
    ),
  ]
);
