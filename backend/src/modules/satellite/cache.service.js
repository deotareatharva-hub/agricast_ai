/**
 * cache.service.js
 *
 * Satellite image cache management. Wraps satelliteRepository cache
 * operations with higher-level logic:
 *   - TTL checks (is a cached entry still fresh?)
 *   - Invalidation (clear all cache entries for a farm)
 *   - Cache statistics (for monitoring/admin use)
 *
 * The service layer (satellite.service.js) delegates to this module so
 * caching decisions never bleed into business logic.
 */

import { db } from "../../config/db.js";
import { satelliteCache } from "../../db/schema/index.js";
import { eq, and, lt } from "drizzle-orm";
import { logger } from "../../utils/logger.js";

// Default cache TTL in milliseconds (6 hours).
export const DEFAULT_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export const cacheService = {
  /**
   * Check whether a cached entry is still fresh (not expired).
   * @param {{ expiresAt: Date|string|null }} cacheRow
   * @returns {boolean}
   */
  isFresh(cacheRow) {
    if (!cacheRow || !cacheRow.expiresAt) return false;
    return new Date(cacheRow.expiresAt) > new Date();
  },

  /**
   * Compute the expiry timestamp from "now + ttl".
   * @param {number} [ttlMs=DEFAULT_CACHE_TTL_MS]
   * @returns {Date}
   */
  expiresAt(ttlMs = DEFAULT_CACHE_TTL_MS) {
    return new Date(Date.now() + ttlMs);
  },

  /**
   * Invalidate (delete) ALL cache entries for a given farm.
   * Called by the manual refresh endpoint.
   *
   * @param {string} farmId
   * @returns {Promise<number>} Number of rows deleted
   */
  async invalidateFarm(farmId) {
    try {
      const result = await db
        .delete(satelliteCache)
        .where(eq(satelliteCache.farmId, farmId))
        .returning({ id: satelliteCache.id });

      logger.info("Satellite cache invalidated for farm", {
        farmId,
        rowsDeleted: result.length,
      });

      return result.length;
    } catch (error) {
      logger.error("Failed to invalidate satellite cache", {
        farmId,
        message: error.message,
      });
      throw error;
    }
  },

  /**
   * Invalidate a single cache entry for (farmId, layer, paramsHash).
   * Used when a specific layer needs to be refreshed without clearing the rest.
   *
   * @param {string} farmId
   * @param {string} layer
   * @param {string} paramsHash
   * @returns {Promise<number>} Number of rows deleted
   */
  async invalidateEntry(farmId, layer, paramsHash) {
    try {
      const result = await db
        .delete(satelliteCache)
        .where(
          and(
            eq(satelliteCache.farmId, farmId),
            eq(satelliteCache.layer, layer),
            eq(satelliteCache.paramsHash, paramsHash)
          )
        )
        .returning({ id: satelliteCache.id });

      return result.length;
    } catch (error) {
      logger.error("Failed to invalidate satellite cache entry", {
        farmId,
        layer,
        message: error.message,
      });
      throw error;
    }
  },

  /**
   * Remove all globally expired entries across all farms.
   * Suitable for a scheduled cleanup job.
   *
   * @returns {Promise<number>} Number of rows pruned
   */
  async pruneExpired() {
    try {
      const now = new Date();
      const result = await db
        .delete(satelliteCache)
        .where(lt(satelliteCache.expiresAt, now))
        .returning({ id: satelliteCache.id });

      logger.info("Satellite cache pruned", { rowsDeleted: result.length });
      return result.length;
    } catch (error) {
      logger.error("Failed to prune satellite cache", { message: error.message });
      throw error;
    }
  },

  /**
   * Return the count of cached entries for a farm.
   * @param {string} farmId
   * @returns {Promise<number>}
   */
  async countForFarm(farmId) {
    const rows = await db
      .select({ id: satelliteCache.id })
      .from(satelliteCache)
      .where(eq(satelliteCache.farmId, farmId));
    return rows.length;
  },
};
