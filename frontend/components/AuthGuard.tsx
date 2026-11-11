"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getHomeRoute } from "@/lib/auth";

export function AuthGuard({ children, role }: { children: React.ReactNode; role?: "admin" | "employee" }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (role && user.role !== role) {
      router.replace(getHomeRoute(user.role));
    }
  }, [user, loading, role, router]);

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">Loading...</div>;
  }
  if (!user || (role && user.role !== role)) {
    return <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">Redirecting...</div>;
  }
  return <>{children}</>;
}
