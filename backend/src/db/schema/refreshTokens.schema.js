import { pgTable, uuid, varchar, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { users } from "./users.schema.js";

// Supports refresh-token rotation: each row is one issued refresh token.
// We never store the raw token - only a SHA-256 hash of it - so a leaked
// database dump can't be replayed as a session. Rotation chains are
// tracked via replacedByTokenId so a reused (already-rotated) token can be
// detected and the whole family revoked.
export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),
    userAgent: varchar("user_agent", { length: 255 }),
    ipAddress: varchar("ip_address", { length: 64 }),
    revoked: boolean("revoked").notNull().default(false),
    replacedByTokenId: uuid("replaced_by_token_id"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("refresh_tokens_user_id_idx").on(table.userId),
    index("refresh_tokens_expires_at_idx").on(table.expiresAt),
  ]
);
