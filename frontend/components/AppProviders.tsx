"use client";

import { CategoriesProvider } from "@/components/CategoriesProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { PortalStatusProvider } from "@/contexts/PortalStatusContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PortalStatusProvider>
        <CategoriesProvider>{children}</CategoriesProvider>
      </PortalStatusProvider>
    </AuthProvider>
  );
}
