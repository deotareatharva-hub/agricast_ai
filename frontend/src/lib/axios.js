import axios from "axios";

// Centralized Axios instance. Every API call in the app must go through
// this instance so that base URL, auth headers, and error handling stay
// consistent across features.
//
// Auth upgrade: the access token now lives in memory only (never
// localStorage) since it's short-lived (15m) and refreshed silently via
// the HttpOnly refresh cookie. `withCredentials: true` is required so the
// browser sends that cookie to the backend's /auth endpoints.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 15000,
});

// Plain axios instance for the refresh call itself - deliberately has none
// of the interceptors below, so refreshing never re-triggers refresh logic.
const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
});

let accessToken = null;

// In-memory access token store. Named `tokenStorage` (not `accessTokenStore`)
// to keep the import name every existing caller already uses.
export const tokenStorage = {
  get: () => accessToken,
  set: (token) => {
    accessToken = token;
  },
  clear: () => {
    accessToken = null;
  },
};

// Attach the access token (if present) to every outgoing request.
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Queues requests that arrive while a refresh is already in flight, so a
// burst of parallel 401s triggers exactly one /auth/refresh call.
let refreshPromise = null;

function performRefresh() {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post("/auth/refresh")
      .then(({ data }) => {
        const newToken = data?.data?.accessToken || data?.data?.token;
        tokenStorage.set(newToken);
        return newToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Normalize error responses and transparently refresh+retry on an expired
// access token. Only retries once per request to avoid infinite loops.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.includes("/auth/");

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const newToken = await performRefresh();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        tokenStorage.clear();
      }
    }

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
