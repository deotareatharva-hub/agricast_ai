import { api } from "../../../lib/axios";

export const analyticsApi = {
  getDashboard: async (farmId) => {
    const { data } = await api.get(`/analytics/dashboard/${farmId}`);
    return data;
  },

  getWeatherAnalytics: async (farmId, params = {}) => {
    const { data } = await api.get(`/analytics/weather/${farmId}`, { params });
    return data;
  },

  getRecommendationAnalytics: async (farmId, params = {}) => {
    const { data } = await api.get(`/analytics/recommendations/${farmId}`, { params });
    return data;
  },

  getSummary: async (farmId, params = {}) => {
    const { data } = await api.get(`/analytics/summary/${farmId}`, { params });
    return data;
  },
};
