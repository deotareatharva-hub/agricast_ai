import { and, eq, desc } from "drizzle-orm";
import { db } from "../../config/db.js";
import { recommendations } from "../../db/schema/index.js";

// Only layer allowed to talk to Drizzle/the database for the AI module -
// same convention as modules/weather/weather.repository.js and
// modules/satellite/satellite.repository.js. Farm ownership is NOT checked
// here (ai.service.js already does that via farmRepository before calling
// in); every method here trusts the farmId it's given belongs to the
// caller. This table is intentionally append-only: no update/delete
// methods are exposed, so "never overwrite history" is enforced by what
// this file simply doesn't offer to do.
export const aiRepository = {
  create: async ({
    farmId,
    weatherSnapshot,
    satelliteSnapshot,
    sensorSnapshot,
    prompt,
    rawResponse,
    parsedResponse,
    language,
    confidence,
  }) => {
    const rows = await db
      .insert(recommendations)
      .values({
        farmId,
        weatherSnapshot,
        satelliteSnapshot: satelliteSnapshot ?? null,
        sensorSnapshot: sensorSnapshot ?? null,
        prompt,
        rawResponse,
        parsedResponse,
        language,
        confidence,
      })
      .returning();
    return rows[0];
  },

  // Newest-first, same ordering convention as weather_history reads via
  // an ORDER BY on the time column. `limit` defaults are enforced by the
  // service layer, not here, so the repository stays a dumb data-access
  // layer with no business rules baked in.
  findHistory: async (farmId, { limit, offset }) => {
    return db
      .select()
      .from(recommendations)
      .where(eq(recommendations.farmId, farmId))
      .orderBy(desc(recommendations.createdAt))
      .limit(limit)
      .offset(offset);
  },

  findLatest: async (farmId) => {
    const rows = await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.farmId, farmId))
      .orderBy(desc(recommendations.createdAt))
      .limit(1);
    return rows[0] || null;
  },

  findByIdForFarm: async (id, farmId) => {
    const rows = await db
      .select()
      .from(recommendations)
      .where(and(eq(recommendations.id, id), eq(recommendations.farmId, farmId)));
    return rows[0] || null;
  },
};
