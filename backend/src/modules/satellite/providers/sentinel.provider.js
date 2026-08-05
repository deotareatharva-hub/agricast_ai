/**
 * SentinelProvider
 *
 * Adapter that wraps the existing integrations/satellite/sentinel.js
 * client behind the SatelliteProvider interface. The service layer calls
 * this class instead of calling sentinelClient directly, which means
 * swapping providers never touches service or controller code.
 *
 * This approach satisfies the spec requirement:
 *   "Architecture must allow future support for GEE, NASA EarthData,
 *    Copernicus, Planet Labs, Mapbox without changing controllers."
 */

import { SatelliteProvider } from "./provider.interface.js";
import { sentinelClient, SUPPORTED_LAYERS } from "../../../integrations/satellite/sentinel.js";
import { sentinelMapper } from "../../../integrations/satellite/sentinelMapper.js";

export class SentinelProvider extends SatelliteProvider {
  get name() {
    return "Sentinel Hub";
  }

  get supportedLayers() {
    return SUPPORTED_LAYERS;
  }

  /**
   * Fetch a rendered image via Sentinel Hub Process API.
   * Maps raw buffer + content-type into normalized { imageBase64, mimeType, sizeBytes }.
   * @param {{ bbox, dateRange, layer, width?, height? }} params
   */
  async fetchImage({ bbox, dateRange, layer }) {
    const raw = await sentinelClient.fetchImage({ bbox, dateRange, layer });
    return sentinelMapper.mapImage(raw, { layer, bbox, dateRange });
  }

  /**
   * Fetch scene catalog metadata via Sentinel Hub Catalog API.
   * Returns normalized { sceneCount, scenes[] }.
   * @param {{ bbox, dateRange, limit? }} params
   */
  async fetchMetadata({ bbox, dateRange, layer = "TRUE_COLOR" }) {
    const raw = await sentinelClient.fetchMetadata({ bbox, dateRange });
    return sentinelMapper.mapMetadata(raw, { layer, bbox, dateRange });
  }

  async ping() {
    // Light ping: try fetching a token. If the auth flow works, the provider is healthy.
    try {
      const { tokenManager } = await import("../../../integrations/satellite/tokenManager.js");
      await tokenManager.getToken();
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton — one provider instance shared across the module.
export const sentinelProvider = new SentinelProvider();
