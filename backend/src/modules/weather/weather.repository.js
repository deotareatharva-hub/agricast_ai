import { and, eq, gte, lte, asc, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { weatherCache, weatherHistory } from "../../db/schema/index.js";

// Only layer allowed to talk to Drizzle/the database for the weather
// module - same convention as modules/farms/farm.repository.js. Farm
// ownership is NOT checked here (that needs a join back to `farms`, which
// weather.service.js already does via farmRepository before calling in);
// every method here trusts the farmId it's given belongs to the caller.
export const weatherRepository = {
  // --- weather_cache -------------------------------------------------------

  findCache: async (farmId, forecastType) => {
    const rows = await db
      .select()
      .from(weatherCache)
      .where(
        and(
          eq(weatherCache.farmId, farmId),
          eq(weatherCache.forecastType, forecastType)
        )
      );
    return rows[0] || null;
  },

  // Upsert on (farmId, forecastType) - a farm has at most one cached row
  // per forecast type at any time, so a repeat fetch replaces it rather
  // than growing the table.
  upsertCache: async (farmId, forecastType, payload, expiresAt) => {
    const rows = await db
      .insert(weatherCache)
      .values({ farmId, forecastType, payload, expiresAt })
      .onConflictDoUpdate({
        target: [weatherCache.farmId, weatherCache.forecastType],
        set: { payload, expiresAt, fetchedAt: new Date(), updatedAt: new Date() },
      })
      .returning();
    return rows[0];
  },

  // --- weather_history -------------------------------------------------------

  // Bulk upsert of individual readings. Used after every live Open-Meteo
  // fetch so history accumulates automatically as a side effect of normal
  // usage, without a separate cron/job. Conflicts on (farmId, recordedAt)
  // simply refresh the reading in place (e.g. a forecast value getting
  // replaced by the observed value once that hour has passed).
  bulkUpsertHistory: async (farmId, readings) => {
    if (!readings.length) return [];

    const values = readings.map((r) => ({
      farmId,
      recordedAt: new Date(r.time ?? r.date),
      temperature: r.temperature ?? r.temperatureMax ?? null,
      humidity: r.humidity ?? null,
      windSpeed: r.windSpeed ?? r.windSpeedMax ?? null,
      windDirection: r.windDirection ?? r.windDirectionDominant ?? null,
      pressure: r.pressure ?? null,
      rainProbability: r.rainProbability ?? r.rainProbabilityMax ?? null,
      uvIndex: r.uvIndex ?? r.uvIndexMax ?? null,
      weatherCode: r.weatherCode ?? null,
    }));

    try {
      return await db
        .insert(weatherHistory)
        .values(values)
        .onConflictDoUpdate({
          target: [weatherHistory.farmId, weatherHistory.recordedAt],
          // Reference the row that was attempted (`excluded`) so each
          // conflicting record refreshes with ITS OWN new values, not a
          // single shared value across the whole batch.
          set: {
            temperature: sql`excluded.temperature`,
            humidity: sql`excluded.humidity`,
            windSpeed: sql`excluded.wind_speed`,
            windDirection: sql`excluded.wind_direction`,
            pressure: sql`excluded.pressure`,
            rainProbability: sql`excluded.rain_probability`,
            uvIndex: sql`excluded.uv_index`,
            weatherCode: sql`excluded.weather_code`,
          },
        })
        .returning();
    } catch (err) {
      // Defensive fallback: if the batch upsert fails for any reason
      // (driver quirk, partial constraint mismatch), fall back to
      // insert-or-skip row by row so a history save can never take down
      // the whole request.
      const saved = [];
      for (const value of values) {
        const rows = await db
          .insert(weatherHistory)
          .values(value)
          .onConflictDoNothing()
          .returning();
        if (rows[0]) saved.push(rows[0]);
      }
      return saved;
    }
  },

  findHistory: async (farmId, { startDate, endDate }) => {
    const conditions = [eq(weatherHistory.farmId, farmId)];
    if (startDate) conditions.push(gte(weatherHistory.recordedAt, startDate));
    if (endDate) conditions.push(lte(weatherHistory.recordedAt, endDate));

    return db
      .select()
      .from(weatherHistory)
      .where(and(...conditions))
      .orderBy(asc(weatherHistory.recordedAt));
  },
};
