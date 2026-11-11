"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthUser, clearAuth, getHomeRoute, getStoredAuth, storeAuth } from "@/lib/auth";
import { api, setOnUnauthorized } from "@/lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    setOnUnauthorized(logout);
  }, [logout]);

  useEffect(() => {
    const stored = getStoredAuth();
    if (!stored?.token) {
      setLoading(false);
      return;
    }
    setUser(stored);
    setLoading(false);
    api.me()
      .then((me) => {
        const authUser: AuthUser = {
          email: me.email,
          role: me.role as AuthUser["role"],
          employee_id: me.employee_id,
          name: me.name,
          token: stored.token,
          sales_access: Boolean(me.sales_access),
          can_review_tasks: Boolean(me.can_review_tasks),
        };
        storeAuth(authUser);
        setUser(authUser);
      })
      .catch(() => {
        clearAuth();
        setUser(null);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    api.clearCache();
    const authUser: AuthUser = {
      email: result.email,
      role: result.role as AuthUser["role"],
      employee_id: result.employee_id,
      name: result.name,
      token: result.access_token,
      sales_access: Boolean(result.sales_access),
      can_review_tasks: Boolean(result.can_review_tasks),
    };
    storeAuth(authUser);
    setUser(authUser);
    return getHomeRoute(authUser.role);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
