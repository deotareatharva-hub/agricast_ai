import { api } from "../../../lib/axios";

export const aiApi = {
  recommend: async ({ farmId, language, sensorSnapshot }) => {
    const { data } = await api.post("/ai/recommend", { farmId, language, sensorSnapshot });
    return data;
  },

  getHistory: async (farmId, params = {}) => {
    const { data } = await api.get(`/ai/history/${farmId}`, { params });
    return data;
  },

  getLatest: async (farmId) => {
    const { data } = await api.get(`/ai/latest/${farmId}`);
    return data;
  },
};
