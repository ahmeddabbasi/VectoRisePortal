"use client";

import { CategoriesProvider } from "@/components/CategoriesProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <CategoriesProvider>{children}</CategoriesProvider>;
}
