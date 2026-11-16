"use client";

import { Suspense } from "react";
import { Overview } from "@/components/oversight/Overview";
import { PageSkeleton } from "@/components/oversight/Chrome";

export default function EmployeeOversightPage() {
  return <Suspense fallback={<PageSkeleton />}><Overview base="/employee/oversight" /></Suspense>;
}
