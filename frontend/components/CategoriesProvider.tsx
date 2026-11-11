"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { api } from "@/lib/api";

const CategoriesContext = createContext<string[]>([]);

export function useCategories() {
  return useContext(CategoriesContext);
}

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<string[]>(
    () => api.getCached<{ categories: string[] }>(api.paths.categories())?.categories ?? []
  );

  useEffect(() => {
    if (!getToken()) return;
    api.categories().then((r) => setCategories(r.categories)).catch(() => {});
  }, []);

  return <CategoriesContext.Provider value={categories}>{children}</CategoriesContext.Provider>;
}
