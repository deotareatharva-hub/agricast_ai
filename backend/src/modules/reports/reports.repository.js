import { and, desc, eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { reports } from "../../db/schema/index.js";

// Only layer allowed to talk to Drizzle/the database for the reports
// module - same convention as modules/weather/weather.repository.js and
// modules/ai/ai.repository.js. Every query here is deliberately scoped by
// `generatedBy` (the requesting user) in addition to the FK/index on that
// column, so a caller can never read, list, or delete a report that isn't
// theirs just by guessing an id - same ownership-at-every-layer pattern
// farm.repository.js uses for userId.
export const reportsRepository = {
  create: async (data) => {
    const rows = await db.insert(reports).values(data).returning();
    return rows[0];
  },

  findAllForUser: async (userId, { farmId, reportType, limit, offset } = {}) => {
    const conditions = [eq(reports.generatedBy, userId)];
    if (farmId) conditions.push(eq(reports.farmId, farmId));
    if (reportType) conditions.push(eq(reports.reportType, reportType));

    return db
      .select()
      .from(reports)
      .where(and(...conditions))
      .orderBy(desc(reports.generatedAt))
      .limit(limit)
      .offset(offset);
  },

  findByIdForUser: async (id, userId) => {
    const rows = await db
      .select()
      .from(reports)
      .where(and(eq(reports.id, id), eq(reports.generatedBy, userId)));
    return rows[0] || null;
  },

  // Used by reports.service.js's dedup check: "avoid regenerating
  // identical reports unnecessarily". Looks for the most recent completed
  // report of the same farm/type/fileType whose metadata.contentHash
  // matches, without needing a dedicated indexed column - report volume
  // per farm is low enough that scanning the small set of matching
  // (farmId, reportType, fileType) rows for this user is cheap, same
  // "no premature indexing" judgment call weather_cache's single-row-per-
  // key design avoids needing here.
  findLatestByContentHash: async (userId, { farmId, reportType, fileType, contentHash }) => {
    const rows = await db
      .select()
      .from(reports)
      .where(
        and(
          eq(reports.generatedBy, userId),
          eq(reports.farmId, farmId),
          eq(reports.reportType, reportType),
          eq(reports.fileType, fileType),
          eq(reports.status, "completed")
        )
      )
      .orderBy(desc(reports.generatedAt))
      .limit(5);

    return rows.find((row) => row.metadata?.contentHash === contentHash) || null;
  },

  deleteByIdForUser: async (id, userId) => {
    const rows = await db
      .delete(reports)
      .where(and(eq(reports.id, id), eq(reports.generatedBy, userId)))
      .returning();
    return rows[0] || null;
  },
};
