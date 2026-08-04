import { and, desc, eq, ilike, isNull, ne } from "drizzle-orm";
import { db } from "../../config/db.js";
import { farms } from "../../db/schema/index.js";

// Only layer allowed to talk to Drizzle/the database for the farms module.
// Every query here is deliberately scoped by userId (in addition to the
// FK/index on user_id) so a caller can never read or mutate a farm that
// isn't theirs just by guessing an id, and every read filters out
// soft-deleted rows.
export const farmRepository = {
  create: async (data) => {
    const rows = await db.insert(farms).values(data).returning();
    return rows[0];
  },

  findAllByUser: async (userId, { search, crop } = {}) => {
    const conditions = [eq(farms.userId, userId), isNull(farms.deletedAt)];

    if (search) {
      conditions.push(ilike(farms.farmName, `%${search}%`));
    }
    if (crop) {
      conditions.push(ilike(farms.crop, `%${crop}%`));
    }

    return db
      .select()
      .from(farms)
      .where(and(...conditions))
      .orderBy(desc(farms.createdAt));
  },

  findByIdForUser: async (id, userId) => {
    const rows = await db
      .select()
      .from(farms)
      .where(
        and(eq(farms.id, id), eq(farms.userId, userId), isNull(farms.deletedAt))
      );
    return rows[0] || null;
  },

  // Exact (case-sensitive) name match, scoped to the user, used to enforce
  // "farm names must be unique per user" with a friendly error before the
  // DB partial unique index would otherwise reject the insert/update.
  findByNameForUser: async (userId, farmName, excludeId = null) => {
    const conditions = [
      eq(farms.userId, userId),
      eq(farms.farmName, farmName),
      isNull(farms.deletedAt),
    ];
    if (excludeId) {
      conditions.push(ne(farms.id, excludeId));
    }

    const rows = await db
      .select()
      .from(farms)
      .where(and(...conditions));
    return rows[0] || null;
  },

  update: async (id, userId, data) => {
    const rows = await db
      .update(farms)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(eq(farms.id, id), eq(farms.userId, userId), isNull(farms.deletedAt))
      )
      .returning();
    return rows[0] || null;
  },

  softDelete: async (id, userId) => {
    const rows = await db
      .update(farms)
      .set({ deletedAt: new Date() })
      .where(
        and(eq(farms.id, id), eq(farms.userId, userId), isNull(farms.deletedAt))
      )
      .returning();
    return rows[0] || null;
  },
};
