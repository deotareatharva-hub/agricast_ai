import { and, eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { satelliteCache, satelliteRequests } from "../../db/schema/index.js";

// Only layer allowed to talk to Drizzle/the database for the satellite
// module - same convention as modules/weather/weather.repository.js. Farm
// ownership is NOT checked here (satellite.service.js already does that
// via farmRepository before calling in); every method here trusts the
// farmId it's given belongs to the caller.
export const satelliteRepository = {
  // --- satellite_cache -------------------------------------------------

  findCache: async (farmId, layer, paramsHash) => {
    const rows = await db
      .select()
      .from(satelliteCache)
      .where(
        and(
          eq(satelliteCache.farmId, farmId),
          eq(satelliteCache.layer, layer),
          eq(satelliteCache.paramsHash, paramsHash)
        )
      );
    return rows[0] || null;
  },

  // Upsert on (farmId, layer, paramsHash) - a repeat request for the exact
  // same bbox/date-range/layer replaces the cached entry rather than
  // growing the table indefinitely.
  upsertCache: async ({
    farmId,
    layer,
    paramsHash,
    bbox,
    dateRange,
    responseMetadata,
    imageBase64,
    imageMimeType,
    expiresAt,
  }) => {
    const rows = await db
      .insert(satelliteCache)
      .values({
        farmId,
        layer,
        paramsHash,
        bbox,
        dateRange,
        responseMetadata,
        imageBase64,
        imageMimeType,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [satelliteCache.farmId, satelliteCache.layer, satelliteCache.paramsHash],
        set: {
          bbox,
          dateRange,
          responseMetadata,
          imageBase64,
          imageMimeType,
          expiresAt,
          requestTime: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();
    return rows[0];
  },

  // --- satellite_requests ------------------------------------------------

  // Append-only audit log entry, one per satellite request regardless of
  // outcome. Never throws through to the caller's own try/catch -
  // satellite.service.js wraps this call and logs-but-swallows failures so
  // a logging problem never fails the actual request.
  logRequest: async ({
    farmId,
    userId,
    layer,
    bbox,
    dateRange,
    status,
    responseMetadata = null,
    errorMessage = null,
    expiresAt = null,
  }) => {
    const rows = await db
      .insert(satelliteRequests)
      .values({
        farmId,
        userId,
        layer,
        bbox,
        dateRange,
        status,
        responseMetadata,
        errorMessage,
        expiresAt,
      })
      .returning();
    return rows[0];
  },
};
