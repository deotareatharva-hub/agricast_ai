import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { tokenStorage } from "../lib/axios";
import { authApi } from "../features/auth/api/auth.api";

const AuthContext = createContext(null);

// Wraps the whole app. Owns the current user + in-memory access token, and
// exposes login/register/googleLogin/logout/refreshSession/getCurrentUser
// so any component can trigger or react to an auth state change.
//
// Auth upgrade: the access token is no longer persisted to localStorage.
// On first load there's nothing in memory yet, so we silently try
// /auth/refresh (which relies on the HttpOnly refresh cookie) to restore
// the session - this replaces the old "read token from localStorage" boot.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data } = await authApi.refresh();
        tokenStorage.set(data.accessToken || data.token);
        setUser(data.user);
      } catch {
        // No valid refresh cookie (never logged in, expired, or revoked) -
        // that's a normal, expected outcome, not an error to surface.
        tokenStorage.clear();
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);
    tokenStorage.set(data.accessToken || data.token);
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    tokenStorage.set(data.accessToken || data.token);
    setUser(data.user);
    return data;
  };

  // `credential` is the Google ID token from GoogleLoginButton's onSuccess.
  const googleLogin = async (credential) => {
    const { data } = await authApi.google(credential);
    tokenStorage.set(data.accessToken || data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the network call fails, still clear local state so the
      // user isn't stuck "logged in" on a dead session.
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  };

  // Exchanges the refresh cookie for a new access token without touching
  // `user`. Exposed for components that want to proactively renew a
  // session (the axios interceptor already does this automatically on a
  // 401, so most code never needs to call this directly).
  const refreshSession = useCallback(async () => {
    const { data } = await authApi.refresh();
    tokenStorage.set(data.accessToken || data.token);
    setUser(data.user);
    return data.user;
  }, []);

  // Re-fetches the current user from the server (e.g. after a profile edit).
  const getCurrentUser = useCallback(async () => {
    const { data } = await authApi.getProfile();
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      login,
      register,
      googleLogin,
      logout,
      refreshSession,
      getCurrentUser,
    }),
    [user, isInitializing, refreshSession, getCurrentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
