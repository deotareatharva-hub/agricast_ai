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

  create: async ({ fullName, email, passwordHash }) => {
    const rows = await db
      .insert(users)
      .values({ fullName, email, passwordHash })
      .returning();
    return rows[0];
  },
};
