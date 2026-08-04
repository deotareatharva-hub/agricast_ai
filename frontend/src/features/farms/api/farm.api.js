import { api } from "../../../lib/axios";

// All farm-related network calls live here. Components and hooks never
// call axios directly - they go through this API layer, same convention
// as features/auth/api/auth.api.js.
export const farmApi = {
  list: async (params = {}) => {
    const { data } = await api.get("/farms", { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/farms/${id}`);
    return data;
  },

  create: async (payload) => {
    const { data } = await api.post("/farms", payload);
    return data;
  },

  update: async (id, payload) => {
    const { data } = await api.put(`/farms/${id}`, payload);
    return data;
  },

  remove: async (id) => {
    const { data } = await api.delete(`/farms/${id}`);
    return data;
  },
};
