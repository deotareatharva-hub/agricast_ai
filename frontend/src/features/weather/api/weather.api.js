import { api } from "../../../lib/axios";

// All weather network calls live here. Components and hooks never call
// axios directly - same convention as features/farms/api/farm.api.js.
//
// The frontend NEVER calls Open-Meteo (or any third-party weather
// provider) directly - every request goes through our own backend
// (backend/src/modules/weather/), which already owns the Open-Meteo
// integration, farm-ownership checks, and caching. JWT auth is attached
// automatically by the shared `api` axios instance (see lib/axios.js
// interceptor) - no per-call auth handling needed here.
//
// Endpoint paths match backend/src/modules/weather/weather.routes.js
// exactly: farmId is a trailing path param (not a query param, not
// farm-nested), and every response follows the app-wide
// `{ success, message, data }` envelope built by utils/ApiResponse.js.
export const weatherApi = {
  getCurrent: async (farmId) => {
    const { data } = await api.get(`/weather/current/${farmId}`);
    return data;
  },

  getHourly: async (farmId) => {
    const { data } = await api.get(`/weather/hourly/${farmId}`);
    return data;
  },

  getDaily: async (farmId) => {
    const { data } = await api.get(`/weather/daily/${farmId}`);
    return data;
  },

  // startDate/endDate are optional YYYY-MM-DD strings - the backend
  // defaults to the last 7 days when neither is supplied.
  getHistory: async (farmId, { startDate, endDate } = {}) => {
    const { data } = await api.get(`/weather/history/${farmId}`, {
      params: { startDate, endDate },
    });
    return data;
  },
};
