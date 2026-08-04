import { api } from "../../../lib/axios";

// All auth-related network calls live here. Components and hooks never
// call axios directly - they go through this API layer.
export const authApi = {
  register: async ({ fullName, email, password }) => {
    const { data } = await api.post("/auth/register", {
      fullName,
      email,
      password,
    });
    return data;
  },

  login: async ({ email, password }) => {
    const { data } = await api.post("/auth/login", { email, password });
    return data;
  },

  getProfile: async () => {
    const { data } = await api.get("/auth/me");
    return data;
  },
};
