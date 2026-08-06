import axios from "axios";

// Centralized Axios instance. Every API call in the app must go through
// this instance so that base URL, auth headers, and error handling stay
// consistent across features.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

const TOKEN_KEY = "agricast_token";

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Attach the JWT (if present) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error responses and handle expired/invalid sessions globally.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      tokenStorage.clear();
    }

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong. Please try again.";

    return Promise.reject({ ...error, message });
  }
);
