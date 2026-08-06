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

  // `credential` is the ID token Google Identity Services hands back to
  // the frontend after a successful Google sign-in.
  google: async (credential) => {
    const { data } = await api.post("/auth/google", { credential });
    return data;
  },

  // Reads the HttpOnly refresh cookie server-side; no body needed here.
  refresh: async () => {
    const { data } = await api.post("/auth/refresh");
    return data;
  },

  logout: async () => {
    const { data } = await api.post("/auth/logout");
    return data;
  },

  getProfile: async () => {
    const { data } = await api.get("/auth/me");
    return data;
  },
};
