"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getHomeRoute, getStoredAuth } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const auth = getStoredAuth();
    if (!auth) {
      router.replace("/login");
      return;
    }
    router.replace(getHomeRoute(auth.role));
  }, [router]);

  return null;
}
