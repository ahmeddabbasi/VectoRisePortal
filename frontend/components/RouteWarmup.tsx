"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { api } from "@/lib/api";

export const ADMIN_ROUTES = [
  "/admin/dashboard",
  "/admin/employees",
  "/admin/departments",
  "/admin/attendance",
  "/admin/schedules",
  "/admin/tasks",
  "/admin/exceptions",
  "/admin/reports",
  "/admin/evaluations",
  "/admin/announcements",
  "/admin/settings",
  "/admin/audit",
  "/admin/notifications",
  "/admin/chat",
  "/admin/sales",
  "/admin/sales/leads",
  "/admin/sales/pipeline",
  "/admin/sales/activity",
  "/admin/sales/analytics",
  "/admin/sales/settings",
];

export const EMPLOYEE_ROUTES = [
  "/employee/dashboard",
  "/employee/attendance",
  "/employee/schedule",
  "/employee/tasks",
  "/employee/performance",
  "/employee/exceptions",
  "/employee/notifications",
  "/employee/profile",
  "/employee/chat",
];

function warmRoute(router: ReturnType<typeof useRouter>, route: string) {
  router.prefetch(route);
  api.prefetchRoute(route);
}

/** Prefetch current route immediately; stagger JS + API for sidebar routes in background. */
export function RouteWarmup({ routes }: { routes: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const warmed = useRef(new Set<string>());

  useEffect(() => {
    warmRoute(router, pathname);
    warmed.current.add(pathname);
  }, [pathname, router]);

  useEffect(() => {
    const pending = routes.filter((r) => r !== pathname && !warmed.current.has(r));
    if (!pending.length) return;

    let index = 0;
    let timer: number;
    const step = () => {
      const route = pending[index];
      if (!route) return;
      warmed.current.add(route);
      warmRoute(router, route);
      index += 1;
      if (index < pending.length) timer = window.setTimeout(step, 600);
    };
    timer = window.setTimeout(step, 1500);
    return () => window.clearTimeout(timer);
  }, [routes, pathname, router]);

  return null;
}
