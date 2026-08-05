import { api } from "../../../lib/axios";

// All satellite network calls live here. Components and hooks never call
// axios directly - same convention as features/weather/api/weather.api.js.
//
// Every request goes through the backend (backend/src/modules/satellite/).
// JWT auth is attached automatically by the shared `api` axios instance.
// Endpoint paths match backend/src/modules/satellite/satellite.routes.js.
export const satelliteApi = {
  /**
   * Get the list of supported satellite layers (id, label, description).
   * @returns {Promise<{ count: number, layers: Array<{id,label,description}> }>}
   */
  getLayers: async () => {
    const { data } = await api.get("/satellite/layers");
    return data;
  },

  /**
   * Get the latest satellite snapshot for a farm:
   * TRUE_COLOR image + scene metadata + health metrics combined.
   * @param {string} farmId
   * @param {{ layer?: string, startDate?: string, endDate?: string }} [params]
   */
  getCurrent: async (farmId, params = {}) => {
    const { data } = await api.get(`/satellite/current/${farmId}`, { params });
    return data;
  },

  /**
   * Get the NDVI layer image for a farm.
   * @param {string} farmId
   * @param {{ startDate?: string, endDate?: string }} [params]
   */
  getNdvi: async (farmId, params = {}) => {
    const { data } = await api.get(`/satellite/ndvi/${farmId}`, { params });
    return data;
  },

  /**
   * Get computed vegetation health score and crop assessment (no image).
   * @param {string} farmId
   * @param {{ startDate?: string, endDate?: string }} [params]
   */
  getHealth: async (farmId, params = {}) => {
    const { data } = await api.get(`/satellite/health/${farmId}`, { params });
    return data;
  },

  /**
   * Get scene history (capture dates, cloud cover) for a date range.
   * @param {string} farmId
   * @param {{ layer?: string, startDate?: string, endDate?: string }} [params]
   */
  getHistory: async (farmId, params = {}) => {
    const { data } = await api.get(`/satellite/history/${farmId}`, { params });
    return data;
  },

  /**
   * Get timelapse frames (last week / last month / last season).
   * @param {string} farmId
   * @param {{ layer?: string }} [params]
   */
  getTimelapse: async (farmId, params = {}) => {
    const { data } = await api.get(`/satellite/timelapse/${farmId}`, { params });
    return data;
  },

  /**
   * Low-level: fetch a single image for any layer and date range.
   * @param {string} farmId
   * @param {{ layer?: string, startDate?: string, endDate?: string }} [params]
   */
  getImage: async (farmId, params = {}) => {
    const { data } = await api.get(`/satellite/image/${farmId}`, { params });
    return data;
  },

  /**
   * Low-level: fetch scene metadata only.
   * @param {string} farmId
   * @param {{ layer?: string, startDate?: string, endDate?: string }} [params]
   */
  getMetadata: async (farmId, params = {}) => {
    const { data } = await api.get(`/satellite/metadata/${farmId}`, { params });
    return data;
  },

  /**
   * Invalidate cached satellite data for a farm and trigger fresh fetch.
   * @param {string} farmId
   */
  refreshCache: async (farmId) => {
    const { data } = await api.post(`/satellite/refresh/${farmId}`);
    return data;
  },
};
