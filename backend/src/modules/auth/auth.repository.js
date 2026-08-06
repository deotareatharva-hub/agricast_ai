import { eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { users } from "../../db/schema/index.js";

// Only layer allowed to talk to Drizzle/the database for the auth module.
// Services depend on this repository's interface, never on Drizzle
// directly, so the persistence layer can change without touching business
// logic.
export const authRepository = {
  findByEmail: async (email) => {
    const rows = await db.select().from(users).where(eq(users.email, email));
    return rows[0] || null;
  },

  findById: async (id) => {
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows[0] || null;
  },

  findByProviderId: async (provider, providerId) => {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.providerId, providerId));
    return rows.find((u) => u.provider === provider) || null;
  },

  create: async ({ fullName, email, passwordHash }) => {
    const rows = await db
      .insert(users)
      .values({ fullName, email, passwordHash })
      .returning();
    return rows[0];
  },

  // Used by the Google OAuth flow to create a brand-new account. No
  // passwordHash is set - the user can only sign in via Google unless they
  // later set a password (out of scope for this upgrade).
  createFromGoogle: async ({ fullName, email, avatarUrl, providerId }) => {
    const rows = await db
      .insert(users)
      .values({
        fullName,
        email,
        avatarUrl,
        provider: "google",
        providerId,
        isVerified: true, // Google already verified the email
      })
      .returning();
    return rows[0];
  },

  // Links a Google identity to an existing local (email/password) account
  // that shares the same email, and backfills avatar/verification if the
  // account didn't already have them. Never touches passwordHash, so the
  // user keeps being able to log in with their password too.
  linkGoogleIdentity: async (userId, { avatarUrl, providerId }) => {
    const patch = { providerId, isVerified: true, updatedAt: new Date() };
    if (avatarUrl) patch.avatarUrl = avatarUrl;

    const rows = await db.update(users).set(patch).where(eq(users.id, userId)).returning();
    return rows[0];
  },
};
