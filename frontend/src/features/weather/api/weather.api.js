import { api } from "../../../lib/axios";

// All weather-related network calls live here, same convention as
// features/farms/api/farm.api.js.
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

  getHistory: async (farmId, params = {}) => {
    const { data } = await api.get(`/weather/history/${farmId}`, { params });
    return data;
  },
};
