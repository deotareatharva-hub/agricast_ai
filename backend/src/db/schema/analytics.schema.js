import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { farms } from "./farms.schema.js";

// Analytics module. Unlike weather_history / recommendations / reports,
// this table does NOT store source-of-truth data - analytics are always
// derived from weather_history, recommendations, reports, and farms (see
// modules/analytics/analytics.repository.js). analytics_cache exists
// purely as a performance layer: it memoizes the result of an expensive
// aggregate query (e.g. a full month of weather trend grouping) for a
// short TTL so repeat dashboard loads don't recompute it, same role
// weather_cache plays for the weather module's live provider calls.
//
// One row per (farm, cacheKey). cacheKey encodes both the analytics type
// and its parameters (e.g. "dashboard", "weather:2026-07-01:2026-08-01:day",
// "monthly:2026-08") so different parameter combinations for the same farm
// don't collide - see analytics.service.js buildCacheKey().
export const analyticsCache = pgTable(
  "analytics_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),

    cacheKey: varchar("cache_key", { length: 255 }).notNull(),

    // The fully computed, frontend-ready DTO - a cache hit is a straight
    // read-and-return with no recomputation, same shape the service would
    // have built on a miss.
    payload: jsonb("payload").notNull(),

    computedAt: timestamp("computed_at", { withTimezone: true })
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
    // Every cache lookup is "give me the row for this farm + key".
    uniqueIndex("analytics_cache_farm_id_cache_key_unique").on(
      table.farmId,
      table.cacheKey
    ),
    // Sweeping/checking expired rows, same pattern as weather_cache.
    index("analytics_cache_expires_at_idx").on(table.expiresAt),
  ]
);
