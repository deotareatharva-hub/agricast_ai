import { eq, and } from "drizzle-orm";
import { db } from "../../config/db.js";
import { refreshTokens } from "../../db/schema/index.js";

// Persistence for refresh-token rotation. A refresh token is only ever
// stored as its SHA-256 hash (see jwtUtil.hashToken) - never the raw
// token - so a database leak alone can't be replayed as a session.
export const refreshTokenRepository = {
  create: async ({ id, userId, tokenHash, expiresAt, userAgent, ipAddress }) => {
    const rows = await db
      .insert(refreshTokens)
      .values({ id, userId, tokenHash, expiresAt, userAgent, ipAddress })
      .returning();
    return rows[0];
  },

  findByHash: async (tokenHash) => {
    const rows = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash));
    return rows[0] || null;
  },

  findById: async (id) => {
    const rows = await db.select().from(refreshTokens).where(eq(refreshTokens.id, id));
    return rows[0] || null;
  },

  // Marks a token used-up and points it at the token that replaced it, so
  // a replayed (already-rotated) refresh token can be detected.
  markRotated: async (id, replacedByTokenId) => {
    await db
      .update(refreshTokens)
      .set({ revoked: true, replacedByTokenId })
      .where(eq(refreshTokens.id, id));
  },

  revoke: async (id) => {
    await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.id, id));
  },

  // Called when token reuse is detected (a rotated-out token is presented
  // again) - revokes every token in that family for the user as a
  // precaution against a stolen refresh token.
  revokeAllForUser: async (userId) => {
    await db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(and(eq(refreshTokens.userId, userId), eq(refreshTokens.revoked, false)));
  },
};
