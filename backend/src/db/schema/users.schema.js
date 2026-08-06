import { pgTable, uuid, varchar, timestamp, boolean } from "drizzle-orm/pg-core";

// Phase 1 only needed the `users` table for email/password authentication.
// The auth upgrade (Google OAuth + roles) extends this same table instead
// of introducing a new one, so every existing FK (farms.user_id, etc.)
// keeps working unchanged.
//
// - passwordHash is now nullable: Google-only accounts never set a
//   password, so `provider = 'google'` rows will have passwordHash = NULL.
// - provider / providerId identify how the account was created and (for
//   Google) the stable Google `sub` used to find the account on repeat
//   logins.
// - role drives authorization (see middlewares/authorize.middleware.js).
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: varchar("full_name", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  avatarUrl: varchar("avatar_url", { length: 512 }),
  provider: varchar("provider", { length: 20 }).notNull().default("local"), // 'local' | 'google'
  providerId: varchar("provider_id", { length: 255 }), // Google `sub` claim
  role: varchar("role", { length: 20 }).notNull().default("farmer"), // 'admin' | 'farmer'
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
