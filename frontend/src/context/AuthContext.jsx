import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { tokenStorage } from "../lib/axios";
import { authApi } from "../features/auth/api/auth.api";

const AuthContext = createContext(null);

// Wraps the whole app. Owns the current user + auth token, and exposes
// login/register/logout so any component can trigger an auth state change.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = tokenStorage.get();
      if (!token) {
        setIsInitializing(false);
        return;
      }
      try {
        const { data } = await authApi.getProfile();
        setUser(data.user);
      } catch {
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
    tokenStorage.set(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    tokenStorage.set(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      login,
      register,
      logout,
    }),
    [user, isInitializing]
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
