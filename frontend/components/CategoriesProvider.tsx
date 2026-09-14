"use client";

import { createContext, useContext, useEffect, useState } from "react";
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
    api.categories().then((r) => setCategories(r.categories)).catch(() => {});
  }, []);

  return <CategoriesContext.Provider value={categories}>{children}</CategoriesContext.Provider>;
}
