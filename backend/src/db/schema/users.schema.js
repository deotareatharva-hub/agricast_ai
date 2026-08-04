import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

// Phase 1 only needs the `users` table for authentication. Farm, field,
// weather, and AI-advisory tables are introduced in later phases and will
// live in their own schema files under this same folder.
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: varchar("full_name", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
