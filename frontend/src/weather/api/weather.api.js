import { api } from "../../../lib/axios";

// Weather API
// Same architecture as farmApi.
// Backend handles OpenMeteo + cache + DTO mapping.
// Frontend only consumes DTOs.

export const weatherApi = {
  current: async (farmId) => {
    const { data } = await api.get(`/weather/${farmId}/current`);
    return data.data;
  },

  hourly: async (farmId) => {
    const { data } = await api.get(`/weather/${farmId}/hourly`);
    return data.data;
  },

  daily: async (farmId) => {
    const { data } = await api.get(`/weather/${farmId}/daily`);
    return data.data;
  },

  history: async (farmId, params = {}) => {
    const { data } = await api.get(`/weather/${farmId}/history`, {
      params,
    });

    return data.data;
  },
};