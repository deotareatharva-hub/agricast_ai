import { api } from "../../../lib/axios";

export const reportsApi = {
  list: async (params = {}) => {
    const { data } = await api.get("/reports", { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/reports/${id}`);
    return data;
  },

  generate: async (payload) => {
    const { data } = await api.post("/reports/generate", payload);
    return data;
  },

  remove: async (id) => {
    const { data } = await api.delete(`/reports/${id}`);
    return data;
  },

  // Downloads stream through axios so the Authorization header is sent -
  // a plain <a href> to the API can't attach the JWT.
  download: async (id) => {
    const { data, headers } = await api.get(`/reports/${id}/download`, {
      responseType: "blob",
    });
    return { blob: data, contentType: headers["content-type"] };
  },
};
