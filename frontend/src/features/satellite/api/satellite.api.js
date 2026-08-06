import { api } from "../../../lib/axios";

export const satelliteApi = {
  getLayers: async () => {
    const { data } = await api.get("/satellite/layers");
    return data;
  },

  getImage: async (farmId, params = {}) => {
    const { data } = await api.get(`/satellite/image/${farmId}`, { params });
    return data;
  },

  getMetadata: async (farmId, params = {}) => {
    const { data } = await api.get(`/satellite/metadata/${farmId}`, { params });
    return data;
  },
};
