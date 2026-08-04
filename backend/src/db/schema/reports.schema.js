import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { farms } from "./farms.schema.js";
import { users } from "./users.schema.js";

// Reports module. Every row hangs off a farm via `farm_id` and is deleted
// automatically (ON DELETE CASCADE) when the farm is removed - same
// convention as weather_history / satellite_cache / recommendations. Unlike
// recommendations (append-only, no delete), reports ARE user-deletable
// (see API: DELETE /api/v1/reports/:id) since a report is a generated
// artifact, not an audit trail entry.
//
// `metadata` (jsonb) stores the full snapshot the report was built from -
// farm details, weather block, AI recommendation summary, satellite
// summary, sensor snapshot, and a `contentHash` used to detect duplicate
// generation requests (see reports.service.js "avoid regenerating
// identical reports unnecessarily"). Storing the snapshot inline mirrors
// recommendations.schema.js's weatherSnapshot/satelliteSnapshot/
// sensorSnapshot columns - a report stays fully explainable after the
// underlying weather/satellite data has changed or expired from cache.

export const REPORT_TYPES = ["today", "weekly", "monthly", "recommendation"];
export const REPORT_FILE_TYPES = ["pdf", "csv", "json"];
export const REPORT_STATUSES = ["completed", "failed"];

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),

    // "generated_by" per the spec - the user who requested this report.
    // Also doubles as the ownership column every repository query filters
    // on, same role userId plays in satellite_requests.
    generatedBy: uuid("generated_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    reportType: varchar("report_type", { length: 30 }).notNull(),
    fileType: varchar("file_type", { length: 10 }).notNull(),

    // completed | failed. A failed generation attempt is still recorded
    // (metadata.error holds the reason) rather than silently discarded,
    // so users/support can see why a report didn't come through - see
    // reports.service.js error-handling flow.
    status: varchar("status", { length: 20 }).notNull().default("completed"),

    // Relative path under the reports storage root (see utils/fileStorage.js),
    // e.g. "reports/<farmId>/<reportId>.pdf". Never an absolute filesystem
    // path and never a raw client-facing URL - reports.schema.js (DTO
    // layer) turns this into a signed-feeling API download route
    // (GET /api/v1/reports/:id/download), keeping the actual storage
    // layout an internal implementation detail. Null when status = 'failed'.
    downloadUrl: text("download_url"),

    // Snapshot of every input the report was built from (farm, weather,
    // forecast, AI recommendation, satellite summary, sensor snapshot) plus
    // a contentHash for dedup - see reports.service.js.
    metadata: jsonb("metadata").notNull(),

    generatedAt: timestamp("generated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Every "list my reports" / ownership-check query filters on this.
    index("reports_generated_by_idx").on(table.generatedBy),
    index("reports_farm_id_idx").on(table.farmId),
    index("reports_generated_at_idx").on(table.generatedAt),
    check(
      "reports_report_type_check",
      sql`${table.reportType} IN ('today', 'weekly', 'monthly', 'recommendation')`
    ),
    check(
      "reports_file_type_check",
      sql`${table.fileType} IN ('pdf', 'csv', 'json')`
    ),
    check(
      "reports_status_check",
      sql`${table.status} IN ('completed', 'failed')`
    ),
  ]
);
