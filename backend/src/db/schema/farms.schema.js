import {
  pgTable,
  uuid,
  varchar,
  numeric,
  timestamp,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.schema.js";

// Sprint 1 (Farm Management). Every other future module (Weather,
// Satellite, AI Advisory, Analytics, Reports) hangs off a farm record, so
// this table is intentionally strict: every farm is owned by exactly one
// user, soft-deleted rather than destroyed, and validated at both the DB
// and application layer.
export const farms = pgTable(
  "farms",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    farmName: varchar("farm_name", { length: 100 }).notNull(),
    crop: varchar("crop", { length: 100 }).notNull(),

    area: numeric("area", { precision: 10, scale: 2, mode: "number" }).notNull(),
    areaUnit: varchar("area_unit", { length: 20 }).notNull().default("acres"),

    latitude: numeric("latitude", {
      precision: 9,
      scale: 6,
      mode: "number",
    }).notNull(),
    longitude: numeric("longitude", {
      precision: 9,
      scale: 6,
      mode: "number",
    }).notNull(),

    village: varchar("village", { length: 150 }).notNull(),
    district: varchar("district", { length: 150 }).notNull(),
    state: varchar("state", { length: 150 }).notNull(),
    country: varchar("country", { length: 150 }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    // Every "list my farms" / ownership-check query filters on user_id.
    index("farms_user_id_idx").on(table.userId),
    // Soft-delete filtering (WHERE deleted_at IS NULL) happens on every read.
    index("farms_deleted_at_idx").on(table.deletedAt),
    // "Farm names must be unique for each user" - enforced at the DB level,
    // but only among active (non-soft-deleted) farms so a deleted farm's
    // name can be reused.
    uniqueIndex("farms_user_id_farm_name_unique")
      .on(table.userId, table.farmName)
      .where(sql`${table.deletedAt} IS NULL`),
    check(
      "farms_latitude_check",
      sql`${table.latitude} >= -90 AND ${table.latitude} <= 90`
    ),
    check(
      "farms_longitude_check",
      sql`${table.longitude} >= -180 AND ${table.longitude} <= 180`
    ),
    check("farms_area_positive_check", sql`${table.area} > 0`),
  ]
);
